(() => {
  'use strict';

  const MASTER = 2048;
  const byId = (id) => document.getElementById(id);
  const v2 = {
    mode: 'product-cooking',
    productOriginal: null,
    productOriginalSrc: '',
    cookingImage: null,
    cookingSrc: '',
    threshold: 242,
  };

  function stage() {
    return (window.Konva && Array.isArray(Konva.stages)) ? Konva.stages[0] : null;
  }

  function contentLayer() {
    const s = stage();
    return s?.getChildren?.()[1] || null;
  }

  function productNode() {
    const s = stage();
    return s?.findOne?.('[dataRole="productImage"]') || null;
  }

  function cookingNode() {
    const s = stage();
    return s?.findOne?.('[dataRole="cookingImageV2"]') || null;
  }

  function toast(message) {
    const t = byId('toast');
    if (!t) return;
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2100);
  }

  function setStatus(id, text, state = '') {
    const box = byId(id);
    if (!box) return;
    box.classList.remove('ready', 'warn');
    if (state) box.classList.add(state);
    const span = box.querySelector('span');
    if (span) span.textContent = text;
  }

  function readImage(file, done) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => done(img, String(reader.result || ''));
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  function rememberProduct(file) {
    readImage(file, (img, src) => {
      v2.productOriginal = img;
      v2.productOriginalSrc = src;
      setStatus('productVisualStatus', '실물 상품 원본이 보호 상태로 저장되었습니다', 'ready');
    });
  }

  function removeWhiteBackground(source, threshold) {
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = imageData.data;
    const softStart = Math.max(180, threshold - 28);
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const neutral = max - min < 24;
      if (!neutral || min < softStart) continue;
      if (min >= threshold) {
        px[i + 3] = 0;
      } else {
        const ratio = (threshold - min) / Math.max(1, threshold - softStart);
        px[i + 3] = Math.round(px[i + 3] * Math.min(1, Math.max(0, ratio)));
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    return new Promise((resolve) => { img.onload = () => resolve(img); });
  }

  async function applyCutout() {
    const node = productNode();
    const source = v2.productOriginal || node?.image?.();
    if (!node || !source) {
      toast('먼저 실제 상품사진을 업로드해주세요');
      return;
    }
    const result = await removeWhiteBackground(source, v2.threshold);
    node.image(result);
    node.getLayer()?.batchDraw();
    setStatus('productVisualStatus', '흰 배경 누끼가 적용되었습니다 · 상품 자체는 변형하지 않았습니다', 'ready');
    toast('상품 누끼를 적용했습니다');
  }

  function restoreProduct() {
    const node = productNode();
    if (!node || !v2.productOriginal) {
      toast('복원할 상품 원본이 없습니다');
      return;
    }
    node.image(v2.productOriginal);
    node.getLayer()?.batchDraw();
    setStatus('productVisualStatus', '실물 상품 원본 상태입니다', 'ready');
    toast('상품 원본을 복원했습니다');
  }

  function fitNode(node, box, image) {
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    const ratio = Math.min(box.w / iw, box.h / ih);
    node.position({ x: box.x + (box.w - iw * ratio) / 2, y: box.y + (box.h - ih * ratio) / 2 });
    node.size({ width: iw * ratio, height: ih * ratio });
    node.scale({ x: 1, y: 1 });
  }

  function addCookingNode() {
    if (!v2.cookingImage) return null;
    const layer = contentLayer();
    if (!layer) return null;
    cookingNode()?.destroy();
    const image = new Konva.Image({
      image: v2.cookingImage,
      x: 120,
      y: 780,
      width: 1100,
      height: 880,
      draggable: true,
      name: 'cooking-v2',
      shadowColor: '#000',
      shadowBlur: 34,
      shadowOpacity: 0.18,
      shadowOffsetY: 18,
    });
    image.setAttr('dataRole', 'cookingImageV2');
    image.setAttr('displayName', '조리예시 이미지');
    layer.add(image);
    layer.draw();
    return image;
  }

  function loadCooking(file) {
    readImage(file, (img, src) => {
      v2.cookingImage = img;
      v2.cookingSrc = src;
      addCookingNode();
      setStatus('cookingVisualStatus', '조리예시가 준비되었습니다', 'ready');
      toast('조리예시 이미지를 불러왔습니다');
    });
  }

  function composeMainVisual() {
    const p = productNode();
    if (!p) {
      toast('먼저 상품사진을 업로드해주세요');
      return;
    }
    let c = cookingNode();
    if (!c && v2.cookingImage) c = addCookingNode();
    if (!c) {
      setStatus('cookingVisualStatus', '조리예시가 없습니다 · 조리사진을 추가하거나 AI 생성 연동이 필요합니다', 'warn');
      toast('조리예시 이미지를 먼저 추가해주세요');
      return;
    }

    const pi = p.image();
    const ci = c.image();
    if (v2.mode === 'product-only') {
      fitNode(p, { x: 710, y: 520, w: 1200, h: 1270 }, pi);
      c.visible(false);
    } else if (v2.mode === 'cooking-focus') {
      c.visible(true);
      fitNode(c, { x: 90, y: 620, w: 1500, h: 1240 }, ci);
      fitNode(p, { x: 1280, y: 260, w: 650, h: 850 }, pi);
      p.moveToTop();
    } else {
      c.visible(true);
      fitNode(c, { x: 70, y: 720, w: 1450, h: 1180 }, ci);
      fitNode(p, { x: 1190, y: 310, w: 760, h: 1010 }, pi);
      c.moveToTop();
    }
    const layer = p.getLayer();
    layer?.batchDraw();
    toast('상품 + 조리예시 메인 구성을 적용했습니다');
  }

  function selectMode(mode) {
    v2.mode = mode;
    document.querySelectorAll('[data-visual-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.visualMode === mode);
    });
  }

  function ensureCookingAfterTemplateChange() {
    if (!v2.cookingImage) return;
    window.setTimeout(() => {
      if (!cookingNode()) addCookingNode();
    }, 60);
  }

  function bind() {
    const productInput = byId('productImageInput');
    productInput?.addEventListener('change', (event) => rememberProduct(event.target.files?.[0]), { capture: true });

    byId('cookingImageInput')?.addEventListener('change', (event) => loadCooking(event.target.files?.[0]));
    byId('applyCutoutBtn')?.addEventListener('click', applyCutout);
    byId('restoreProductBtn')?.addEventListener('click', restoreProduct);
    byId('composeMainBtn')?.addEventListener('click', composeMainVisual);
    byId('cutoutThreshold')?.addEventListener('input', (event) => {
      v2.threshold = Number(event.target.value || 242);
      const out = byId('cutoutThresholdValue');
      if (out) out.value = String(v2.threshold);
    });
    document.querySelectorAll('[data-visual-mode]').forEach((button) => {
      button.addEventListener('click', () => selectMode(button.dataset.visualMode));
    });
    document.querySelectorAll('.template-card').forEach((button) => button.addEventListener('click', ensureCookingAfterTemplateChange));
    byId('requestCookingAiBtn')?.addEventListener('click', () => {
      setStatus('cookingVisualStatus', 'AI 조리예시는 서버 이미지 생성 API를 연결한 뒤 사용할 수 있습니다', 'warn');
      toast('AI 조리예시는 서버 연동 단계에서 활성화합니다');
    });
  }

  window.addEventListener('DOMContentLoaded', bind);
})();

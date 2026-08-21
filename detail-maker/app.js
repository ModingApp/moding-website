(() => {
  'use strict';

  const MASTER = 2048;
  const COLORS = {
    green: '#238B22',
    greenDark: '#1C6F1C',
    orange: '#FF8C00',
    ink: '#173119',
    sub: '#687269',
    soft: '#F4F7F4',
    line: '#DDE5DD',
    white: '#FFFFFF',
  };
  const PAGE_META = {
    main: {
      label: '메인',
      file: '01-메인',
      guide: '상품명과 핵심문구를 보여주는 메인 이미지입니다.',
    },
    usage: {
      label: '상세 1',
      file: '02-추천업종-활용메뉴',
      guide: '추천 업종과 활용 메뉴를 한눈에 보여주는 페이지입니다.',
    },
    spec: {
      label: '상세 2',
      file: '03-상품스펙-성분',
      guide: '구성·중량·보관·포장·성분을 정리한 페이지입니다.',
    },
    sticker: {
      label: '스티커',
      file: '04-상품스티커',
      guide: '상품 포장에 사용할 표시 정보 스티커입니다.',
    },
  };
  const FORM_IDS = [
    'productName',
    'productWeight',
    'productStorage',
    'productPackage',
    'productComposition',
    'productHeadline',
    'productDescription',
    'productIngredients',
    'productOrigin',
    'trade1',
    'trade2',
    'trade3',
    'menu1',
    'menu2',
  ];

  const byId = (id) => document.getElementById(id);
  const state = {
    currentPage: 'main',
    selected: null,
    zoom: 0.35,
    generated: false,
    processingProduct: false,
    useOriginalProduct: false,
    productOriginal: null,
    productOriginalSrc: '',
    productProcessed: null,
    productProcessedSrc: '',
    cookingImage: null,
    cookingSrc: '',
    pageGroups: new Map(),
  };

  if (!window.Konva) {
    window.alert('캔버스 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침해 주세요.');
    return;
  }

  const stage = new Konva.Stage({
    container: 'stageContainer',
    width: MASTER,
    height: MASTER,
  });
  const contentLayer = new Konva.Layer();
  const uiLayer = new Konva.Layer();
  const transformer = new Konva.Transformer({
    rotateEnabled: true,
    borderStroke: COLORS.orange,
    anchorStroke: COLORS.orange,
    anchorFill: '#fff',
    anchorSize: 18,
    borderDash: [10, 8],
    keepRatio: false,
    ignoreStroke: true,
  });
  stage.add(contentLayer, uiLayer);
  uiLayer.add(transformer);

  function toast(message) {
    const box = byId('toast');
    if (!box) return;
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => box.classList.remove('show'), 2200);
  }

  function value(id, fallback = '') {
    return String(byId(id)?.value ?? fallback).trim();
  }

  function safeName(input) {
    return String(input || 'moding-detail')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '-')
      .slice(0, 80);
  }

  function setStatus(id, text, type = '') {
    const box = byId(id);
    if (!box) return;
    box.classList.remove('ready', 'warn');
    if (type) box.classList.add(type);
    const span = box.querySelector('span');
    if (span) span.textContent = text;
  }

  function setPreview(id, src) {
    const box = byId(id);
    if (!box) return;
    box.style.backgroundImage = src ? `url("${src}")` : '';
    box.classList.toggle('empty', !src);
    const label = box.querySelector('span');
    if (label) label.hidden = Boolean(src);
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('파일이 없습니다.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
        image.onload = () => resolve({ image, src: String(reader.result || '') });
        image.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  function imageFromSrc(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('저장된 이미지를 복원하지 못했습니다.'));
      image.src = src;
    });
  }

  async function removeConnectedWhiteBackground(source, threshold) {
    const sourceWidth = source.naturalWidth || source.width;
    const sourceHeight = source.naturalHeight || source.height;
    const maxSide = 2200;
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(source, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const total = width * height;
    const visited = new Uint8Array(total);
    const queue = new Int32Array(total);
    const softStart = Math.max(185, threshold - 30);
    let head = 0;
    let tail = 0;
    let removed = 0;

    function isBackground(index) {
      const offset = index * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      return min >= softStart && max - min < 30;
    }

    function enqueue(index) {
      if (index < 0 || index >= total || visited[index] || !isBackground(index)) return;
      visited[index] = 1;
      queue[tail] = index;
      tail += 1;
    }

    for (let x = 0; x < width; x += 1) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 1; y < height - 1; y += 1) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }

    while (head < tail) {
      const index = queue[head];
      head += 1;
      const x = index % width;
      const y = Math.floor(index / width);
      if (x > 0) enqueue(index - 1);
      if (x + 1 < width) enqueue(index + 1);
      if (y > 0) enqueue(index - width);
      if (y + 1 < height) enqueue(index + width);
    }

    for (let index = 0; index < total; index += 1) {
      if (!visited[index]) continue;
      const offset = index * 4;
      const min = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
      const originalAlpha = pixels[offset + 3];
      if (min >= threshold) {
        pixels[offset + 3] = 0;
      } else {
        const ratio = (threshold - min) / Math.max(1, threshold - softStart);
        pixels[offset + 3] = Math.round(originalAlpha * Math.min(1, Math.max(0, ratio)));
      }
      if (pixels[offset + 3] < originalAlpha) removed += 1;
    }

    context.putImageData(imageData, 0, 0);
    const src = canvas.toDataURL('image/png');
    const image = await imageFromSrc(src);
    return { image, src, removedRatio: removed / Math.max(1, total) };
  }

  function currentProductAsset() {
    if (state.useOriginalProduct || !state.productProcessed) {
      return { image: state.productOriginal, src: state.productOriginalSrc };
    }
    return { image: state.productProcessed, src: state.productProcessedSrc };
  }

  async function processProductImage() {
    if (!state.productOriginal) {
      toast('먼저 실제 상품사진을 업로드해 주세요');
      return;
    }
    state.processingProduct = true;
    setStatus('productVisualStatus', '흰 배경을 안전하게 확인하고 있습니다', 'warn');
    const threshold = Number(byId('cutoutThreshold')?.value || 242);
    try {
      const result = await removeConnectedWhiteBackground(state.productOriginal, threshold);
      state.productProcessed = result.image;
      state.productProcessedSrc = result.src;
      state.useOriginalProduct = false;
      setPreview('productPreview', result.src);
      if (result.removedRatio > 0.003) {
        setStatus('productVisualStatus', '가장자리의 흰 배경만 자동으로 정리했습니다', 'ready');
      } else {
        setStatus('productVisualStatus', '흰 배경이 없어 원본을 템플릿 영역 안에 배치합니다', 'ready');
      }
    } catch (error) {
      console.error(error);
      state.productProcessed = state.productOriginal;
      state.productProcessedSrc = state.productOriginalSrc;
      state.useOriginalProduct = true;
      setPreview('productPreview', state.productOriginalSrc);
      setStatus('productVisualStatus', '배경 정리를 건너뛰고 원본을 사용합니다', 'warn');
    } finally {
      state.processingProduct = false;
    }
  }

  function formData() {
    const data = {};
    FORM_IDS.forEach((id) => {
      data[id] = value(id);
    });
    return data;
  }

  function setFormData(data = {}) {
    FORM_IDS.forEach((id) => {
      if (Object.prototype.hasOwnProperty.call(data, id) && byId(id)) {
        byId(id).value = data[id] ?? '';
      }
    });
  }

  function textNode(pageId, role, label, config, locked = false) {
    const node = new Konva.Text({
      fontFamily: 'Arial, Noto Sans KR, Apple SD Gothic Neo, sans-serif',
      fill: COLORS.ink,
      fontStyle: 'bold',
      lineHeight: 1.12,
      wrap: 'word',
      draggable: !locked,
      ...config,
    });
    return addMeta(node, pageId, role, label, locked);
  }

  function rectNode(pageId, role, label, config, locked = true) {
    const node = new Konva.Rect({
      draggable: !locked,
      ...config,
    });
    return addMeta(node, pageId, role, label, locked);
  }

  function addMeta(node, pageId, role, label, locked = false) {
    node.setAttr('pageId', pageId);
    node.setAttr('dataRole', role);
    node.setAttr('displayName', label);
    node.setAttr('locked', locked);
    node.draggable(!locked);
    node.on('click tap', (event) => {
      event.cancelBubble = true;
      selectNode(node);
    });
    node.on('dragend transformend', () => {
      if (state.selected === node) syncInspector();
    });
    return node;
  }

  function createPageGroup(pageId, background) {
    const group = new Konva.Group({ name: `page-${pageId}` });
    group.setAttr('pageId', pageId);
    group.add(rectNode(pageId, 'pageBackground', '페이지 배경', {
      x: 0,
      y: 0,
      width: MASTER,
      height: MASTER,
      fill: background,
      listening: false,
    }, true));
    contentLayer.add(group);
    state.pageGroups.set(pageId, group);
    return group;
  }

  function addBrandMark(group, pageId, x = 150, y = 125) {
    group.add(textNode(pageId, 'brandKicker', '상단 라벨', {
      x,
      y,
      width: 560,
      text: 'MODING PRODUCT',
      fontSize: 30,
      letterSpacing: 4,
      fill: COLORS.orange,
    }, true));
  }

  function roundedClip(context, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    context.beginPath();
    context.moveTo(r, 0);
    context.lineTo(width - r, 0);
    context.quadraticCurveTo(width, 0, width, r);
    context.lineTo(width, height - r);
    context.quadraticCurveTo(width, height, width - r, height);
    context.lineTo(r, height);
    context.quadraticCurveTo(0, height, 0, height - r);
    context.lineTo(0, r);
    context.quadraticCurveTo(0, 0, r, 0);
    context.closePath();
  }

  function addImageBox(group, pageId, role, label, asset, box, options = {}) {
    if (!asset?.image) return null;
    const mode = options.mode || 'contain';
    const radius = options.radius || 0;
    const locked = options.locked !== false;
    const wrapper = new Konva.Group({
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      clipFunc(context) {
        roundedClip(context, box.w, box.h, radius);
      },
    });
    addMeta(wrapper, pageId, role, label, locked);
    wrapper.setAttr('imageSrc', asset.src || '');
    wrapper.setAttr('imageMode', mode);
    wrapper.setAttr('clipRadius', radius);

    if (options.background) {
      wrapper.add(new Konva.Rect({
        x: 0,
        y: 0,
        width: box.w,
        height: box.h,
        fill: options.background,
        listening: false,
      }));
    }

    const imageWidth = asset.image.naturalWidth || asset.image.width;
    const imageHeight = asset.image.naturalHeight || asset.image.height;
    const ratio = mode === 'cover'
      ? Math.max(box.w / imageWidth, box.h / imageHeight)
      : Math.min(box.w / imageWidth, box.h / imageHeight);
    const renderedWidth = imageWidth * ratio;
    const renderedHeight = imageHeight * ratio;
    wrapper.add(new Konva.Image({
      image: asset.image,
      x: (box.w - renderedWidth) / 2,
      y: (box.h - renderedHeight) / 2,
      width: renderedWidth,
      height: renderedHeight,
      listening: false,
    }));
    if (options.shadow) {
      wrapper.shadowColor('#000');
      wrapper.shadowBlur(options.shadow.blur || 28);
      wrapper.shadowOpacity(options.shadow.opacity || 0.16);
      wrapper.shadowOffsetY(options.shadow.y || 14);
    }
    group.add(wrapper);
    return wrapper;
  }

  function addProductOrPlaceholder(group, pageId, box, role = 'productImage') {
    const product = currentProductAsset();
    if (product.image) {
      return addImageBox(group, pageId, role, '실제 상품사진', product, box, {
        mode: 'contain',
        radius: 42,
        locked: true,
      });
    }
    group.add(rectNode(pageId, `${role}Placeholder`, '상품사진 영역', {
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      cornerRadius: 42,
      fill: '#FFFFFF',
      stroke: COLORS.line,
      strokeWidth: 3,
      dash: [18, 14],
      listening: false,
    }, true));
    group.add(textNode(pageId, `${role}PlaceholderText`, '상품사진 안내', {
      x: box.x + 40,
      y: box.y + box.h / 2 - 24,
      width: box.w - 80,
      text: '실제 상품사진',
      fontSize: 38,
      align: 'center',
      fill: COLORS.sub,
    }, true));
    return null;
  }

  function buildMainPage() {
    const pageId = 'main';
    const group = createPageGroup(pageId, '#FBFCFB');
    addBrandMark(group, pageId);
    group.add(textNode(pageId, 'title', '상품명', {
      x: 145,
      y: 205,
      width: 820,
      text: value('productName', '상품명'),
      fontSize: 116,
      lineHeight: 1.02,
      fill: COLORS.greenDark,
    }));
    group.add(textNode(pageId, 'headline', '핵심문구', {
      x: 150,
      y: 390,
      width: 790,
      text: value('productHeadline'),
      fontSize: 50,
      lineHeight: 1.28,
      fill: COLORS.ink,
      fontStyle: 'normal',
    }));
    group.add(rectNode(pageId, 'heroPanel', '메인 비주얼 배경', {
      x: 1010,
      y: 120,
      width: 890,
      height: 1280,
      cornerRadius: 90,
      fill: '#EEF6EE',
      listening: false,
    }, true));

    if (state.cookingImage) {
      addImageBox(group, pageId, 'cookingImage', '조리사진', {
        image: state.cookingImage,
        src: state.cookingSrc,
      }, { x: 1048, y: 170, w: 814, h: 790 }, {
        mode: 'cover',
        radius: 68,
        background: '#fff',
        locked: true,
      });
      addProductOrPlaceholder(group, pageId, { x: 1280, y: 805, w: 560, h: 540 });
    } else {
      addProductOrPlaceholder(group, pageId, { x: 1115, y: 260, w: 690, h: 980 });
    }

    group.add(rectNode(pageId, 'infoPanel', '정보 패널', {
      x: 145,
      y: 1110,
      width: 805,
      height: 560,
      cornerRadius: 52,
      fill: '#FFFFFF',
      stroke: COLORS.line,
      strokeWidth: 3,
      listening: false,
    }, true));
    const specs = [
      ['중량', value('productWeight')],
      ['보관', value('productStorage')],
      ['포장', value('productPackage')],
    ];
    specs.forEach(([label, itemValue], index) => {
      const y = 1200 + index * 145;
      group.add(textNode(pageId, `specLabel${index}`, `${label} 라벨`, {
        x: 220,
        y,
        width: 180,
        text: label,
        fontSize: 34,
        fill: COLORS.sub,
      }));
      group.add(textNode(pageId, `specValue${index}`, `${label} 값`, {
        x: 430,
        y: y - 5,
        width: 420,
        text: itemValue,
        fontSize: 48,
        fill: COLORS.ink,
      }));
    });
    group.add(textNode(pageId, 'description', '보조문구', {
      x: 1045,
      y: 1490,
      width: 835,
      text: value('productDescription'),
      fontSize: 46,
      lineHeight: 1.42,
      fill: COLORS.sub,
      fontStyle: 'normal',
    }));
    group.add(rectNode(pageId, 'accent', '하단 포인트', {
      x: 145,
      y: 1790,
      width: 1750,
      height: 14,
      cornerRadius: 99,
      fill: COLORS.orange,
      listening: false,
    }, true));
  }

  function buildUsagePage() {
    const pageId = 'usage';
    const group = createPageGroup(pageId, '#FFFFFF');
    addBrandMark(group, pageId);
    group.add(textNode(pageId, 'title', '상단 제목', {
      x: 145,
      y: 205,
      width: 1700,
      text: '이런 업종에 추천드립니다',
      fontSize: 92,
      fill: COLORS.greenDark,
    }));
    [value('trade1'), value('trade2'), value('trade3')].forEach((trade, index) => {
      const x = 150 + index * 585;
      group.add(rectNode(pageId, `tradeBadge${index}`, `추천업종 ${index + 1}`, {
        x,
        y: 405,
        width: 500,
        height: 155,
        cornerRadius: 44,
        fill: index === 1 ? '#FFF5E8' : '#EEF6EE',
      }, false));
      group.add(textNode(pageId, `tradeText${index}`, `추천업종 문구 ${index + 1}`, {
        x: x + 35,
        y: 449,
        width: 430,
        text: trade,
        fontSize: 42,
        align: 'center',
        fill: index === 1 ? '#A85B00' : COLORS.greenDark,
      }));
    });

    if (state.cookingImage) {
      addImageBox(group, pageId, 'cookingImage', '조리사진', {
        image: state.cookingImage,
        src: state.cookingSrc,
      }, { x: 145, y: 665, w: 1210, h: 700 }, {
        mode: 'cover',
        radius: 62,
        background: '#fff',
        locked: true,
      });
      group.add(rectNode(pageId, 'productBackdrop', '상품사진 배경', {
        x: 1385,
        y: 720,
        width: 510,
        height: 610,
        cornerRadius: 58,
        fill: '#F1F7F1',
        listening: false,
      }, true));
      addProductOrPlaceholder(group, pageId, { x: 1415, y: 750, w: 450, h: 550 });
    } else {
      group.add(rectNode(pageId, 'productBackdrop', '상품사진 배경', {
        x: 300,
        y: 650,
        width: 1448,
        height: 720,
        cornerRadius: 78,
        fill: '#F3F8F3',
        listening: false,
      }, true));
      addProductOrPlaceholder(group, pageId, { x: 525, y: 690, w: 998, h: 640 });
    }

    group.add(textNode(pageId, 'menuTitle', '하단 제목', {
      x: 145,
      y: 1455,
      width: 1600,
      text: '이런 메뉴로 활용해보세요',
      fontSize: 72,
      fill: COLORS.ink,
    }));
    [value('menu1'), value('menu2')].forEach((menu, index) => {
      const x = 150 + index * 900;
      group.add(rectNode(pageId, `menuCard${index}`, `추천메뉴 카드 ${index + 1}`, {
        x,
        y: 1590,
        width: 820,
        height: 280,
        cornerRadius: 48,
        fill: '#F7F9F7',
        stroke: COLORS.line,
        strokeWidth: 2,
      }, false));
      group.add(textNode(pageId, `menuText${index}`, `추천메뉴 ${index + 1}`, {
        x: x + 40,
        y: 1680,
        width: 740,
        text: menu,
        fontSize: 54,
        align: 'center',
        fill: COLORS.greenDark,
      }));
    });
  }

  function fitTextSize(text, normal, compact, threshold) {
    return String(text || '').length > threshold ? compact : normal;
  }

  function buildSpecPage() {
    const pageId = 'spec';
    const group = createPageGroup(pageId, '#F8FAF8');
    addBrandMark(group, pageId);
    group.add(textNode(pageId, 'title', '상품명', {
      x: 145,
      y: 205,
      width: 1220,
      text: value('productName'),
      fontSize: 108,
      fill: COLORS.greenDark,
    }));
    group.add(rectNode(pageId, 'productBackdrop', '상품사진 배경', {
      x: 1430,
      y: 140,
      width: 455,
      height: 430,
      cornerRadius: 55,
      fill: '#EEF6EE',
      listening: false,
    }, true));
    addProductOrPlaceholder(group, pageId, { x: 1470, y: 180, w: 375, h: 350 });
    group.add(textNode(pageId, 'specHeading', '스펙 제목', {
      x: 150,
      y: 420,
      width: 1100,
      text: '상품 스펙 요약',
      fontSize: 62,
      fill: COLORS.orange,
    }));

    const rows = [
      ['구성', value('productComposition') || `${value('productName')} 1팩`],
      ['중량 / 사이즈', value('productWeight')],
      ['생물여부', value('productStorage')],
      ['포장방식', value('productPackage')],
    ];
    rows.forEach(([label, itemValue], index) => {
      const y = 575 + index * 190;
      group.add(rectNode(pageId, `rowBg${index}`, `스펙 행 ${index + 1}`, {
        x: 150,
        y,
        width: 1740,
        height: 145,
        cornerRadius: 32,
        fill: '#FFFFFF',
        stroke: COLORS.line,
        strokeWidth: 2,
        listening: false,
      }, true));
      group.add(textNode(pageId, `rowLabel${index}`, `${label} 라벨`, {
        x: 225,
        y: y + 48,
        width: 420,
        text: label,
        fontSize: 34,
        fill: COLORS.sub,
      }));
      group.add(textNode(pageId, `rowValue${index}`, `${label} 값`, {
        x: 690,
        y: y + 38,
        width: 1100,
        text: itemValue,
        fontSize: 46,
        fill: COLORS.ink,
      }));
    });

    group.add(rectNode(pageId, 'ingredientPanel', '성분표시 영역', {
      x: 150,
      y: 1390,
      width: 1740,
      height: 390,
      cornerRadius: 42,
      fill: '#FFFFFF',
      stroke: COLORS.line,
      strokeWidth: 2,
      listening: false,
    }, true));
    group.add(textNode(pageId, 'ingredientLabel', '성분표시 라벨', {
      x: 220,
      y: 1460,
      width: 280,
      text: '성분표시',
      fontSize: 38,
      fill: COLORS.greenDark,
    }));
    const ingredients = value('productIngredients');
    group.add(textNode(pageId, 'ingredients', '성분표시 내용', {
      x: 220,
      y: 1540,
      width: 1600,
      height: 165,
      text: ingredients,
      fontSize: fitTextSize(ingredients, 33, 27, 120),
      lineHeight: 1.5,
      fill: COLORS.ink,
      fontStyle: 'normal',
    }));
    group.add(textNode(pageId, 'origin', '원산지 안내', {
      x: 220,
      y: 1715,
      width: 1600,
      text: `원산지 · ${value('productOrigin')}`,
      fontSize: 27,
      fill: COLORS.sub,
      fontStyle: 'normal',
    }));
  }

  function buildStickerPage() {
    const pageId = 'sticker';
    const group = createPageGroup(pageId, '#EAF1EA');
    group.add(rectNode(pageId, 'stickerPaper', '스티커 바탕', {
      x: 190,
      y: 150,
      width: 1668,
      height: 1748,
      cornerRadius: 68,
      fill: '#FFFFFF',
      stroke: '#CDD9CD',
      strokeWidth: 3,
      listening: false,
    }, true));
    group.add(rectNode(pageId, 'stickerAccent', '상단 포인트', {
      x: 190,
      y: 150,
      width: 1668,
      height: 22,
      cornerRadius: [68, 68, 0, 0],
      fill: COLORS.orange,
      listening: false,
    }, true));
    group.add(textNode(pageId, 'brandKicker', '상단 라벨', {
      x: 300,
      y: 270,
      width: 650,
      text: 'MODING PRODUCT LABEL',
      fontSize: 28,
      letterSpacing: 3,
      fill: COLORS.orange,
    }, true));
    group.add(textNode(pageId, 'title', '상품명', {
      x: 295,
      y: 350,
      width: 1050,
      text: value('productName'),
      fontSize: 104,
      fill: COLORS.greenDark,
    }));
    group.add(rectNode(pageId, 'productBackdrop', '상품사진 배경', {
      x: 1410,
      y: 245,
      width: 320,
      height: 320,
      cornerRadius: 42,
      fill: '#F1F7F1',
      listening: false,
    }, true));
    addProductOrPlaceholder(group, pageId, { x: 1445, y: 275, w: 250, h: 260 });

    const rows = [
      ['구성', value('productComposition') || `${value('productName')} 1팩`],
      ['중량 / 사이즈', value('productWeight')],
      ['생물여부', value('productStorage')],
      ['포장방식', value('productPackage')],
    ];
    rows.forEach(([label, itemValue], index) => {
      const y = 650 + index * 170;
      group.add(textNode(pageId, `stickerLabel${index}`, `${label} 라벨`, {
        x: 310,
        y,
        width: 420,
        text: `※ ${label}`,
        fontSize: 35,
        fill: COLORS.sub,
      }));
      group.add(textNode(pageId, `stickerValue${index}`, `${label} 값`, {
        x: 760,
        y: y - 5,
        width: 850,
        text: `: ${itemValue}`,
        fontSize: 43,
        fill: COLORS.ink,
      }));
    });

    group.add(rectNode(pageId, 'ingredientDivider', '성분 구분선', {
      x: 300,
      y: 1350,
      width: 1448,
      height: 2,
      fill: COLORS.line,
      listening: false,
    }, true));
    group.add(textNode(pageId, 'ingredientLabel', '성분표시 라벨', {
      x: 310,
      y: 1425,
      width: 450,
      text: '※ 성분표시',
      fontSize: 35,
      fill: COLORS.sub,
    }));
    const ingredients = value('productIngredients');
    group.add(textNode(pageId, 'ingredients', '성분표시 내용', {
      x: 310,
      y: 1500,
      width: 1420,
      height: 220,
      text: ingredients,
      fontSize: fitTextSize(ingredients, 30, 24, 120),
      lineHeight: 1.55,
      fill: COLORS.ink,
      fontStyle: 'normal',
    }));
    group.add(textNode(pageId, 'origin', '원산지 안내', {
      x: 310,
      y: 1770,
      width: 1420,
      text: `※ 원산지 : ${value('productOrigin')}`,
      fontSize: 28,
      fill: COLORS.sub,
      fontStyle: 'normal',
    }));
  }

  function buildAllPages() {
    deselect();
    contentLayer.destroyChildren();
    state.pageGroups.clear();
    buildMainPage();
    buildUsagePage();
    buildSpecPage();
    if (byId('includeSticker')?.checked) buildStickerPage();
    state.generated = true;
    updatePageAvailability();
    switchPage(state.pageGroups.has(state.currentPage) ? state.currentPage : 'main', false);
    contentLayer.draw();
  }

  function updatePageAvailability() {
    document.querySelectorAll('.page-item').forEach((button) => {
      button.hidden = !state.pageGroups.has(button.dataset.page);
    });
  }

  function switchPage(pageId, fit = true) {
    if (!state.pageGroups.has(pageId)) return;
    deselect();
    state.currentPage = pageId;
    state.pageGroups.forEach((group, id) => group.visible(id === pageId));
    document.querySelectorAll('.page-item').forEach((button) => {
      button.classList.toggle('active', button.dataset.page === pageId);
    });
    byId('currentPageLabel').textContent = PAGE_META[pageId].label;
    byId('pageGuideText').textContent = PAGE_META[pageId].guide;
    contentLayer.draw();
    if (fit) window.setTimeout(fitStage, 20);
  }

  function enterEditor() {
    document.body.classList.add('is-editor');
    byId('setupView').hidden = true;
    byId('setupActions').hidden = true;
    byId('editorView').hidden = false;
    byId('editorActions').hidden = false;
    window.requestAnimationFrame(() => window.requestAnimationFrame(fitStage));
  }

  function enterSetup() {
    document.body.classList.remove('is-editor');
    byId('editorView').hidden = true;
    byId('editorActions').hidden = true;
    byId('setupView').hidden = false;
    byId('setupActions').hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function selectNode(node) {
    if (!node || node === transformer) return;
    state.selected = node;
    transformer.nodes([node]);
    const locked = Boolean(node.getAttr('locked'));
    transformer.enabledAnchors(locked ? [] : [
      'top-left',
      'top-center',
      'top-right',
      'middle-left',
      'middle-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ]);
    transformer.rotateEnabled(!locked);
    node.draggable(!locked);
    updateInspector();
    uiLayer.draw();
  }

  function deselect() {
    state.selected = null;
    transformer.nodes([]);
    updateInspector();
    uiLayer.draw();
  }

  function updateInspector() {
    const node = state.selected;
    const empty = byId('emptyInspector');
    const panel = byId('nodeInspector');
    if (!node) {
      empty.hidden = false;
      panel.hidden = true;
      return;
    }
    empty.hidden = true;
    panel.hidden = false;
    byId('selectedNodeName').textContent = node.getAttr('displayName') || node.getClassName();
    syncInspector();
    const isText = node instanceof Konva.Text;
    byId('textInspector').hidden = !isText;
    if (isText) {
      byId('nodeText').value = node.text();
      byId('nodeFontSize').value = Math.round(node.fontSize());
      byId('nodeLineHeight').value = node.lineHeight();
      byId('nodeAlign').value = node.align();
    }
    byId('toggleLockBtn').textContent = node.getAttr('locked') ? '잠금 해제' : '잠금';
  }

  function syncInspector() {
    const node = state.selected;
    if (!node) return;
    byId('nodeX').value = Math.round(node.x());
    byId('nodeY').value = Math.round(node.y());
    byId('nodeWidth').value = Math.round(node.width() * node.scaleX());
    byId('nodeHeight').value = Math.round(node.height() * node.scaleY());
    byId('nodeRotation').value = Math.round(node.rotation());
  }

  function applyInspectorBox() {
    const node = state.selected;
    if (!node || node.getAttr('locked')) return;
    node.x(Number(byId('nodeX').value) || 0);
    node.y(Number(byId('nodeY').value) || 0);
    const width = Math.max(1, Number(byId('nodeWidth').value) || node.width());
    const height = Math.max(1, Number(byId('nodeHeight').value) || node.height());
    node.width(width);
    node.height(height);
    node.scale({ x: 1, y: 1 });
    node.rotation(Number(byId('nodeRotation').value) || 0);
    contentLayer.batchDraw();
    uiLayer.batchDraw();
  }

  function fitStage() {
    const viewport = byId('stageViewport');
    if (!viewport || viewport.offsetParent === null) return;
    const availableWidth = Math.max(260, viewport.clientWidth - 48);
    const availableHeight = Math.max(260, viewport.clientHeight - 48);
    state.zoom = Math.max(0.12, Math.min(1, availableWidth / MASTER, availableHeight / MASTER));
    applyZoom();
  }

  function applyZoom() {
    stage.scale({ x: state.zoom, y: state.zoom });
    stage.size({ width: MASTER * state.zoom, height: MASTER * state.zoom });
    const container = byId('stageContainer');
    container.style.width = `${MASTER * state.zoom}px`;
    container.style.height = `${MASTER * state.zoom}px`;
    byId('zoomLabel').textContent = `${Math.round(state.zoom * 100)}%`;
    stage.draw();
  }

  function snapshotNode(node) {
    return {
      pageId: node.getAttr('pageId'),
      role: node.getAttr('dataRole'),
      className: node.getClassName(),
      imageSrc: node.getAttr('imageSrc') || '',
      attrs: {
        x: node.x(),
        y: node.y(),
        width: node.width(),
        height: node.height(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
        visible: node.visible(),
        locked: Boolean(node.getAttr('locked')),
        text: node instanceof Konva.Text ? node.text() : undefined,
        fontSize: node instanceof Konva.Text ? node.fontSize() : undefined,
        lineHeight: node instanceof Konva.Text ? node.lineHeight() : undefined,
        align: node instanceof Konva.Text ? node.align() : undefined,
        fill: typeof node.fill === 'function' ? node.fill() : undefined,
        cornerRadius: node instanceof Konva.Rect ? node.cornerRadius() : undefined,
      },
    };
  }

  function layoutSnapshot() {
    const result = [];
    state.pageGroups.forEach((group) => {
      group.find((node) => Boolean(node.getAttr('dataRole'))).forEach((node) => {
        const role = node.getAttr('dataRole');
        if (role && role !== 'pageBackground') result.push(snapshotNode(node));
      });
    });
    return result;
  }

  function applySnapshotAttrs(node, attrs = {}) {
    const safeAttrs = { ...attrs };
    Object.keys(safeAttrs).forEach((key) => {
      if (safeAttrs[key] === undefined) delete safeAttrs[key];
    });
    node.setAttrs(safeAttrs);
    node.setAttr('locked', Boolean(attrs.locked));
    node.draggable(!attrs.locked);
  }

  async function restoreLayout(snapshot = []) {
    for (const item of snapshot) {
      const group = state.pageGroups.get(item.pageId);
      if (!group || !item.role) continue;
      let node = group.findOne((candidate) => candidate.getAttr('dataRole') === item.role);
      const isCustom = String(item.role).startsWith('custom-');
      if (!node && isCustom) {
        if (item.className === 'Text') {
          node = textNode(item.pageId, item.role, '추가 텍스트', item.attrs || {}, Boolean(item.attrs?.locked));
        } else if (item.className === 'Rect') {
          node = rectNode(item.pageId, item.role, '추가 배지', item.attrs || {}, Boolean(item.attrs?.locked));
        } else if (item.className === 'Image' && item.imageSrc) {
          const image = await imageFromSrc(item.imageSrc);
          node = new Konva.Image({ image, ...(item.attrs || {}) });
          addMeta(node, item.pageId, item.role, '추가 이미지', Boolean(item.attrs?.locked));
          node.setAttr('imageSrc', item.imageSrc);
        }
        if (node) group.add(node);
      }
      if (node) applySnapshotAttrs(node, item.attrs || {});
    }
    contentLayer.draw();
  }

  function projectData() {
    return {
      version: 3,
      master: { width: MASTER, height: MASTER },
      projectName: value('productName', '모딩 상세페이지'),
      form: formData(),
      options: {
        includeSticker: Boolean(byId('includeSticker')?.checked),
        useOriginalProduct: state.useOriginalProduct,
        cutoutThreshold: Number(byId('cutoutThreshold')?.value || 242),
      },
      assets: {
        productOriginalSrc: state.productOriginalSrc,
        productProcessedSrc: state.productProcessedSrc,
        cookingSrc: state.cookingSrc,
      },
      currentPage: state.currentPage,
      layout: state.generated ? layoutSnapshot() : [],
    };
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function loadProject(project) {
    if (!project || typeof project !== 'object') throw new Error('올바른 프로젝트가 아닙니다.');
    const legacyProduct = project.product || {};
    const migratedForm = project.form || {
      productName: legacyProduct.name || '',
      productWeight: legacyProduct.weight || '',
      productStorage: legacyProduct.storage || '',
      productPackage: legacyProduct.package || '',
      productComposition: legacyProduct.name ? `${legacyProduct.name} 1팩` : '',
      productHeadline: legacyProduct.headline || '',
      productDescription: legacyProduct.description || '',
    };
    setFormData(migratedForm);
    byId('includeSticker').checked = project.options?.includeSticker !== false;
    const threshold = Number(project.options?.cutoutThreshold || 242);
    byId('cutoutThreshold').value = String(threshold);
    byId('cutoutThresholdValue').value = String(threshold);
    state.useOriginalProduct = Boolean(project.options?.useOriginalProduct);
    const legacyProductNode = Array.isArray(project.nodes)
      ? project.nodes.find((node) => node?.attrs?.dataRole === 'productImage' && node?.attrs?.src)
      : null;
    state.productOriginalSrc = project.assets?.productOriginalSrc || legacyProductNode?.attrs?.src || '';
    state.productProcessedSrc = project.assets?.productProcessedSrc || state.productOriginalSrc;
    state.cookingSrc = project.assets?.cookingSrc || '';

    const [original, processed, cooking] = await Promise.all([
      state.productOriginalSrc ? imageFromSrc(state.productOriginalSrc) : Promise.resolve(null),
      state.productProcessedSrc ? imageFromSrc(state.productProcessedSrc) : Promise.resolve(null),
      state.cookingSrc ? imageFromSrc(state.cookingSrc) : Promise.resolve(null),
    ]);
    state.productOriginal = original;
    state.productProcessed = processed || original;
    state.cookingImage = cooking;
    if (!state.productProcessedSrc) state.productProcessedSrc = state.productOriginalSrc;
    setPreview('productPreview', currentProductAsset().src);
    setPreview('cookingPreview', state.cookingSrc);
    setStatus('productVisualStatus', original ? '저장된 실제 상품사진을 복원했습니다' : '상품사진을 올려주세요', original ? 'ready' : '');
    setStatus('cookingVisualStatus', cooking ? '저장된 조리사진을 복원했습니다' : '조리사진 없이도 제작할 수 있습니다', cooking ? 'ready' : '');
    state.currentPage = project.currentPage || 'main';
    buildAllPages();
    await restoreLayout(project.layout || []);
    switchPage(state.pageGroups.has(state.currentPage) ? state.currentPage : 'main', false);
    enterEditor();
    toast('프로젝트를 불러왔습니다');
  }

  async function exportPageBlob(pageId) {
    const target = state.pageGroups.get(pageId);
    if (!target) return null;
    const previousZoom = state.zoom;
    const previousVisibility = new Map();
    state.pageGroups.forEach((group, id) => {
      previousVisibility.set(id, group.visible());
      group.visible(id === pageId);
    });
    uiLayer.visible(false);
    stage.scale({ x: 1, y: 1 });
    stage.size({ width: MASTER, height: MASTER });
    stage.draw();
    let blob;
    try {
      blob = await stage.toBlob({ pixelRatio: 1, mimeType: 'image/png' });
    } finally {
      state.pageGroups.forEach((group, id) => group.visible(previousVisibility.get(id)));
      uiLayer.visible(true);
      state.zoom = previousZoom;
      applyZoom();
    }
    return blob;
  }

  async function exportCurrentPage() {
    if (!state.generated) return;
    toast('현재 장을 출력하고 있습니다');
    const blob = await exportPageBlob(state.currentPage);
    if (!blob) return;
    const filename = `${safeName(value('productName'))}-${PAGE_META[state.currentPage].file}-2048.png`;
    downloadBlob(filename, blob);
    toast('현재 장 PNG를 출력했습니다');
  }

  async function exportAllPages() {
    if (!state.generated) return;
    const pages = [...state.pageGroups.keys()];
    toast(`${pages.length}장을 묶어서 출력하고 있습니다`);
    const files = [];
    for (const pageId of pages) {
      const blob = await exportPageBlob(pageId);
      if (blob) {
        files.push({
          name: `${safeName(value('productName'))}-${PAGE_META[pageId].file}-2048.png`,
          blob,
        });
      }
    }
    if (window.JSZip) {
      const zip = new JSZip();
      files.forEach((file) => zip.file(file.name, file.blob));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      downloadBlob(`${safeName(value('productName'))}-상세페이지-${files.length}장.zip`, blob);
      toast(`전체 ${files.length}장을 ZIP으로 출력했습니다`);
      return;
    }
    files.forEach((file, index) => {
      window.setTimeout(() => downloadBlob(file.name, file.blob), index * 250);
    });
    toast(`전체 ${files.length}장을 PNG로 출력했습니다`);
  }

  stage.on('click tap', (event) => {
    if (event.target === stage || event.target.getAttr('dataRole') === 'pageBackground') deselect();
  });

  document.querySelectorAll('.page-item').forEach((button) => {
    button.addEventListener('click', () => switchPage(button.dataset.page));
  });

  byId('productImageInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await readImageFile(file);
      state.productOriginal = result.image;
      state.productOriginalSrc = result.src;
      state.productProcessed = null;
      state.productProcessedSrc = '';
      state.useOriginalProduct = false;
      setPreview('productPreview', result.src);
      await processProductImage();
    } catch (error) {
      console.error(error);
      toast(error.message || '상품사진을 읽지 못했습니다');
    } finally {
      event.target.value = '';
    }
  });

  byId('cookingImageInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await readImageFile(file);
      state.cookingImage = result.image;
      state.cookingSrc = result.src;
      setPreview('cookingPreview', result.src);
      setStatus('cookingVisualStatus', '조리사진을 별도 레이어로 준비했습니다', 'ready');
    } catch (error) {
      console.error(error);
      toast(error.message || '조리사진을 읽지 못했습니다');
    } finally {
      event.target.value = '';
    }
  });

  byId('cutoutThreshold').addEventListener('input', (event) => {
    byId('cutoutThresholdValue').value = String(event.target.value);
  });
  byId('applyCutoutBtn').addEventListener('click', processProductImage);
  byId('restoreProductBtn').addEventListener('click', () => {
    if (!state.productOriginal) {
      toast('복원할 상품 원본이 없습니다');
      return;
    }
    state.useOriginalProduct = true;
    setPreview('productPreview', state.productOriginalSrc);
    setStatus('productVisualStatus', '실제 상품 원본을 그대로 사용합니다', 'ready');
    toast('상품 원본으로 전환했습니다');
  });
  byId('removeCookingBtn').addEventListener('click', () => {
    state.cookingImage = null;
    state.cookingSrc = '';
    setPreview('cookingPreview', '');
    setStatus('cookingVisualStatus', '조리사진 없이 상품 중심으로 구성합니다');
    toast('조리사진을 제거했습니다');
  });

  byId('generateBtn').addEventListener('click', () => {
    if (state.processingProduct) {
      toast('상품사진 배경을 정리하고 있습니다. 잠시만 기다려 주세요');
      return;
    }
    if (!currentProductAsset().image) {
      toast('실제 상품사진을 먼저 업로드해 주세요');
      byId('productImageInput').closest('.setup-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    state.currentPage = 'main';
    buildAllPages();
    enterEditor();
    toast('상세페이지 결과를 한 번에 만들었습니다');
  });

  byId('backToSetupBtn').addEventListener('click', enterSetup);
  byId('rebuildBtn').addEventListener('click', () => {
    if (!window.confirm('현재 장별 편집값을 지우고 입력값 기준으로 다시 구성할까요?')) return;
    buildAllPages();
    toast('입력값 기준으로 다시 구성했습니다');
  });
  byId('newProjectBtn').addEventListener('click', () => {
    const hasWork = Boolean(state.productOriginal || state.generated);
    if (hasWork && !window.confirm('현재 작업을 지우고 새 프로젝트를 시작할까요?')) return;
    window.location.reload();
  });

  ['nodeX', 'nodeY', 'nodeWidth', 'nodeHeight', 'nodeRotation'].forEach((id) => {
    byId(id).addEventListener('change', applyInspectorBox);
  });
  ['nodeText', 'nodeFontSize', 'nodeLineHeight', 'nodeAlign'].forEach((id) => {
    byId(id).addEventListener('input', () => {
      const node = state.selected;
      if (!(node instanceof Konva.Text) || node.getAttr('locked')) return;
      if (id === 'nodeText') node.text(byId(id).value);
      if (id === 'nodeFontSize') node.fontSize(Number(byId(id).value) || 40);
      if (id === 'nodeLineHeight') node.lineHeight(Number(byId(id).value) || 1.1);
      if (id === 'nodeAlign') node.align(byId(id).value);
      contentLayer.batchDraw();
      syncInspector();
    });
  });

  byId('bringFrontBtn').addEventListener('click', () => {
    if (!state.selected || state.selected.getAttr('locked')) return;
    state.selected.moveToTop();
    contentLayer.draw();
  });
  byId('sendBackBtn').addEventListener('click', () => {
    if (!state.selected || state.selected.getAttr('locked')) return;
    state.selected.zIndex(1);
    contentLayer.draw();
  });
  byId('toggleLockBtn').addEventListener('click', () => {
    const node = state.selected;
    if (!node) return;
    const locked = !node.getAttr('locked');
    node.setAttr('locked', locked);
    node.draggable(!locked);
    selectNode(node);
    toast(locked ? '요소를 잠갔습니다' : '요소 잠금을 해제했습니다');
  });
  byId('deleteNodeBtn').addEventListener('click', () => {
    const node = state.selected;
    if (!node) return;
    if (node.getAttr('locked')) {
      toast('잠긴 요소는 삭제할 수 없습니다');
      return;
    }
    node.destroy();
    deselect();
    contentLayer.draw();
  });

  byId('addTextBtn').addEventListener('click', () => {
    const group = state.pageGroups.get(state.currentPage);
    if (!group) return;
    const role = `custom-text-${Date.now()}`;
    const node = textNode(state.currentPage, role, '추가 텍스트', {
      x: 420,
      y: 900,
      width: 900,
      text: '새 텍스트를 입력하세요',
      fontSize: 64,
      fill: COLORS.ink,
    });
    group.add(node);
    contentLayer.draw();
    selectNode(node);
  });
  byId('addBadgeBtn').addEventListener('click', () => {
    const group = state.pageGroups.get(state.currentPage);
    if (!group) return;
    const stamp = Date.now();
    const rect = rectNode(state.currentPage, `custom-badge-${stamp}`, '추가 배지', {
      x: 420,
      y: 970,
      width: 520,
      height: 150,
      cornerRadius: 75,
      fill: '#EEF6EE',
    }, false);
    const text = textNode(state.currentPage, `custom-badge-text-${stamp}`, '배지 텍스트', {
      x: 470,
      y: 1012,
      width: 420,
      text: '추천',
      fontSize: 48,
      align: 'center',
      fill: COLORS.greenDark,
    });
    group.add(rect, text);
    contentLayer.draw();
    selectNode(text);
  });
  byId('extraImageInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await readImageFile(file);
      const group = state.pageGroups.get(state.currentPage);
      const ratio = Math.min(650 / result.image.width, 650 / result.image.height);
      const node = new Konva.Image({
        image: result.image,
        x: 699,
        y: 699,
        width: result.image.width * ratio,
        height: result.image.height * ratio,
      });
      addMeta(node, state.currentPage, `custom-image-${Date.now()}`, '추가 이미지', false);
      node.setAttr('imageSrc', result.src);
      group.add(node);
      contentLayer.draw();
      selectNode(node);
    } catch (error) {
      console.error(error);
      toast('이미지를 추가하지 못했습니다');
    } finally {
      event.target.value = '';
    }
  });

  byId('zoomInBtn').addEventListener('click', () => {
    state.zoom = Math.min(1.4, state.zoom + 0.06);
    applyZoom();
  });
  byId('zoomOutBtn').addEventListener('click', () => {
    state.zoom = Math.max(0.12, state.zoom - 0.06);
    applyZoom();
  });
  byId('fitCanvasBtn').addEventListener('click', fitStage);
  byId('exportBtn').addEventListener('click', exportCurrentPage);
  byId('exportAllBtn').addEventListener('click', exportAllPages);
  byId('saveProjectBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(projectData(), null, 2)], { type: 'application/json' });
    downloadBlob(`${safeName(value('productName'))}-상세페이지-프로젝트.json`, blob);
    toast('프로젝트 JSON을 저장했습니다');
  });

  document.querySelectorAll('.project-file-input').forEach((input) => {
    input.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await loadProject(JSON.parse(String(reader.result || '{}')));
        } catch (error) {
          console.error(error);
          toast('JSON 프로젝트를 읽지 못했습니다');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    });
  });

  window.addEventListener('resize', () => {
    clearTimeout(window.__detailMakerFitTimer);
    window.__detailMakerFitTimer = window.setTimeout(fitStage, 140);
  });

  updateInspector();
})();

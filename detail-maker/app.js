(() => {
  'use strict';
  const MASTER = 2048;
  const COLORS = {green:'#238B22',greenDark:'#1C6F1C',orange:'#FF8C00',ink:'#173119',sub:'#687269',soft:'#F4F7F4',line:'#DDE5DD',white:'#FFFFFF'};
  const state = { template:'processed', selected:null, productImage:null, productLocked:true, zoom:1 };
  const el = (id) => document.getElementById(id);
  const stage = new Konva.Stage({container:'stageContainer', width:MASTER, height:MASTER});
  const backgroundLayer = new Konva.Layer();
  const contentLayer = new Konva.Layer();
  const uiLayer = new Konva.Layer();
  stage.add(backgroundLayer, contentLayer, uiLayer);
  const transformer = new Konva.Transformer({rotateEnabled:true,borderStroke:COLORS.orange,anchorStroke:COLORS.orange,anchorFill:'#fff',anchorSize:18,borderDash:[10,8],keepRatio:false,ignoreStroke:true});
  uiLayer.add(transformer);

  const productInputs = ['productName','productWeight','productStorage','productPackage','productHeadline','productDescription'];
  const templateButtons = [...document.querySelectorAll('.template-card')];

  function toast(message){ const t=el('toast'); t.textContent=message; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),1800); }
  function data(id, fallback=''){ return String(el(id)?.value ?? fallback).trim(); }
  function nodeByRole(role){ return contentLayer.findOne(`[dataRole="${role}"]`); }
  function addMeta(node, role, label){ node.setAttr('dataRole', role); node.setAttr('displayName', label); node.on('click tap',()=>selectNode(node)); node.on('dragend transformend',()=>{ if(state.selected===node) syncInspector(); }); return node; }
  function textNode(role,label,config){ return addMeta(new Konva.Text({fontFamily:'Arial, Noto Sans KR, sans-serif',fill:COLORS.ink,fontStyle:'bold',lineHeight:1.12,draggable:true,...config}),role,label); }
  function rectNode(role,label,config){ return addMeta(new Konva.Rect({draggable:true,...config}),role,label); }
  function clearContent(){ transformer.nodes([]); state.selected=null; contentLayer.destroyChildren(); uiLayer.add(transformer); updateInspector(); }
  function buildBackground(bg='#fff'){ backgroundLayer.destroyChildren(); backgroundLayer.add(new Konva.Rect({x:0,y:0,width:MASTER,height:MASTER,fill:bg,listening:false})); backgroundLayer.draw(); }
  function addProductImageBox(x,y,w,h,mode='contain'){
    const frame=rectNode('productFrame','상품사진 영역',{x,y,width:w,height:h,cornerRadius:56,fill:'#fff',stroke:COLORS.line,strokeWidth:3,draggable:false,listening:false}); contentLayer.add(frame);
    if(!state.productImage) return;
    const img=state.productImage;
    const ratio=Math.min(w/img.width,h/img.height);
    const cw=img.width*ratio, ch=img.height*ratio;
    const image=new Konva.Image({image:img,x:x+(w-cw)/2,y:y+(h-ch)/2,width:cw,height:ch,draggable:!state.productLocked,name:'product-image'});
    addMeta(image,'productImage','실제 상품사진'); image.setAttr('locked',state.productLocked); contentLayer.add(image);
  }
  function addBrandMark(){ contentLayer.add(textNode('brandKicker','상단 라벨',{x:150,y:125,width:500,text:'MODING PRODUCT',fontSize:30,letterSpacing:4,fill:COLORS.orange})); }
  function buildProcessed(){
    buildBackground('#FBFCFB'); clearContent(); addBrandMark();
    contentLayer.add(textNode('title','상품명',{x:145,y:205,width:1180,text:data('productName','상품명'),fontSize:122,lineHeight:1.02,fill:COLORS.greenDark}));
    contentLayer.add(textNode('headline','핵심문구',{x:150,y:390,width:900,text:data('productHeadline'),fontSize:54,lineHeight:1.28,fill:COLORS.ink,fontStyle:'normal'}));
    contentLayer.add(rectNode('heroPanel','상품 배경',{x:1050,y:120,width:850,height:1280,cornerRadius:90,fill:'#EEF6EE',draggable:false,listening:false}));
    addProductImageBox(1110,270,730,930);
    contentLayer.add(rectNode('infoPanel','정보 패널',{x:145,y:1130,width:805,height:560,cornerRadius:52,fill:'#fff',stroke:COLORS.line,strokeWidth:3,draggable:false,listening:false}));
    const specs=[['중량',data('productWeight')],['보관',data('productStorage')],['포장',data('productPackage')]];
    specs.forEach((s,i)=>{ const yy=1200+i*145; contentLayer.add(textNode(`specLabel${i}`,`${s[0]} 라벨`,{x:220,y:yy,width:180,text:s[0],fontSize:34,fill:COLORS.sub})); contentLayer.add(textNode(`specValue${i}`,`${s[0]} 값`,{x:430,y:yy-5,width:420,text:s[1],fontSize:48,fill:COLORS.ink})); });
    contentLayer.add(textNode('description','보조문구',{x:1080,y:1510,width:820,text:data('productDescription'),fontSize:48,lineHeight:1.4,fill:COLORS.sub,fontStyle:'normal'}));
    contentLayer.add(rectNode('accent','하단 포인트',{x:145,y:1790,width:1750,height:14,cornerRadius:99,fill:COLORS.orange,draggable:false,listening:false}));
    contentLayer.draw();
  }
  function buildRaw(){
    buildBackground('#F6FAF6'); clearContent(); addBrandMark();
    contentLayer.add(textNode('title','상품명',{x:145,y:205,width:1500,text:data('productName'),fontSize:132,fill:COLORS.greenDark}));
    contentLayer.add(textNode('headline','핵심문구',{x:150,y:400,width:1300,text:data('productHeadline'),fontSize:52,lineHeight:1.28,fill:COLORS.ink,fontStyle:'normal'}));
    contentLayer.add(rectNode('rawPanel','원물 배경',{x:110,y:620,width:1828,height:1120,cornerRadius:90,fill:'#fff',stroke:COLORS.line,strokeWidth:3,draggable:false,listening:false}));
    addProductImageBox(220,700,1608,850);
    contentLayer.add(textNode('description','보조문구',{x:250,y:1600,width:1500,text:data('productDescription'),fontSize:44,lineHeight:1.35,align:'center',fill:COLORS.sub,fontStyle:'normal'}));
    contentLayer.draw();
  }
  function buildUsage(){
    buildBackground('#fff'); clearContent(); addBrandMark();
    contentLayer.add(textNode('title','상단 제목',{x:145,y:205,width:1600,text:'이런 업종에 추천드립니다!',fontSize:96,fill:COLORS.greenDark}));
    ['국밥 전문점','한식주점','탕·전골 전문점'].forEach((v,i)=>{ const x=150+i*585; contentLayer.add(rectNode(`tradeBadge${i}`,`추천업종 ${i+1}`,{x,y:430,width:500,height:155,cornerRadius:44,fill:i===1?'#FFF5E8':'#EEF6EE',draggable:true})); contentLayer.add(textNode(`tradeText${i}`,`추천업종 문구 ${i+1}`,{x:x+35,y:474,width:430,text:v,fontSize:42,align:'center',fill:i===1?'#A85B00':COLORS.greenDark})); });
    addProductImageBox(470,690,1110,650);
    contentLayer.add(textNode('menuTitle','하단 제목',{x:145,y:1430,width:1600,text:'이런 메뉴로 활용해보세요!',fontSize:76,fill:COLORS.ink}));
    ['스지도가니탕','도가니전골'].forEach((v,i)=>{ const x=150+i*900; contentLayer.add(rectNode(`menuCard${i}`,`추천메뉴 카드 ${i+1}`,{x,y:1590,width:820,height:280,cornerRadius:48,fill:'#F7F9F7',stroke:COLORS.line,strokeWidth:2})); contentLayer.add(textNode(`menuText${i}`,`추천메뉴 ${i+1}`,{x:x+40,y:1680,width:740,text:v,fontSize:56,align:'center',fill:COLORS.greenDark})); });
    contentLayer.draw();
  }
  function buildSpec(){
    buildBackground('#F8FAF8'); clearContent(); addBrandMark();
    contentLayer.add(textNode('title','상품명',{x:145,y:205,width:1500,text:data('productName'),fontSize:118,fill:COLORS.greenDark}));
    contentLayer.add(textNode('specHeading','스펙 제목',{x:150,y:410,width:1200,text:'상품 스펙 요약',fontSize:64,fill:COLORS.orange}));
    const rows=[['구성',`${data('productName')} 1팩`],['중량 / 사이즈',data('productWeight')],['생물여부',data('productStorage')],['포장방식',data('productPackage')]];
    rows.forEach((r,i)=>{ const y=610+i*230; contentLayer.add(rectNode(`rowBg${i}`,`스펙 행 ${i+1}`,{x:150,y,width:1740,height:170,cornerRadius:34,fill:'#fff',stroke:COLORS.line,strokeWidth:2,draggable:false,listening:false})); contentLayer.add(textNode(`rowLabel${i}`,`${r[0]} 라벨`,{x:230,y:y+58,width:420,text:r[0],fontSize:38,fill:COLORS.sub})); contentLayer.add(textNode(`rowValue${i}`,`${r[0]} 값`,{x:690,y:y+46,width:1100,text:r[1],fontSize:50,fill:COLORS.ink})); });
    contentLayer.add(textNode('description','하단 설명',{x:180,y:1600,width:1680,text:data('productDescription'),fontSize:44,lineHeight:1.5,align:'center',fill:COLORS.sub,fontStyle:'normal'}));
    contentLayer.draw();
  }
  function rebuild(){ const map={processed:buildProcessed,raw:buildRaw,usage:buildUsage,spec:buildSpec}; map[state.template](); fitStage(); }
  function selectNode(node){ if(!node || node===transformer) return; state.selected=node; transformer.nodes([node]); transformer.enabledAnchors(node.getAttr('locked')?[]:['top-left','top-center','top-right','middle-left','middle-right','bottom-left','bottom-center','bottom-right']); transformer.rotateEnabled(!node.getAttr('locked')); node.draggable(!node.getAttr('locked') && node.draggable()!==false); updateInspector(); uiLayer.draw(); }
  function deselect(){ state.selected=null; transformer.nodes([]); updateInspector(); uiLayer.draw(); }
  stage.on('click tap',(e)=>{ if(e.target===stage || e.target.getLayer()===backgroundLayer) deselect(); });
  function updateInspector(){ const n=state.selected, empty=el('emptyInspector'), panel=el('nodeInspector'); if(!n){empty.hidden=false;panel.hidden=true;return;} empty.hidden=true;panel.hidden=false; el('selectedNodeName').textContent=n.getAttr('displayName')||n.getClassName(); syncInspector(); const isText=n instanceof Konva.Text; el('textInspector').hidden=!isText; if(isText){el('nodeText').value=n.text();el('nodeFontSize').value=Math.round(n.fontSize());el('nodeLineHeight').value=n.lineHeight();el('nodeAlign').value=n.align();} el('toggleLockBtn').textContent=n.getAttr('locked')?'잠금 해제':'잠금'; }
  function syncInspector(){ const n=state.selected;if(!n)return; el('nodeX').value=Math.round(n.x());el('nodeY').value=Math.round(n.y());el('nodeWidth').value=Math.round(n.width()*n.scaleX());el('nodeHeight').value=Math.round(n.height()*n.scaleY());el('nodeRotation').value=Math.round(n.rotation()); }
  function applyBox(){ const n=state.selected;if(!n)return; n.x(+el('nodeX').value||0);n.y(+el('nodeY').value||0);const w=Math.max(1,+el('nodeWidth').value||n.width()),h=Math.max(1,+el('nodeHeight').value||n.height());n.width(w);n.height(h);n.scale({x:1,y:1});n.rotation(+el('nodeRotation').value||0);contentLayer.batchDraw();uiLayer.batchDraw(); }
  ['nodeX','nodeY','nodeWidth','nodeHeight','nodeRotation'].forEach(id=>el(id).addEventListener('change',applyBox));
  ['nodeText','nodeFontSize','nodeLineHeight','nodeAlign'].forEach(id=>el(id).addEventListener('input',()=>{const n=state.selected;if(!(n instanceof Konva.Text))return;if(id==='nodeText')n.text(el(id).value);if(id==='nodeFontSize')n.fontSize(+el(id).value||40);if(id==='nodeLineHeight')n.lineHeight(+el(id).value||1.1);if(id==='nodeAlign')n.align(el(id).value);contentLayer.batchDraw();syncInspector();}));
  productInputs.forEach(id=>el(id).addEventListener('input',()=>{const roleMap={productName:'title',productHeadline:'headline',productDescription:'description'};const role=roleMap[id];if(role){const n=nodeByRole(role);if(n instanceof Konva.Text){n.text(el(id).value);contentLayer.batchDraw();}}}));
  templateButtons.forEach(btn=>btn.addEventListener('click',()=>{state.template=btn.dataset.template;templateButtons.forEach(b=>b.classList.toggle('active',b===btn));rebuild();}));
  function loadImageFile(file,callback){if(!file)return;const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>callback(img,reader.result);img.src=reader.result;};reader.readAsDataURL(file);}
  el('productImageInput').addEventListener('change',e=>loadImageFile(e.target.files[0],img=>{state.productImage=img;rebuild();toast('실제 상품사진을 불러왔습니다');}));
  el('extraImageInput').addEventListener('change',e=>loadImageFile(e.target.files[0],img=>{const ratio=Math.min(650/img.width,650/img.height);const node=new Konva.Image({image:img,x:699,y:699,width:img.width*ratio,height:img.height*ratio,draggable:true});addMeta(node,`extraImage-${Date.now()}`,'추가 이미지');contentLayer.add(node);contentLayer.draw();selectNode(node);}));
  el('addTextBtn').addEventListener('click',()=>{const n=textNode(`text-${Date.now()}`,'추가 텍스트',{x:300,y:900,width:900,text:'새 텍스트를 입력하세요',fontSize:64,fill:COLORS.ink});contentLayer.add(n);contentLayer.draw();selectNode(n);});
  el('addBadgeBtn').addEventListener('click',()=>{const r=rectNode(`badge-${Date.now()}`,'추가 배지',{x:350,y:950,width:520,height:150,cornerRadius:75,fill:'#EEF6EE'});contentLayer.add(r);const t=textNode(`badgeText-${Date.now()}`,'배지 텍스트',{x:400,y:992,width:420,text:'추천',fontSize:48,align:'center',fill:COLORS.greenDark});contentLayer.add(t);contentLayer.draw();selectNode(t);});
  el('bringFrontBtn').addEventListener('click',()=>{if(state.selected){state.selected.moveToTop();uiLayer.moveToTop();contentLayer.draw();}}); el('sendBackBtn').addEventListener('click',()=>{if(state.selected){state.selected.moveToBottom();contentLayer.draw();}});
  el('deleteNodeBtn').addEventListener('click',()=>{if(!state.selected)return;if(state.selected.getAttr('locked'))return toast('잠긴 요소는 삭제할 수 없습니다');state.selected.destroy();deselect();contentLayer.draw();});
  el('toggleLockBtn').addEventListener('click',()=>{const n=state.selected;if(!n)return;const locked=!n.getAttr('locked');n.setAttr('locked',locked);n.draggable(!locked);selectNode(n);});
  el('lockProductBtn').addEventListener('click',()=>{state.productLocked=!state.productLocked;const n=nodeByRole('productImage');if(n){n.setAttr('locked',state.productLocked);n.draggable(!state.productLocked);if(state.selected===n)selectNode(n);}el('lockProductBtn').textContent=state.productLocked?'상품사진 잠금':'상품사진 잠금 해제';toast(state.productLocked?'상품사진을 잠갔습니다':'상품사진 잠금을 해제했습니다');});
  el('fitImageBtn').addEventListener('click',()=>{if(!state.productImage)return toast('상품사진을 먼저 업로드하세요');rebuild();});
  function fitStage(){const viewport=el('stageViewport');const max=Math.min(viewport.clientWidth-56,viewport.clientHeight-56);state.zoom=Math.max(.18,Math.min(1,max/MASTER));applyZoom();}
  function applyZoom(){stage.scale({x:state.zoom,y:state.zoom});stage.width(MASTER*state.zoom);stage.height(MASTER*state.zoom);el('stageContainer').style.width=`${MASTER*state.zoom}px`;el('stageContainer').style.height=`${MASTER*state.zoom}px`;el('zoomLabel').textContent=`${Math.round(state.zoom*100)}%`;stage.draw();}
  el('zoomInBtn').addEventListener('click',()=>{state.zoom=Math.min(1.8,state.zoom+.08);applyZoom();}); el('zoomOutBtn').addEventListener('click',()=>{state.zoom=Math.max(.15,state.zoom-.08);applyZoom();}); el('fitCanvasBtn').addEventListener('click',fitStage);
  function serializeNode(node){const json=node.toObject();if(node instanceof Konva.Image && node.image()?.src) json.attrs.src=node.image().src;delete json.attrs.image;return json;}
  function projectData(){return{version:1,master:{width:MASTER,height:MASTER},projectName:data('projectName','모딩 상세페이지'),template:state.template,productLocked:state.productLocked,product:{name:data('productName'),weight:data('productWeight'),storage:data('productStorage'),package:data('productPackage'),headline:data('productHeadline'),description:data('productDescription')},nodes:contentLayer.getChildren().map(serializeNode).filter(o=>o.className!=='Transformer')};}
  function downloadBlob(name,blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  el('saveProjectBtn').addEventListener('click',()=>{downloadBlob(`${safeName(data('projectName','moding-detail'))}.json`,new Blob([JSON.stringify(projectData(),null,2)],{type:'application/json'}));toast('프로젝트 JSON을 저장했습니다');});
  function safeName(v){return String(v||'moding-detail').replace(/[\\/:*?"<>|]/g,'_').slice(0,80);}
  el('exportBtn').addEventListener('click',()=>{deselect();const oldScale=stage.scaleX(),oldW=stage.width(),oldH=stage.height();stage.scale({x:1,y:1});stage.size({width:MASTER,height:MASTER});const uri=stage.toDataURL({pixelRatio:1,mimeType:'image/png'});stage.scale({x:oldScale,y:oldScale});stage.size({width:oldW,height:oldH});applyZoom();const a=document.createElement('a');a.href=uri;a.download=`${safeName(data('projectName','moding-detail'))}-2048.png`;a.click();toast('2048 PNG를 출력했습니다');});
  el('projectFileInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=async()=>{try{const p=JSON.parse(reader.result);await loadProject(p);toast('프로젝트를 불러왔습니다');}catch(err){console.error(err);toast('JSON 파일을 읽지 못했습니다');}};reader.readAsText(file);});
  async function loadProject(p){state.template=p.template||'processed';state.productLocked=p.productLocked!==false;templateButtons.forEach(b=>b.classList.toggle('active',b.dataset.template===state.template));const map={productName:'name',productWeight:'weight',productStorage:'storage',productPackage:'package',productHeadline:'headline',productDescription:'description'};Object.entries(map).forEach(([id,key])=>{el(id).value=p.product?.[key]||'';});el('projectName').value=p.projectName||'모딩 상세페이지';buildBackground('#fff');clearContent();for(const obj of p.nodes||[]){const attrs={...obj.attrs};const src=attrs.src;delete attrs.src;let node;if(obj.className==='Text')node=new Konva.Text(attrs);else if(obj.className==='Rect')node=new Konva.Rect(attrs);else if(obj.className==='Image'&&src){const img=await imageFromSrc(src);attrs.image=img;node=new Konva.Image(attrs);if(attrs.dataRole==='productImage')state.productImage=img;}else continue;node.draggable(!node.getAttr('locked') && attrs.draggable!==false);node.on('click tap',()=>selectNode(node));node.on('dragend transformend',()=>{if(state.selected===node)syncInspector();});contentLayer.add(node);}contentLayer.draw();fitStage();}
  function imageFromSrc(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});}
  el('newProjectBtn').addEventListener('click',()=>{if(!confirm('현재 편집 내용을 지우고 새 프로젝트를 시작할까요?'))return;state.productImage=null;state.template='processed';state.productLocked=true;el('projectName').value='새 상품 상세페이지';templateButtons.forEach(b=>b.classList.toggle('active',b.dataset.template==='processed'));rebuild();toast('새 프로젝트를 시작했습니다');});
  window.addEventListener('resize',()=>{clearTimeout(window.__fitT);window.__fitT=setTimeout(fitStage,120);});
  rebuild();
})();

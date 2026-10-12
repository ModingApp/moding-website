(()=>{
 'use strict';
 const root=document.getElementById('snapRoot'),header=document.querySelector('.site-header'),menu=document.getElementById('mobileMenuOverlay'),toggle=document.getElementById('menuToggle'),closeMenuButton=document.getElementById('menuClose');
 const hosted=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let scheduled=false,menuFocus=null,chatFocus=null;
 const scenes=root?[...root.querySelectorAll(':scope > .scene')]:[];
 function sync(){const h=header?.getBoundingClientRect().height||0;document.documentElement.style.setProperty('--header-height',Math.round(h)+'px');const available=root?root.getBoundingClientRect().height:(window.visualViewport?.height||innerHeight)-h;document.documentElement.style.setProperty('--scene-height',Math.max(320,Math.round(available))+'px');activate()}
 function activate(){scheduled=false;if(!root)return;const r=root.getBoundingClientRect(),point=r.top+Math.min(r.height*.38,250);let selected=scenes.find(s=>{const b=s.getBoundingClientRect();return b.top<=point&&b.bottom>point})||scenes[0];for(const s of scenes){const b=s.getBoundingClientRect(),visible=b.bottom>r.top&&b.top<r.bottom;s.classList.toggle('is-active',s===selected);if(visible){for(const e of s.querySelectorAll('.reveal'))e.classList.add('is-visible')}}document.body.classList.toggle('is-last-scene',selected===scenes.at(-1))}
 root?.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(activate)}},{passive:true});
 if(header)new ResizeObserver(sync).observe(header);addEventListener('resize',sync);window.visualViewport?.addEventListener('resize',sync);sync();
 // All public pages share the same support/page-control clearance, including partial footers.
 const footer=document.querySelector('footer');
 if(footer){
  let footerFrame=0;
  function measureFooter(){
   footerFrame=0;
   const box=footer.getBoundingClientRect(),viewport=root?root.getBoundingClientRect():{top:0,bottom:window.visualViewport?.height||innerHeight};
   const visible=Math.max(0,Math.min(box.bottom,viewport.bottom)-Math.max(box.top,viewport.top));
   document.documentElement.style.setProperty('--footer-height',Math.ceil(box.height)+'px');
   document.documentElement.style.setProperty('--moding-footer-visible',Math.ceil(visible)+'px');
  }
  function scheduleFooter(){if(!footerFrame)footerFrame=requestAnimationFrame(measureFooter)}
  new ResizeObserver(scheduleFooter).observe(footer);
  (root||window).addEventListener('scroll',scheduleFooter,{passive:true});
  addEventListener('resize',scheduleFooter);window.visualViewport?.addEventListener('resize',scheduleFooter);scheduleFooter();
 }
 function closeMenu(){if(!menu||!menu.classList.contains('is-open'))return;menu.classList.remove('is-open');menu.setAttribute('aria-hidden','true');toggle?.setAttribute('aria-expanded','false');if(root){root.style.overflowY='auto';root.inert=false}if(header)header.inert=false;menuFocus?.focus()}
 toggle?.addEventListener('click',()=>{menuFocus=toggle;menu.classList.add('is-open');menu.setAttribute('aria-hidden','false');toggle.setAttribute('aria-expanded','true');if(root){root.style.overflowY='hidden';root.inert=true}if(header)header.inert=true;closeMenuButton?.focus()});closeMenuButton?.addEventListener('click',closeMenu);
 document.querySelectorAll('.mobile-menu-links a').forEach(a=>a.addEventListener('click',closeMenu));
 function scrollToScene(id){const target=document.getElementById(id);target?.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'})}
 document.querySelectorAll('[data-next],[data-scroll-target]').forEach(b=>b.addEventListener('click',()=>scrollToScene(b.dataset.next||b.dataset.scrollTarget)));
 document.querySelectorAll('[data-home-section]').forEach(a=>a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();closeMenu();if(document.body.dataset.page==='index')scrollToScene(a.dataset.homeSection);else if(hosted)window.parent.postMessage({source:'moding-local-preview',action:'navigate',page:'index.html',section:a.dataset.homeSection},'*');else location.href=a.href}));
 document.querySelector('[data-refresh-home]')?.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;if(hosted){e.preventDefault();window.parent.postMessage({source:'moding-local-preview',action:'refresh-home'},'*')}else if(document.body.dataset.page==='index'){e.preventDefault();location.reload()}});
 if(hosted)document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(e.defaultPrevented||!a||a.target==='_blank'||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const raw=a.getAttribute('href');const target=raw.split(/[?#]/)[0];if(window.parent.ModingFullPreviewPages?.includes(target)){e.preventDefault();window.parent.postMessage({source:'moding-local-preview',action:'navigate',page:target},'*')}});
 const chat=document.querySelector('.preview-chat');
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(!chat||chat.hidden))closeMenu()});
 // Original About and Services art: responsive selection and motion only while visible.
 const experienceTabs=[...document.querySelectorAll('[data-experience-tab]')],experiencePanels=[...document.querySelectorAll('[data-experience-panel]')],smallScreen=matchMedia('(max-width: 760px)');let experienceIndex=0;
 function experienceSelect(index,focus=false){if(!experiencePanels[index])return;experienceIndex=index;const mobile=smallScreen.matches;experiencePanels.forEach((panel,i)=>{panel.hidden=mobile&&i!==index;panel.setAttribute('aria-hidden',String(mobile&&i!==index));if(mobile)panel.setAttribute('role','tabpanel');else panel.removeAttribute('role')});experienceTabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1});if(focus)experienceTabs[index]?.focus()}
 experienceTabs.forEach((tab,i)=>{tab.addEventListener('click',()=>experienceSelect(i));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%experienceTabs.length;if(e.key==='ArrowLeft')next=(i+experienceTabs.length-1)%experienceTabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=experienceTabs.length-1;if(next!==undefined){e.preventDefault();experienceSelect(next,true)}})});smallScreen.addEventListener('change',()=>experienceSelect(experienceIndex));experienceSelect(0);
 const flowObserver=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('is-visible',entry.isIntersecting)},{root:root||null,rootMargin:'60px'});document.querySelectorAll('.flow-animate').forEach(n=>flowObserver.observe(n));
 // Choose one original app scene per page load, with its exact title/description.
 const hero=document.querySelector('[data-native-hero]'),original=window.ModingOriginalScenes;
 if(hero&&original){
  let index,elapsed=0,last=0,paused=false;
  const remembered=hosted?window.parent.ModingFullPreviewInitialScene:null;
  if(Number.isInteger(remembered)&&original[remembered])index=remembered;
  else{
   let previous=hosted&&Number.isInteger(window.parent.ModingFullPreviewPreviousScene)?window.parent.ModingFullPreviewPreviousScene:null;try{if(previous===null){const value=sessionStorage.getItem('modingFullPreviewInitial');if(value!==null)previous=Number(value)}}catch{}
   const choices=original.map((_,i)=>i).filter(i=>i!==previous);
   index=choices[Math.floor(Math.random()*choices.length)];
   if(hosted)window.parent.ModingFullPreviewInitialScene=index;
   try{sessionStorage.setItem('modingFullPreviewInitial',String(index))}catch{}
  }
  const canvases=[...hero.querySelectorAll('.native-art canvas')],art=hero.querySelector('.native-art'),heading=hero.querySelector('.native-heading h1'),description=hero.querySelector('.native-description p');
  function copy(){const s=original[index];heading.replaceChildren();description.replaceChildren();description.parentElement.hidden=false;description.style.visibility='visible';description.setAttribute('aria-hidden','false');for(const t of s.title){const line=document.createElement('span'),word=document.createElement(t[1]?'em':'span');word.textContent=t[0];line.append(word);if(t[2])line.append(document.createTextNode(t[2]));heading.append(line)}for(const text of s.text){const line=document.createElement('span');line.textContent=text;description.append(line)}art.setAttribute('aria-label',s.title.map(t=>t[0]+(t[2]||'')).join(' '))}
  // Bounds cover the full original motion (41 sampled frames + 8px safety).
  // Keep this separate from the app artwork/copy; only the webpage framing changes.
  const presentationFrames=[[31,57,677,503],[74,212,599,199],[71,255,566,184],[16,29,314,203],[-1,-9,356,248],[17,19,315,207],[55,29,281,205]];
  const stillFrames=[[31,81,551,329],[74,212,595,196],[74,264,559,174],[16,29,314,203],[13,-9,328,240],[36,19,296,207],[55,54,281,180]];
  const frameFor=i=>(reduced.matches?stillFrames:presentationFrames)[i];
  function fit(){
   const frame=hero.querySelector('.centered-native'),style=getComputedStyle(frame),gap=parseFloat(style.gap)||16;
   const other=[...frame.children].filter(e=>e!==art&&getComputedStyle(e).display!=='none');
   const available=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scene-height'))-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-other.reduce((h,e)=>h+e.getBoundingClientRect().height,0)-gap*other.length;
   const [, ,w,h]=frameFor(index);
   const natural=(art.clientWidth-20)*h/w+20;
   const minimum=innerWidth<=820||matchMedia("(max-height:800px)").matches?180:240;
   const target=Math.round(Math.min(natural,innerWidth<=820?260:400,Math.max(minimum,available)));
   if(art.style.height!==target+'px')art.style.height=target+'px';draw();
  }
  function paint(target,i,p){const w=art.clientWidth,h=art.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(w<=0||h<=0)return;const ctx=target.getContext('2d');if(target.width!==Math.round(w*dpr)||target.height!==Math.round(h*dpr)){target.width=Math.round(w*dpr);target.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const [x,y,fw,fh]=frameFor(i),scale=Math.min((w-20)/fw,(h-20)/fh);ctx.save();ctx.translate((w-fw*scale)/2,(h-fh*scale)/2);ctx.scale(scale,scale);ctx.translate(-x,-y);original[i].paint(ctx,p,reduced.matches);ctx.restore()}
  function draw(){const q=reduced.matches?0:Math.max(0,Math.min(1,(elapsed-4500)/640));canvases[0].style.opacity=String(1-q);canvases[1].style.opacity=String(q);paint(canvases[0],index,reduced.matches?1:Math.min(1,elapsed/3500));if(q>0)paint(canvases[1],index,0)}
  function select(i){if(!Number.isInteger(i)||!original[i])return;index=i;elapsed=0;last=0;copy();fit()}
  reduced.addEventListener('change',()=>{elapsed=0;last=0;fit()});new ResizeObserver(draw).observe(art);
  let lastReduced=reduced.matches;
  function tick(t){if(lastReduced!==reduced.matches){lastReduced=reduced.matches;elapsed=0;last=0;draw()}if(!last)last=t;const delta=Math.min(80,t-last);last=t;if(hero.classList.contains('is-active')&&!document.hidden&&!paused&&!reduced.matches&&(!chat||chat.hidden)){elapsed=(elapsed+delta)%5140;draw()}requestAnimationFrame(tick)}
  new ResizeObserver(fit).observe(heading);new ResizeObserver(fit).observe(description);addEventListener('resize',fit);document.fonts?.ready.then(fit);
  window.ModingHomepage={select,progress(ms){elapsed=Math.max(0,ms)%5140;draw()},pause(value){paused=Boolean(value);last=0},state(){return{index,elapsed,paused}}};copy();fit();requestAnimationFrame(tick);
 }
 requestAnimationFrame(()=>{activate();if(hosted)window.parent.postMessage({source:'moding-local-preview',action:'ready'},'*')});
})();

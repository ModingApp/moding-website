(()=>{
 'use strict';
 const art=document.querySelector('[data-alliance-fulfilment]');if(!art)return;
 const svg=art.querySelector('svg'),scene=art.closest('.scene'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const namespace='http://www.w3.org/2000/svg';
 const poses=[
  {start:[35,95,1.05],middle:[106,183,.78],end:[143,312,.49],delay:720},
  {start:[180,60,1.02],middle:[205,181,.74],end:[189,306,.43],delay:1060},
  {start:[75,195,.95],middle:[138,240,.68],end:[165,309,.42],delay:1400}
 ];
 const transform=v=>`translate(${v[0]}px,${v[1]}px) scale(${v[2]})`;
 const cargo=art.querySelector('#parcel-cargo');
 const items=['fish','bottle','rice'].map((name,i)=>{
  const group=document.createElementNS(namespace,'g'),use=document.createElementNS(namespace,'use');
  group.classList.add('load-item');group.style.transform=transform(poses[i].end);
  use.setAttribute('href','#mh-'+name);group.append(use);cargo.append(group);return group;
 });
 const parcel=art.querySelector('.parcel'),flaps=art.querySelector('.open-flaps'),lid=art.querySelector('.box-lid');
 const animations=[],move='cubic-bezier(.25,.1,.25,1)',fade='cubic-bezier(.42,0,.58,1)';
 function animate(element,frames,duration,delay,easing){const a=element.animate(frames,{duration,delay,easing,fill:'both'});a.pause();animations.push(a)}
 items.forEach((item,i)=>{
  const pose=poses[i];
  animate(item,[{opacity:0},{opacity:1}],420,70+i*70,fade);
  animate(item,[{transform:transform(pose.start)},{transform:transform(pose.middle),offset:.46},{transform:transform(pose.end)}],820,pose.delay,move);
 });
 animate(flaps,[{opacity:1},{opacity:1,offset:.72},{opacity:0}],2910,0,fade);
 animate(lid,[{transform:'translate(0,-22px) scaleY(.08)',opacity:0},{transform:'translate(0,-3px) scaleY(.92)',opacity:1,offset:.83},{transform:'translate(0,0) scaleY(1)',opacity:1}],430,2520,move);
 animate(parcel,[{transform:'translate(0,0)'},{transform:'translate(123px,-18px)',offset:.9},{transform:'translate(118px,-18px)'}],1530,3140,move);
 let elapsed=0,last=0,paused=false;
 const clamp=v=>Math.max(0,Math.min(1,v));
 function draw(){
  const time=reduced.matches?5000:elapsed;
  animations.forEach(a=>{a.currentTime=time});
  svg.style.opacity=reduced.matches?'1':String(clamp(time/320)*(1-clamp((time-6400)/640)));
  art.dataset.phase=time<2520?'packing':time<3140?'closing':time<4670?'moving':'arrived';
 }
 function tick(t){
  if(!last)last=t;const delta=Math.min(80,t-last);last=t;
  const chat=document.querySelector('.preview-chat');
  if(scene.classList.contains('is-active')&&!document.hidden&&!paused&&!reduced.matches&&(!chat||chat.hidden)){elapsed=(elapsed+delta)%7200;draw()}
  if(reduced.matches)draw();requestAnimationFrame(tick);
 }
 reduced.addEventListener('change',()=>{elapsed=0;last=0;draw()});
 window.ModingAlliancePreview={progress(ms){elapsed=Math.max(0,ms)%7200;draw()},pause(value){paused=Boolean(value);last=0},state(){return{elapsed,paused,phase:art.dataset.phase}}};
 draw();requestAnimationFrame(tick);
})();

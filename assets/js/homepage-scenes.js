/* Original painter geometry and timing functions from current buyer production. */
(()=>{
'use strict';
const paths={"0":"M123  224C164  191  220  194  251  220C220  247  164  250  123  224Z","1":"M123  224L89  200L93  239Z","2":"M301  164C319  143  353  145  365  164C383  159  396  175  393  191C407  205  395  230  373  231C359  248  329  248  316  231C295  231  287  207  300  192C293  179  294  170  301  164Z","3":"M315  203Q344  184  376  203","4":"M480  220L570  220L561  344Q527  362  493  344Z","5":"M498  247L553  247","6":"M166  351C177  318  214  307  242  324C266  340  264  378  236  395C205  408  168  385  166  351Z","7":"M179  339L229  389M197  321L242  373","8":"M90  92L165  167","9":"M0  45L86  8L172  45L86  85Z","10":"M0  45L0  132L86  171L86  85","11":"M172  45L172  132L86  171","12":"M47  105C63  92  87  94  100  105C87  116  63  118  47  105Z","13":"M47  105L35  96L37  112Z","14":"M12  98L154  98L154  194L12  194Z","15":"M2  98L25  49L141  49L164  98","16":"M20  72L147  72","17":"M268  322C349  250  431  250  494  322","18":"M-12  -6L12  -6M0  -15L0  15","19":"M0  45L70  13L140  45L70  80Z","20":"M0  45L0  116L70  151L70  80","21":"M140  45L140  116L70  151","22":"M70  13L70  80","23":"M245  349C286  315  320  311  356  327","24":"M0  25L179  25L179  112L0  112Z","25":"M179  53L233  53L264  83L264  112L179  112Z","26":"M43  67C63  51  93  53  108  66C93  81  63  83  43  67Z","27":"M43  67L27  56L29  75Z","28":"M126  53L154  53L151  91Q140  98  129  91Z"};
const paints={"0":{"color":"#FFFFFF","alpha":1,"fill":false,"width":7,"cap":"butt","join":"miter"},"1":{"color":"#FFFFFF","alpha":1,"fill":false,"width":7,"cap":"butt","join":"round"},"2":{"color":"#FF8C00","alpha":1,"fill":true,"width":1,"cap":"butt","join":"miter"},"3":{"color":"#FF8C00","alpha":1,"fill":false,"width":6,"cap":"round","join":"round"},"4":{"color":"#FF8C00","alpha":1,"fill":false,"width":7,"cap":"round","join":"round"},"5":{"color":"#FFFFFF","alpha":1,"fill":false,"width":6,"cap":"butt","join":"miter"},"6":{"color":"#FF8C00","alpha":1,"fill":false,"width":4,"cap":"round","join":"round"},"7":{"color":"#FFFFFF","alpha":1,"fill":false,"width":10,"cap":"butt","join":"miter"},"8":{"color":"#FFFFFF","alpha":1,"fill":false,"width":19,"cap":"round","join":"round"},"9":{"color":"#FF8C00","alpha":1,"fill":false,"width":4,"cap":"butt","join":"miter"},"10":{"color":"#FF8C00","alpha":1,"fill":false,"width":4,"cap":"butt","join":"round"},"11":{"color":"#FF8C00","alpha":1,"fill":false,"width":14,"cap":"round","join":"round"},"12":{"color":"#FFFFFF","alpha":0.8196078431372549,"fill":false,"width":5,"cap":"round","join":"round"},"13":{"color":"#FFFFFF","alpha":1,"fill":false,"width":3,"cap":"round","join":"round"},"14":{"color":"#FFFFFF","alpha":0.6196078431372549,"fill":false,"width":4,"cap":"round","join":"round"},"15":{"color":"#FF8C00","alpha":1,"fill":false,"width":5,"cap":"butt","join":"miter"},"16":{"color":"#FF8C00","alpha":1,"fill":false,"width":5,"cap":"butt","join":"round"},"17":{"color":"#FFFFFF","alpha":1,"fill":true,"width":1,"cap":"butt","join":"miter"},"18":{"color":"#238B22","alpha":1,"fill":true,"width":1,"cap":"butt","join":"miter"}};
const P=Object.fromEntries(Object.entries(paths).map(([k,d])=>[k,new Path2D(d)]));

function legacyStyle(c,i){const s=paints[i];c.strokeStyle=s.color;c.fillStyle=s.color;c.globalAlpha=s.alpha;c.lineWidth=s.width;c.lineCap=s.cap;c.lineJoin=s.join;return s}
function legacyPath(c,i,j,dash=[]){const s=legacyStyle(c,j);c.setLineDash(dash);s.fill?c.fill(P[i]):c.stroke(P[i]);c.setLineDash([]);c.globalAlpha=1}
function legacyCircle(c,x,y,r,j){const s=legacyStyle(c,j);c.beginPath();c.arc(x,y,r,0,Math.PI*2);s.fill?c.fill():c.stroke();c.globalAlpha=1}
function legacyRect(c,x,y,w,h,r,j){const s=legacyStyle(c,j);c.beginPath();c.roundRect(x,y,w,h,r);s.fill?c.fill():c.stroke();c.globalAlpha=1}
function cubic(x,x1,y1,x2,y2){let lo=0,hi=1,t=.5;for(let n=0;n<22;n++){t=(lo+hi)/2;const q=3*(1-t)*(1-t)*t*x1+3*(1-t)*t*t*x2+t*t*t;if(q<x)lo=t;else hi=t}return 3*(1-t)*(1-t)*t*y1+3*(1-t)*t*t*y2+t*t*t}
function keys(p,t,v,curve){for(let i=1;i<t.length;i++)if(p<=t[i]){const q=Math.max(0,Math.min(1,(p-t[i-1])/(t[i]-t[i-1])));return v[i-1]+(v[i]-v[i-1])*curve(q)}return v[v.length-1]}
function around(c,x,y,s){c.translate(x,y);c.scale(s,s);c.translate(-x,-y)}
const centers=[[170,220.917453],[346.358052,196.370318],[525,286.5],[212.307692,357.383086]];
const inOut=x=>cubic(x,.42,0,.58,1),truckCurve=x=>cubic(x,.22,.78,.28,1);
function routePoint(t){const u=1-t;return [u*u*u*268+3*u*u*t*349+3*u*t*t*431+t*t*t*494,u*u*u*322+3*u*u*t*250+3*u*t*t*250+t*t*t*322]}
const routeSamples=[{t:0,length:0,point:routePoint(0)}];
for(let i=1;i<=512;i++){const point=routePoint(i/512),last=routeSamples[i-1];routeSamples.push({t:i/512,length:last.length+Math.hypot(point[0]-last.point[0],point[1]-last.point[1]),point})}
function placeParcel(c,p){const target=p*routeSamples[512].length;let lo=0,hi=512;while(lo+1<hi){const mid=(lo+hi)>>1;if(routeSamples[mid].length<target)lo=mid;else hi=mid}const a=routeSamples[lo],b=routeSamples[hi],t=a.t+(b.t-a.t)*(target-a.length)/(b.length-a.length),q=routePoint(t),u=1-t;const dx=3*u*u*(349-268)+6*u*t*(431-349)+3*t*t*(494-431),dy=3*u*u*(250-322)+3*t*t*(322-250);c.translate(q[0],q[1]);c.rotate(Math.atan2(dy,dx))}
  const WHITE='#ffffff', ORANGE='#ff8c00', GREEN='#238b22';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>1-Math.pow(1-clamp(x),3);
  const phase=(p,a,b)=>ease((p-a)/(b-a));
  function path(c,points,color=WHITE,width=3.3,fill=null){c.beginPath();points(c);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';if(fill){c.fillStyle=fill;c.fill()}c.stroke()}
  function line(c,x1,y1,x2,y2,color=WHITE,width=3.3){path(c,q=>{q.moveTo(x1,y1);q.lineTo(x2,y2)},color,width)}
  function box(c,x,y,w,h,r=8,fill=GREEN,color=WHITE){path(c,q=>q.roundRect(x,y,w,h,r),color,3.3,fill)}
  function circle(c,x,y,r,fill=GREEN,color=WHITE,width=3.3){path(c,q=>q.arc(x,y,r,0,Math.PI*2),color,width,fill)}
  function carrot(c,x,y,scale=1,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);path(c,q=>{q.moveTo(-10,-15);q.quadraticCurveTo(2,-26,13,-15);q.lineTo(-5,29);q.closePath()},WHITE,3,ORANGE);path(c,q=>{q.moveTo(1,-19);q.quadraticCurveTo(-20,-42,-15,-44);q.quadraticCurveTo(0,-40,3,-21);q.quadraticCurveTo(20,-46,24,-40);q.quadraticCurveTo(21,-25,7,-19)},WHITE,2.8);line(c,-5,-5,4,-1,WHITE,2.4);line(c,-5,8,0,10,WHITE,2.4);c.restore()}
  function bottle(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);box(c,-9,-37,18,12,3,ORANGE);path(c,q=>{q.moveTo(-9,-25);q.lineTo(-9,-16);q.quadraticCurveTo(-21,-8,-21,0);q.lineTo(-21,32);q.quadraticCurveTo(-21,38,-15,38);q.lineTo(15,38);q.quadraticCurveTo(21,38,21,32);q.lineTo(21,0);q.quadraticCurveTo(21,-8,9,-16);q.lineTo(9,-25);q.closePath()},WHITE,3,GREEN);box(c,-15,3,30,20,4,ORANGE);line(c,-7,12,7,12,WHITE,2.6);c.restore()}
  function fish(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);path(c,q=>{q.moveTo(-30,0);q.quadraticCurveTo(-9,-26,20,-6);q.lineTo(35,-17);q.lineTo(32,0);q.lineTo(35,17);q.lineTo(20,6);q.quadraticCurveTo(-9,26,-30,0);q.closePath()},WHITE,3,GREEN);circle(c,-17,-3,1.4,WHITE,WHITE,1);path(c,q=>{q.moveTo(-5,-13);q.quadraticCurveTo(4,0,-5,13)},WHITE,2.4);c.restore()}
  function heart(c,x,y,s=1,filled=true){c.save();c.translate(x,y);c.scale(s,s);path(c,q=>{q.moveTo(0,26);q.bezierCurveTo(-10,17,-29,2,-29,-12);q.bezierCurveTo(-29,-33,-7,-38,0,-21);q.bezierCurveTo(8,-38,29,-33,29,-12);q.bezierCurveTo(29,2,10,17,0,26);q.closePath()},WHITE,3.3,filled?ORANGE:GREEN);c.restore()}
  function sprout(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);path(c,q=>{q.moveTo(0,15);q.lineTo(0,-4);q.bezierCurveTo(-24,-5,-25,-23,-25,-23);q.bezierCurveTo(-4,-27,0,-10,0,-4);q.bezierCurveTo(3,-26,26,-28,26,-28);q.bezierCurveTo(30,-11,16,0,0,0)},WHITE,3,GREEN);c.restore()}
  function parcel(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);path(c,q=>{q.moveTo(-32,-14);q.lineTo(0,-30);q.lineTo(32,-14);q.lineTo(32,23);q.lineTo(0,39);q.lineTo(-32,23);q.closePath()},WHITE,3.3,GREEN);path(c,q=>{q.moveTo(-32,-14);q.lineTo(0,2);q.lineTo(32,-14);q.moveTo(0,2);q.lineTo(0,39)},WHITE,3);path(c,q=>{q.moveTo(-10,-25);q.lineTo(22,-9);q.lineTo(22,4);q.lineTo(11,9);q.lineTo(11,-3);q.lineTo(-21,-19)},ORANGE,4);c.restore()}
  function pantry(c,p){
    line(c,92,39,92,195);line(c,290,39,290,195);line(c,81,117,301,117);line(c,81,189,301,189);
    const a=phase(p,.08,.42),b=phase(p,.25,.59),d=phase(p,.43,.79);
    c.save();c.translate(-57*(1-a),69*(1-a));carrot(c,125,81,.67,-.12);c.restore();
    c.save();c.translate(-96*(1-b),76*(1-b));bottle(c,192,83,.72);c.restore();
    c.save();c.translate(-133*(1-d),66*(1-d));box(c,235,55,37,57,6);line(c,240,65,267,65,ORANGE,5);fish(c,253,91,.36);c.restore();
    box(c,116,141,67,43,7);line(c,121,154,178,154,ORANGE,5);sprout(c,215,162,.6);box(c,241,146,36,38,5);line(c,251,157,267,157,ORANGE,4);line(c,251,169,263,169);
    const n=Math.sin(Math.PI*clamp(p/.5))*4;parcel(c,55,179-n,.8);line(c,26,222,318,222,WHITE,2.5);
    if(p>.77){const z=phase(p,.77,.96);c.globalAlpha=z;line(c,314,67,314,79,ORANGE,3);line(c,308,73,320,73,ORANGE,3);c.globalAlpha=1}
  }
  function productCard(c,x,y,kind,angle=0){c.save();c.translate(x,y);c.rotate(angle);box(c,-45,-60,90,125,11);line(c,-30,38,30,38);line(c,-30,50,5,50,WHITE,2.8);if(kind===0)carrot(c,0,-10,.75,-.1);else if(kind===1)fish(c,0,-10,.9);else bottle(c,0,-9,.65);c.restore()}
  function favorite(c,p){
    const t=phase(p,.03,.45);productCard(c,74-14*(1-t),152+8*(1-t),0,-.12);productCard(c,280+14*(1-t),152+8*(1-t),2,.12);productCard(c,177,145-9*t,1);
    const h=phase(p,.36,.73);const bounce=Math.sin(Math.PI*h)*.12;heart(c,177,58-9*h,.83+bounce,p>.42);
    const a=phase(p,.63,.88);c.globalAlpha=a;heart(c,106,104,.25,true);heart(c,307,105,.25,true);c.globalAlpha=1;
    if(p>.64){const k=phase(p,.64,.91);c.globalAlpha=k;line(c,139,40,130,35,WHITE,2.8);line(c,213,41,221,36,WHITE,2.8);line(c,177,9,177,1,ORANGE,3);c.globalAlpha=1}
  }
  function sheet(c,x,y,w,h,fold=false){box(c,x,y,w,h,8);if(fold){path(c,q=>{q.moveTo(x+w-28,y);q.lineTo(x+w-28,y+29);q.lineTo(x+w,y+29)},WHITE,3,GREEN)} }
  function receipt(c,p){
    const a=phase(p,.04,.43);c.save();c.translate(-19*(1-a),14*(1-a));sheet(c,46,38,131,157,true);box(c,63,60,25,24,5,ORANGE);line(c,98,65,129,65);line(c,98,77,141,77,WHITE,2.6);line(c,65,107,151,107);line(c,65,126,136,126);line(c,65,145,145,145);line(c,65,172,96,172,ORANGE,5);c.restore();
    const b=phase(p,.18,.68);c.save();c.translate(25*(1-b),-14*(1-b));path(c,q=>{q.moveTo(174,69);q.lineTo(287,69);q.quadraticCurveTo(294,69,294,76);q.lineTo(294,216);for(let i=0;i<6;i++){q.lineTo(284-i*20,209);q.lineTo(274-i*20,216)}q.lineTo(167,216);q.lineTo(167,76);q.quadraticCurveTo(167,69,174,69);q.closePath()},WHITE,3.3,GREEN);line(c,186,90,264,90,ORANGE,5);line(c,184,114,276,114);line(c,184,133,251,133);line(c,184,153,269,153);c.setLineDash([3,6]);line(c,184,173,277,173,WHITE,2.4);c.setLineDash([]);line(c,235,194,275,194,ORANGE,4);c.restore();
    const d=phase(p,.63,.95);circle(c,295,56,27,ORANGE);c.save();c.beginPath();c.rect(269,27,55*d,60);c.clip();path(c,q=>{q.moveTo(281,56);q.lineTo(291,66);q.lineTo(311,45)},WHITE,4);c.restore();
  }
  function menu(c,p){
    const toss=Math.sin(Math.PI*clamp((p-.14)/.64));const wiggle=Math.sin(Math.PI*2*clamp(p/.82))*2.2;
    c.save();c.translate(0,wiggle);path(c,q=>{q.moveTo(72,154);q.bezierCurveTo(80,212,223,220,242,154);q.closePath()},WHITE,3.5,GREEN);path(c,q=>{q.moveTo(241,163);q.lineTo(315,151);q.quadraticCurveTo(327,150,326,160);q.quadraticCurveTo(326,166,318,168);q.lineTo(237,184)},WHITE,3.5,GREEN);line(c,92,184,110,195,ORANGE,5);c.restore();
    carrot(c,129-12*toss,134-64*toss,.6,-.55-.25*toss);sprout(c,188+11*toss,133-76*toss,.68);fish(c,162+5*toss,132-39*toss,.7);
    const t=phase(p,.69,1);c.globalAlpha=t;for(let i=0;i<3;i++){path(c,q=>{const x=121+i*36;q.moveTo(x,90);q.bezierCurveTo(x-10,82,x+9,76,x,64)},WHITE,2.8)}c.globalAlpha=1;
    line(c,65,224,295,224,WHITE,2.5);
  }
function discovery(c,p,reduced){
  const time=reduced?0:p*3500;
  for(let i=0;i<4;i++){
    const begin=i===0?0:360+(i-1)*920+570,end=i===3?3500:360+i*920;
    const strength=reduced?(i===0?1:0):time<begin?0:time<end?cubic(Math.min(1,(time-begin)/360),.22,1.35,.36,1):1-cubic(Math.min(1,(time-end)/360),0,0,.58,1);
    c.save();c.translate(0,-4*strength);around(c,...centers[i],1+.13*strength);
    if(i===0){legacyPath(c,0,0);legacyPath(c,1,1);legacyCircle(c,219,219,5,2)}
    if(i===1){legacyPath(c,2,1);legacyPath(c,3,3)}
    if(i===2){legacyPath(c,4,1);legacyPath(c,5,4)}
    if(i===3){legacyPath(c,6,5);legacyPath(c,7,6)}c.restore();
  }
  const next=Math.max(0,Math.min(3,Math.floor((time-360)/920)+1));let pos=centers[0];
  if(next){const a=centers[next-1],b=centers[next],q=Math.max(0,Math.min(1,(time-360-(next-1)*920)/570)),e=1-(1-q)**3;pos=[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e+Math.sin(Math.PI*q)*(next%2===0?-28:24)]}
  c.save();c.translate(...pos);legacyCircle(c,0,0,126,7);legacyPath(c,8,8);legacyCircle(c,0,0,7,2);c.restore();
}
function connection(c,p,reduced){
  c.save();c.translate(86,216);for(const [i,j] of [[9,1],[10,1],[11,1],[12,9],[13,10]])legacyPath(c,i,j);c.restore();
  c.save();c.translate(494,202);around(c,83,121.5,keys(p,[0,.76,.86,.92,1],[1,1,1.045,.992,1],inOut));legacyPath(c,14,0);legacyPath(c,15,1);legacyPath(c,16,11,[19,15]);legacyRect(c,73,135,34,59,5,2);c.restore();
  legacyPath(c,17,12,[11,15]);c.save();placeParcel(c,reduced ? 0.5 : p);legacyRect(c,-17,-15,34,30,6,2);legacyPath(c,18,13);c.restore();
}
function delivery(c,p){
  const times=[0,.18,.24,.31,.38,1],y=keys(p,times,[0,0,-8,1,0,0],inOut),angle=keys(p,times,[0,0,-2,1,0,0],inOut),scale=keys(p,times,[1,1,1.025,.99,1,1],inOut);
  c.save();c.translate(86,263+y);c.translate(70,82);c.rotate(angle*Math.PI/180);c.scale(scale,scale);c.translate(-70,-82);for(const [i,j] of [[19,1],[20,1],[21,1],[22,4]])legacyPath(c,i,j);c.restore();
  legacyPath(c,23,14,[9,13]);const t=[0,.18,.27,.34,.68,.76,.84,1];c.save();c.translate(357+keys(p,t,[-122,-122,-119,-122,0,4,0,0],truckCurve),288+keys(p,t,[1,-1,1,0,-2,0,-1,0],truckCurve));legacyPath(c,24,1);legacyPath(c,25,1);legacyRect(c,196,66,36,24,4,2);legacyPath(c,26,15);legacyPath(c,27,16);legacyPath(c,28,16);legacyCircle(c,58,123,19,17);legacyCircle(c,211,123,19,17);legacyCircle(c,58,123,8,18);legacyCircle(c,211,123,8,18);c.restore();
}

const scenes=[
  {id:'discovery',title:[['새로운 상품을',false],['찾고 싶을 때',true]],text:['수산물부터 육가공, 소스·가공식품까지','가게에 필요한 새로운 선택지를 만나보세요'],frame:[25,40,690,505],paint:discovery},
  {id:'connection',title:[['좋은 식품은',false],['좋은 가게',true,'를'],['만나야 하니까',false]],text:['모딩은 식품제조사와','외식업 사장님을 연결합니다'],frame:[45,175,650,270],paint:connection},
  {id:'delivery',title:[['택배도',false],['직배송도',true]],text:['상품과 지역에 맞는 배송방식으로','주문하세요'],frame:[40,210,650,275],paint:delivery},
  {id:'pantry',title:[['가게의 하루를',false],['든든하게',true]],text:['오늘도 바쁜 우리 가게','필요한 식자재는 모딩에서'],frame:[0,0,350,245],paint:pantry},
  {id:'favorite',title:[['마음에 들면',false],['찜해두세요',true]],text:['다시 찾고 싶은 상품은','찜 목록에 모아두세요'],frame:[0,0,350,245],paint:favorite},
  {id:'receipt',title:[['주문부터',false],['증빙까지',true],['한눈에',false]],text:['주문 내역과 거래 증빙을','필요할 때 확인하세요'],frame:[0,0,350,245],paint:receipt},
  {id:'menu',title:[['좋은 식재료가',false],['좋은 메뉴로',true]],text:['우리 가게 메뉴에 어울리는','새로운 식재료를 만나보세요'],frame:[0,0,350,245],paint:menu},
];

window.ModingOriginalScenes=Object.freeze(scenes);
})();

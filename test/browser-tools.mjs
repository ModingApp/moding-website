// Mac checks of independent web controls. Authentication and real submissions stay untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
const {chromium,webkit}=await import(process.env.MODING_PLAYWRIGHT_MODULE||'playwright');
const repo=fileURLToPath(new URL('../',import.meta.url));
const out=process.env.MODING_QA_OUTPUT;
if(out)await fs.mkdir(out,{recursive:true});
const types={html:'text/html',js:'text/javascript',css:'text/css',png:'image/png',pdf:'application/pdf'};
const server=createServer(async(req,res)=>{const file=path.resolve(repo,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(repo)){res.writeHead(403);return res.end()};try{const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[file.split('.').pop()]||'application/octet-stream'});res.end(body)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const local='http://127.0.0.1:'+server.address().port,base=process.env.MODING_QA_URL||'https://moding.app';
const report={pages:[],errors:[],mutations:[],analyticsBlocked:0,download:[]};
const specs=[
 ['admin.html','.login-desc,.trust-option strong,.trust-option small,.password-toggle,.login-submit'],
 ['seller-proposal.html','p,.mobile-note,a.btn'],
 ['seller-application/index.html','label,.hint,.file-status,.agreement-note,input:not([type=file]):not([type=checkbox]),select,textarea,button'],
 ['detail-maker/index.html','#setupView label,#setupView input:not([type=file]),#setupView textarea,#setupView .note,#setupView .step-track span,#setupView small,#setupView .badge,.top-actions .btn,#generateBtn small']
];
async function contextFor(browser,viewport,userAgent){const c=await browser.newContext({viewport,userAgent,reducedMotion:'reduce'});await c.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(!['GET','HEAD','OPTIONS'].includes(req.method())){if(url.pathname==='/track/visit')report.analyticsBlocked++;else if(!url.pathname.includes('stats'))report.mutations.push(url.pathname);return route.abort()};if(!process.env.MODING_QA_URL&&url.origin===new URL(base).origin)return route.fulfill({response:await c.request.get(local+url.pathname+url.search)});return route.continue()});return c}
try{
 for(const[engine,launcher]of [['chrome',chromium],['webkit',webkit]].filter(([e])=>!process.env.MODING_QA_ENGINE||e===process.env.MODING_QA_ENGINE)){
  const browser=await launcher.launch(engine==='chrome'?{channel:'chrome',headless:true}:{headless:true});
  try{
   for(const[width,height]of JSON.parse(process.env.MODING_QA_SIZES||'[[1440,900],[390,844],[320,720]]')){
    const c=await contextFor(browser,{width,height}),page=await c.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
    for(const[file,selector]of specs){
     const response=await page.goto(base+'/'+file,{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.evaluate(()=>document.fonts.ready);
     const data=await page.evaluate(selector=>{
      const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
      return{overflow:document.documentElement.scrollWidth>innerWidth+1,small:[...document.querySelectorAll(selector)].filter(visible).filter(e=>parseFloat(getComputedStyle(e).fontSize)<14).map(e=>({tag:e.tagName,text:e.textContent.trim().slice(0,70),font:getComputedStyle(e).fontSize})),buttons:[...document.querySelectorAll('button,a.btn')].filter(visible).filter(e=>e.getBoundingClientRect().height<44).map(e=>({text:e.textContent.trim(),height:e.getBoundingClientRect().height})),broken:[...document.images].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src)};
     },selector);
     assert(!data.overflow,engine+'/'+file+'/'+width+' overflow');assert.deepEqual(data.small,[],file+' small text');assert.deepEqual(data.buttons,[],file+' small buttons');assert.deepEqual(data.broken,[],file+' broken images');
     if(file==='admin.html'){
      await page.locator('.password-toggle').click();assert.equal(await page.locator('input[type=text]').count()>0,true);await page.locator('.password-toggle').click();
     }
     if(file==='detail-maker/index.html'){
      await page.locator('#generateBtn').click();assert(await page.locator('#setupView').isVisible(),'missing photo must keep setup open');
     }
     if(out){await page.screenshot({path:path.join(out,engine+'-'+width+'x'+height+'-'+file.replaceAll('/','-')+'.png'),fullPage:true})}
     report.pages.push({engine,file,width,height});
    }await c.unrouteAll({behavior:'wait'});await c.close();console.log(JSON.stringify({checked:engine,width,pages:4}));
   }
  }finally{await browser.close()}
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.mutations,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1}
finally{await new Promise(r=>server.close(r));if(out)await fs.writeFile(path.join(out,'tools.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report))}

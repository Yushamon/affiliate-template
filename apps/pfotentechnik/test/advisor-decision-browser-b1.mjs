// Browser checks: ADVISOR_PLAYWRIGHT_MODULE may point to an existing external Playwright install.
// Set ADVISOR_BASE_URL for a dev server, or serve the production dist automatically.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.ADVISOR_PLAYWRIGHT_MODULE ?? 'playwright');
const dist=path.resolve('apps/pfotentechnik/dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
let server;
let origin=process.env.ADVISOR_BASE_URL;
if(!origin){
 server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const file=path.resolve(dist,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(dist+'/')||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream'});fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;
}
const browser=await chromium.launch({headless:true,executablePath:process.env.ADVISOR_BROWSER_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],checks=[];let links=0;
const gps='/kaufberatung/?world=gps&pet=cat&weight=4&subscription=yes&features=light,live';
const fountain='/kaufberatung/?world=fountain&pet=multiple&material=steel&cordless=yes&features=capacity';
const output=process.env.ADVISOR_SCREENSHOTS;
try{
 for(const width of [375,1600])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const [name,route]of [['gps',gps],['fountain',fountain]]){
   await page.goto(origin+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('[data-decision-results]').isVisible(),true);
   assert.ok(await page.locator('.decision-match').count()>0);
   assert.ok(await page.locator('.decision-match').count()<=3);
   for(const image of await page.locator('.decision-match img').all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(i=>i.decode()); }
   await page.evaluate(()=>window.scrollTo(0,0));
   const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,background:getComputedStyle(document.querySelector('.decision-panel')).backgroundColor,text:getComputedStyle(document.querySelector('.pt-decision')).color,images:[...document.querySelectorAll('.decision-match img')].every(i=>i.complete&&i.naturalWidth>0)}));
   assert.ok(metrics.scrollWidth<=width+1,JSON.stringify({name,theme,metrics}));assert.ok(metrics.images,'Product images load');
   assert.equal(await page.locator('h1:visible').count(),1);
   const canonical=await page.locator('link[rel=canonical]').getAttribute('href');assert.ok(canonical.endsWith('/kaufberatung/')&&!canonical.includes('?'));
   const hrefs=await page.locator('.pt-decision a[href]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
   for(const href of new Set(hrefs))if(href.startsWith('/')){const res=await fetch(origin+href);assert.equal(res.status,200,href);links++;}
   if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:`${output}/${name}-${width}-${theme}.png`,fullPage:true});}
   checks.push({name,width,theme,...metrics});
  }
  await page.goto(origin+'/kaufberatung/?world=gps',{waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-world-form=gps]').isVisible(),true);
  await page.locator('[data-world-form=gps] [data-next]').click();assert.equal(await page.locator('[data-world-form=gps] [data-error]').isVisible(),true);
  const choose=async(name,value)=>{await page.locator(`[data-world-form=gps] label:has(input[name="${name}"][value="${value}"])`).click();await page.locator('[data-world-form=gps] [data-next]').click();};
  await choose('pet','cat');await page.locator('[data-world-form=gps] input[name=weight]').fill('4');await page.locator('[data-world-form=gps] [data-next]').click();
  await page.locator('[data-world-form=gps] [data-back]').click();assert.equal(await page.locator('[data-world-form=gps] input[name=weight]').inputValue(),'4');
  await page.locator('[data-world-form=gps] [data-next]').click();await choose('subscription','yes');await page.locator('[data-world-form=gps] input[value=live]').check();await page.locator('[data-world-form=gps] [data-next]').click();
  assert.equal(await page.locator('[data-decision-results]').isVisible(),true);assert.ok(page.url().includes('features=live'));
  await page.locator('[data-edit-steps] [data-edit-step="1"]').click();assert.equal(await page.locator('[data-world-form=gps] input[name=weight]').inputValue(),'4');
  await page.locator('[data-world-form=gps] input[name=weight]').fill('5');await page.locator('[data-world-form=gps] [data-next]').click();await page.locator('[data-world-form=gps] [data-next]').click();await page.locator('[data-world-form=gps] [data-next]').click();assert.ok(page.url().includes('weight=5'));
  await page.goBack();assert.ok(page.url().includes('weight=4'));assert.equal(await page.locator('[data-decision-results]').isVisible(),true);
  await page.reload({waitUntil:'networkidle'});assert.match(await page.locator('[data-answer-summary]').textContent(),/4 kg/);
  const more=page.locator('[data-more]');if(await more.isVisible()){const before=await page.locator('.decision-match').count();await more.click();assert.ok(await page.locator('.decision-match').count()>before);}
  await page.goto(origin+'/kaufberatung/',{waitUntil:'networkidle'});assert.equal(await page.locator('[data-advisor-world]').count(),6);assert.equal(await page.locator('[data-advice-hub]').isVisible(),true);
  await page.locator('[data-advisor-world=fountain]').click();
  const fc=async(name,value)=>{await page.locator(`[data-world-form=fountain] label:has(input[name="${name}"][value="${value}"])`).click();await page.locator('[data-world-form=fountain] [data-next]').click();};
  await fc('pet','multiple');await fc('material','steel');await page.locator('[data-world-form=fountain] [data-next]').click();await fc('cordless','yes');
  assert.equal(await page.locator('[data-decision-results]').isVisible(),true);assert.ok(page.url().includes('world=fountain'));
  await page.goto(origin+'/berater/futterautomat/?pet=cat&count=one&food=dry&budget=open&style=best-match',{waitUntil:'networkidle'});assert.ok(await page.locator('.result-card').count()>0);
  await context.close();
 }
 // Deterministic browser fixtures cover both fallbacks and targeted edit without resetting answers.
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const unknown of [true,false]){
  await page.route('**/kaufberatung/?**',async route=>{
   const response=await route.fetch();let html=await response.text();
   const fixture=[{id:'fixture',slug:'fixture',title:'Fixture',category:'gps-tracker',route:'/produkt/fixture/',score:90,decisionFacts:{animal:{status:'known',value:['cat']},minimumWeight:unknown?{status:'unknown'}:{status:'known',value:8}}}];
   html=html.replace(/data-products="[^"]*"/,`data-products="${JSON.stringify(fixture).replaceAll('&','&amp;').replaceAll('"','&quot;')}"`);
   await route.fulfill({response,body:html});
  });
  await page.goto(origin+gps,{waitUntil:'networkidle'});
  assert.match(await page.locator('[data-fallback]').textContent(),unknown?/Kein Modell erfüllt/:/sehr eng/);
  assert.equal(await page.locator('.decision-match').count(),unknown?1:0);
  await page.locator('[data-fallback] [data-edit-step="1"]').click();assert.equal(await page.locator('[data-world-form=gps] input[name=weight]').inputValue(),'4');
  await page.unroute('**/kaufberatung/?**');
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',checks,links,browserErrors:errors,flows:['GPS','fountain','back/edit','URL reload','browser back','more results','zero PASS','zero results','targeted edit','feeder regression']},null,2));
}finally{await browser.close();server?.close();}

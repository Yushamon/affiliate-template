#!/usr/bin/env node
// Reuses existing viewport-smoke metrics and findings, with installed Chrome when Electron is unavailable.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import http from 'node:http';import vm from 'node:vm';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),dist=path.join(app,'dist');
const outIndex=process.argv.indexOf('--out');const out=path.resolve(app,'../..',outIndex>=0?process.argv[outIndex+1]:'reports/google-signal-integrity-35.2');
fs.mkdirSync(out,{recursive:true});
const src=fs.readFileSync(path.join(app,'scripts/performance/viewport-smoke.cjs'),'utf8');
const {inspectPage,findingsFor}=vm.runInNewContext(src.slice(src.indexOf('const inspectPage ='),src.indexOf('app.whenReady()'))+';({inspectPage,findingsFor})');
const routes=vm.runInNewContext(src.slice(src.indexOf('const routes ='),src.indexOf('const viewports ='))+';routes');
const viewports=vm.runInNewContext(src.slice(src.indexOf('const viewports ='),src.indexOf('const mime ='))+';viewports');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{let route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const f=path.resolve(dist,'.'+route+(route.endsWith('/')?'index.html':''));if(!f.startsWith(dist+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(f)]??'application/octet-stream'});fs.createReadStream(f).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'pt35-chrome-'));const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='';chrome.stderr.on('data',d=>stderr+=d);
let ws;
try{
const endpoint=await new Promise((resolve,reject)=>{let loops=0;const timer=setInterval(()=>{const m=stderr.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearInterval(timer);resolve(m[1]);}else if(++loops>100){clearInterval(timer);reject(new Error('Chrome startup failed: '+stderr));}},100);});
ws=new WebSocket(endpoint);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=ev=>{const m=JSON.parse(ev.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}}};
const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
const {targetId}=await call('Target.createTarget',{url:'about:blank'});const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});const c=(m,p)=>call(m,p,sessionId);await c('Page.enable');await c('Runtime.enable');
const results=[];
for(const viewport of viewports){await c('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:false});for(const route of routes){await c('Page.navigate',{url:`http://127.0.0.1:${server.address().port}${route}`});await new Promise(r=>setTimeout(r,150));await c('Runtime.evaluate',{expression:'Promise.all([document.fonts.ready,...[...document.images].filter(i=>i.loading!=="lazy").map(i=>i.decode().catch(()=>{}))])',awaitPromise:true});const r=await c('Runtime.evaluate',{expression:`(${inspectPage.toString()})()`,returnByValue:true});const metrics=r.result.value;const findings=findingsFor(route,viewport,metrics);results.push({route,viewport,metrics,findings});console.log(viewport.name,route,findings.length);}}
const closureVisual=[];
if(process.argv.includes('--closure-visual')){
 const route='/smarte-futterautomaten/';const dir=path.join(out,'screenshots');fs.mkdirSync(dir,{recursive:true});
 for(const theme of ['light','dark'])for(const width of [375,768,1024,1600]){
  const viewport={name:`${width}-${theme}`,width,height:900};
  await c('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await c('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme}]});
  await c('Page.navigate',{url:`http://127.0.0.1:${server.address().port}${route}`});
  await new Promise(r=>setTimeout(r,200));
  await c('Runtime.evaluate',{expression:'(async()=>{for(const image of document.images)image.loading="eager";await Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>{}))]);})()',awaitPromise:true});
  const result=await c('Runtime.evaluate',{expression:`(${inspectPage.toString()})()`,returnByValue:true});
  const entry=await c('Runtime.evaluate',{expression:`(()=>{const a=document.querySelector('main a[href="/futterautomat-berater/"]');const r=a?.getBoundingClientRect();return {text:a?.textContent,href:a?.getAttribute('href'),visible:!!a&&a.getClientRects().length>0,insideMain:!!a?.closest('main'),inNavigation:!!a?.closest('nav,footer'),width:r?.width,bodyColor:getComputedStyle(document.body).color,bodyBackground:getComputedStyle(document.body).backgroundColor,paragraph:a?.parentElement.textContent};})()`,returnByValue:true});
  const findings=findingsFor(route,viewport,result.result.value);if(!entry.result.value.visible||entry.result.value.inNavigation)findings.push({code:'ADVISOR_ENTRY_NOT_CONTEXTUAL'});
  let screenshot=null;if(width===375||width===1600){await c('Runtime.evaluate',{expression:'scrollTo(0,0)'});const layout=await c('Page.getLayoutMetrics');const shot=await c('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.ceil(layout.cssContentSize.height),scale:1}});screenshot=`screenshots/hub-${width}-${theme}.png`;fs.writeFileSync(path.join(out,screenshot),Buffer.from(shot.data,'base64'));}
  closureVisual.push({route,viewport,theme,metrics:result.result.value,entry:entry.result.value,findings,screenshot});console.log('Closure visual',width,theme,findings.length);
 }
 fs.writeFileSync(path.join(out,'closure-visual-qa.json'),JSON.stringify({generatedAt:new Date().toISOString(),results:closureVisual,screenshots:closureVisual.filter(r=>r.screenshot).map(r=>r.screenshot),passed:closureVisual.every(r=>!r.findings.length)},null,2)+'\n');
}
const version=await call('Browser.getVersion');const report={generatedAt:new Date().toISOString(),engine:version.product,reuses:'scripts/performance/viewport-smoke.cjs: inspectPage, findingsFor, routes, viewports',results,summary:{checks:results.length,passed:results.filter(r=>!r.findings.length).length,failed:results.filter(r=>r.findings.length).length}};fs.writeFileSync(path.join(out,'browser-geometry.json'),JSON.stringify(report,null,2)+'\n');console.log(report.summary);
}finally{ws?.close();chrome.kill();server.close();}

// Build with PFOTENTECHNIK_DRAFT_PREVIEW=1 and --outDir first. Never follows purchase links.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const app=fileURLToPath(new URL('../../',import.meta.url));
const dist=path.resolve(process.argv.find(a=>a.startsWith('--dist='))?.slice(7)??path.join(app,'dist'));
const output=path.resolve(app,process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'reports/product-integration-35.8');
const draftDist=process.argv.find(a=>a.startsWith('--draft-dist='))?.slice(13);
const manifest=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/manifest.json')));
const slugs=process.argv.find(a=>a.startsWith('--slugs='))?.slice(8).split(',')??[...manifest.candidateSlugs,'tractive-dog-6','invoxia-biotracker-2026'];
const chromePath=process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;let file=path.resolve(dist,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/')?'index.html':''));if(!fs.existsSync(file)&&draftDist&&(/^\/admin\/seo\/products\/[^/]+\/preview\/$/.test(pathname)||pathname.startsWith('/_astro/'))){const fallback=path.resolve(draftDist,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/')?'index.html':''));if(fallback.startsWith(path.resolve(draftDist)+path.sep))file=fallback;}if((!file.startsWith(dist+path.sep)&&!(draftDist&&file.startsWith(path.resolve(draftDist)+path.sep)))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');fs.createReadStream(file).pipe(res);});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'pt358-chrome-'));const sleep=ms=>new Promise(r=>setTimeout(r,ms));let chrome,ws;
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const base=`http://127.0.0.1:${server.address().port}`;fs.mkdirSync(output,{recursive:true});
 chrome=spawn(chromePath,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
 let spawnError;chrome.on('error',e=>{spawnError=e});const portFile=path.join(profile,'DevToolsActivePort');
 for(let n=0;n<100&&!fs.existsSync(portFile)&&!spawnError;n++)await sleep(100);if(spawnError)throw spawnError;assert.ok(fs.existsSync(portFile),'Chrome debugging port missing');
 const port=fs.readFileSync(portFile,'utf8').split('\n')[0];const target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});let id=0;const pending=new Map();
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error(`Timed out: ${method}`))},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 await send('Page.enable');await send('Page.bringToFront');const results=[];
 for(const slug of slugs)for(const width of [375,1600])for(const theme of ['light','dark']){
  const draft=manifest.candidates.find(d=>d.slug===slug)?.publicationStatus==='draft';const route=draft?`/admin/seo/products/${slug}/preview/`:`/produkt/${slug}/`;
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme}]});await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});await send('Page.navigate',{url:base+route});
  let ready=false;for(let n=0;n<100;n++){if(await evaluate(`document.readyState==='complete'&&!!document.querySelector('.px2-price')&&!!document.querySelector('[data-product-gallery-v29]')?.dataset.pg29Ready`)){ready=true;break;}await sleep(100)}assert.ok(ready,slug+': page not ready');
  await evaluate(`(async()=>{document.documentElement.style.scrollBehavior='auto';document.querySelectorAll('img').forEach(i=>i.loading='eager');await document.fonts.ready;for(let y=0;y<document.documentElement.scrollHeight;y+=800){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}await Promise.all([...document.images].map(i=>i.getAttribute('src')?i.decode().catch(()=>{}):Promise.resolve()));window.scrollTo({top:0,behavior:'instant'});})()`);await sleep(150);
  const row=await evaluate(`(()=>({h1:document.querySelector('h1')?.textContent.trim(),canonical:document.querySelector('link[rel=canonical]')?.href,robots:document.querySelector('meta[name=robots]')?.content,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),brokenImages:[...document.images].filter(i=>i.getAttribute('src')&&(!i.complete||!i.naturalWidth)).map(i=>i.src),priceText:document.querySelector('.px2-price').innerText,ctas:[...document.querySelectorAll('.px2-price a.px2-price__cta')].map(a=>({href:a.href,rel:a.rel,text:a.innerText})),schema:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)),theme:document.documentElement.dataset.theme??getComputedStyle(document.documentElement).colorScheme}))()`);
  assert.equal(row.overflow,0,`${slug}/${width}: overflow`);assert.deepEqual(row.brokenImages,[],`${slug}: broken images`);assert.ok(row.ctas.length,slug+': CTA missing');assert.match(row.priceText,/\d+[,.]\d{2}\s*€/);if(draft)assert.match(row.robots,/noindex/);else assert.equal(row.canonical,`https://pfotentechnik.de/produkt/${slug}/`);
  await evaluate(`window.scrollTo({top:0,behavior:'instant'})`);await sleep(100);const layout=await send('Page.getLayoutMetrics');const height=Math.ceil(layout.cssContentSize.height);const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});const file=`${slug}-${width}-${theme}.png`;const buffer=Buffer.from(shot.data,'base64');fs.writeFileSync(path.join(output,file),buffer);
  await evaluate(`document.querySelector('${width<500?'.pg29__mobile':'.pg29__desktop'} [data-pg29-open]').click()`);assert.equal(await evaluate(`document.querySelector('[data-pg29-dialog]').open`),true,slug+': gallery open');
  const before=await evaluate(`document.querySelector('[data-pg29-counter]').textContent`);await evaluate(`document.querySelector('[data-pg29-next]').click()`);assert.notEqual(await evaluate(`document.querySelector('[data-pg29-counter]').textContent`),before,slug+': gallery next');await evaluate(`document.querySelector('[data-pg29-close]').click()`);assert.equal(await evaluate(`document.querySelector('[data-pg29-dialog]').open`),false);
  results.push({slug,width,theme,route,draft,...row,gallery:'open-next-close passed',screenshot:{file,height,sha256:createHash('sha256').update(buffer).digest('hex')}});console.log(`${slug} ${width} ${theme}: passed`);
 }
 fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify({browser:'Chrome headless',formats:[375,1600],themes:['light','dark'],results},null,2)+'\n');
}finally{ws?.close();if(chrome&&chrome.exitCode===null){chrome.kill('SIGTERM');await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(2000)])}await new Promise(resolve=>server.close(resolve));fs.rmSync(profile,{recursive:true,force:true});}

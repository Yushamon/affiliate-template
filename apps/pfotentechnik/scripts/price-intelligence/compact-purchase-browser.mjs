// After `npm run build`: CHROME_PATH=/path/to/chrome node scripts/price-intelligence/compact-purchase-browser.mjs
// Serves dist locally, checks real CTA hit targets without visiting affiliate destinations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const app=fileURLToPath(new URL('../../',import.meta.url));
const dist=path.join(app,'dist');
const output=path.join(app,'reports/compact-product-purchase');
const baseline=process.argv.includes('--baseline');
const baseArgument=process.argv.find(a=>a.startsWith('--base-url='))?.slice(11);
const chromePath=process.env.CHROME_PATH ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
assert.ok(chromePath,'Set CHROME_PATH to a Chrome/Chromium executable');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(dist,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');fs.createReadStream(file).pipe(res);
});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'pt-compact-chrome-'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let chrome,ws;
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const base=baseArgument??`http://127.0.0.1:${server.address().port}`;
  fs.mkdirSync(output,{recursive:true});
  chrome=spawn(chromePath,['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
  let spawnError;chrome.on('error',error=>{spawnError=error;});
  const portFile=path.join(profile,'DevToolsActivePort');
  for(let n=0;n<100&&!fs.existsSync(portFile)&&!spawnError;n++)await sleep(100);
  if(spawnError)throw spawnError;
  assert.ok(fs.existsSync(portFile),'Chrome debugging port did not start');
  const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
  const target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  let id=0;const pending=new Map();
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(Error(`Timed out: ${method}`));},15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  await send('Page.enable');
  const results=[];
  for(const slug of ['petkit-yumshare-dual-hopper','petlibro-polar-wet-food-feeder','tractive-cat-6-mini']){
    for(const width of [360,375,390,430,1440]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
      await send('Page.navigate',{url:`${base}/produkt/${slug}/`});
      let ready=false;for(let n=0;n<80;n++){if(await evaluate(`document.readyState==='complete' && !!document.querySelector('.px2-price .px2-price__cta')`)){ready=true;break;}await sleep(100);}
      assert.ok(ready,`${slug}: purchase UI did not load`);
      await evaluate(`document.documentElement.style.scrollBehavior='auto'; window.scrollTo({top:window.scrollY+document.querySelector('.px2-price').getBoundingClientRect().top-90,behavior:'instant'});`);
      await sleep(250);
      const data=await evaluate(`(()=>{
        const box=document.querySelector('.px2-price');const rect=box.getBoundingClientRect();
        return {boxHeight:rect.height,boxWidth:rect.width,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),availability:box.dataset.availability,unknownBox:!!box.querySelector('.px2-availability.is-unknown'),text:box.innerText,
          ctas:[...box.querySelectorAll('a.px2-price__cta')].map(a=>{const r=a.getBoundingClientRect();return {href:a.href,label:a.textContent.trim(),merchant:a.dataset.merchant,rel:a.rel,width:r.width,height:r.height,overflow:a.scrollWidth>a.clientWidth+1};}),
          noteCount:(box.innerText.match(/Preis und Verfügbarkeit beim Händler prüfen/g)||[]).length};})()`);
      // Scroll every CTA into view before checking it, including lower merchant options.
      for(let i=0;i<data.ctas.length;i++){
        await evaluate(`document.querySelectorAll('.px2-price a.px2-price__cta')[${i}].scrollIntoView({behavior:'instant',block:'center'});`);await sleep(100);
        data.ctas[i].hit=await evaluate(`(()=>{const a=document.querySelectorAll('.px2-price a.px2-price__cta')[${i}];const r=a.getBoundingClientRect();return a.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()`);
      }
      await evaluate(`window.scrollTo({top:window.scrollY+document.querySelector('.px2-price').getBoundingClientRect().top-90,behavior:'instant'});`);await sleep(100);
      if(width===375){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,`${baseline?'before':'after'}-${slug}-375.png`),Buffer.from(shot.data,'base64'));}
      const row={slug,viewport:width,...data};results.push(row);
      if(!baseline){
        assert.equal(row.overflow,0,`${slug} ${width}: horizontal overflow`);
        assert.equal(row.unknownBox,false);assert.equal(row.noteCount,1);
        assert.ok(row.ctas.length>0);
        for(const cta of row.ctas){assert.ok(cta.width>0&&cta.height>=44&&!cta.overflow&&cta.hit,JSON.stringify(row));assert.match(cta.rel,/sponsored/);}
        if(slug==='petkit-yumshare-dual-hopper'){assert.equal(row.ctas[0].href,'https://amzn.to/3TQJw1G');assert.equal(row.ctas[0].label,'Bei Amazon ansehen');assert.match(row.text,/Optionales Abo möglich/);}
        if(slug==='petlibro-polar-wet-food-feeder'){assert.equal(row.ctas.length,2);assert.ok(row.ctas.some(cta=>new URL(cta.href).hostname.endsWith('awin1.com')));}
        if(slug==='tractive-cat-6-mini')assert.match(row.text,/Abo erforderlich|Abo oder Prepaid-Service erforderlich/);
      }
    }
  }
  fs.writeFileSync(path.join(output,baseline?'browser-before.json':'browser.json'),JSON.stringify({browser:'Chrome headless',base,results},null,2)+'\n');
  console.log(JSON.stringify(results.map(({text,...row})=>row),null,2));
}finally{
  ws?.close();if(chrome&&chrome.exitCode===null){chrome.kill('SIGTERM');await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(2000)]);}
  await new Promise(resolve=>server.close(resolve));fs.rmSync(profile,{recursive:true,force:true});
}

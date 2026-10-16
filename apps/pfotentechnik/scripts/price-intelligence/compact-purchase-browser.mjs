// After `npm run build`: CHROME_PATH=/path/to/chrome node scripts/price-intelligence/compact-purchase-browser.mjs
// Serves dist locally, checks real CTA hit targets without visiting affiliate destinations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const app=fileURLToPath(new URL('../../',import.meta.url));
const dist=path.join(app,'dist');
const redesign=process.argv.includes('--redesign');
const output=path.join(app,redesign?'reports/product-ux-redesign':'reports/compact-product-purchase');
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
  await send('Page.enable');await send('Page.bringToFront');await send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__uxCLS=0;try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__uxCLS+=e.value;}).observe({type:'layout-shift',buffered:true});}catch{}`});
  const results=[];
  const slugs=redesign?['xiaomi-smart-pet-food-feeder-2','petkit-yumshare-dual-hopper','surefeed-microchip-pet-feeder-connect','petlibro-polar-wet-food-feeder','petlibro-granary-2-vision','tractive-cat-6-mini','petlibro-luma-smart-litter-box','cat-mate-shell-fountain']:['petkit-yumshare-dual-hopper','petlibro-polar-wet-food-feeder','tractive-cat-6-mini'];
  const modes=redesign?['light','dark']:['dark'];
  for(const slug of slugs){
    for(const theme of modes){
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme}]});
    for(const width of redesign?[360,390,430,1440]:[360,375,390,430,1440]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
      await send('Page.navigate',{url:`${base}/produkt/${slug}/`});
      let ready=false;for(let n=0;n<80;n++){if(await evaluate(`document.readyState==='complete' && !!document.querySelector('.px2-price')`)){ready=true;break;}await sleep(100);}
      assert.ok(ready,`${slug}: purchase UI did not load`);
      await evaluate(`document.documentElement.style.scrollBehavior='auto'; window.scrollTo({top:window.scrollY+document.querySelector('.px2-price').getBoundingClientRect().top-90,behavior:'instant'});`);
      await sleep(250);
      const data=await evaluate(`(()=>{
        const box=document.querySelector('.px2-price');const rect=box.getBoundingClientRect();
        const hero=document.querySelector('.px2-hero');const image=hero.querySelector(innerWidth<760?'.pg29__mobile img':'.pg29__desktop img');
        const position=s=>{const el=hero.querySelector(s);return el?Math.round(el.getBoundingClientRect().top+scrollY):null;};
        const imageRect=image?.getBoundingClientRect();
        const details=box.querySelector('details');
        const summary=details?.querySelector('summary');
        return {heroHeight:hero.getBoundingClientRect().height,title:hero.querySelector('h1').textContent,score:hero.querySelector('.pt-score')?.getAttribute('aria-label'),canonical:document.querySelector('link[rel=canonical]')?.href,robots:document.querySelector('meta[name=robots]')?.content,schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent)),
          positions:{image:position('.px2-hero__media'),title:position('h1'),lead:position('.px2-hero__lead'),score:position('.px2-hero__scoreline'),chips:position('.px2-hero__suitability'),purchase:position('.px2-price'),compare:position('.px2-hero__compare')},chips:hero.querySelectorAll('.px2-hero__suitability li').length,
          image:{loaded:!!image?.complete&&image.naturalWidth>0,width:image?.width,height:image?.height,displayWidth:imageRect?.width,displayHeight:imageRect?.height,priority:image?.fetchPriority,loading:image?.loading},cls:window.__uxCLS??0,theme:document.documentElement.dataset.theme??getComputedStyle(document.documentElement).colorScheme,
          boxHeight:rect.height,boxWidth:rect.width,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),availability:box.dataset.availability,unknownBox:!!box.querySelector('.px2-availability.is-unknown'),text:box.innerText,
          ctas:[...box.querySelectorAll('a.px2-price__cta')].map(a=>{const r=a.getBoundingClientRect();const node=[...a.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());const range=document.createRange();if(node)range.selectNodeContents(node);const textLines=node?[...range.getClientRects()].filter(r=>r.width>1).length:0;return {textLines,href:a.href,label:a.textContent.replace(/→/g,'').trim(),color:getComputedStyle(a).color,background:getComputedStyle(a).backgroundColor,merchant:a.dataset.merchant,rel:a.rel,width:r.width,height:r.height,overflow:a.scrollWidth>a.clientWidth+1};}),
          noteCount:(box.innerText.match(/Preis und Verfügbarkeit beim Händler prüfen/g)||[]).length};})()`);
      // Scroll every CTA into view before checking it, including lower merchant options.
      for(let i=0;i<data.ctas.length;i++){
        await evaluate(`document.querySelectorAll('.px2-price a.px2-price__cta')[${i}].scrollIntoView({behavior:'instant',block:'center'});`);await sleep(100);
        data.ctas[i].hit=await evaluate(`(()=>{const a=document.querySelectorAll('.px2-price a.px2-price__cta')[${i}];const r=a.getBoundingClientRect();return a.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()`);
      }
      await evaluate(`window.scrollTo({top:window.scrollY+document.querySelector('.px2-price').getBoundingClientRect().top-90,behavior:'instant'});`);await sleep(100);
      if(width===375){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,`${baseline?'before':'after'}-${slug}-375.png`),Buffer.from(shot.data,'base64'));}
      if(redesign&&width===390&&['xiaomi-smart-pet-food-feeder-2','petkit-yumshare-dual-hopper'].includes(slug)){
        await evaluate(`window.scrollTo({top:0,behavior:'instant'});`);await sleep(150);
        const height=await evaluate(`Math.min(2200,Math.ceil(document.querySelector('.px2-hero').getBoundingClientRect().bottom+scrollY))`);
        const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});
        fs.writeFileSync(path.join(output,`${baseline?'before':'after'}-${slug}-${theme}-390.png`),Buffer.from(shot.data,'base64'));
      }
      if(redesign&&!baseline&&width===390){
        const press=async(key,code,n)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:n,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:n});};
        const hasDetails=await evaluate(`!!document.querySelector('.px2-price details summary')`);
        if(hasDetails){
          await evaluate(`document.querySelector('.px2-price details summary').focus()`);await press('Enter','Enter',13);
          assert.equal(await evaluate(`document.querySelector('.px2-price details').open`),true);
          await press('Enter','Enter',13);assert.equal(await evaluate(`document.querySelector('.px2-price details').open`),false);
        }
        if(slug==='xiaomi-smart-pet-food-feeder-2'){
          await evaluate(`document.querySelector('.pg29__mobile [data-pg29-open]').focus()`);await press('Enter','Enter',13);await sleep(100);
          assert.equal(await evaluate(`document.querySelector('[data-pg29-dialog]').open`),true,await evaluate(`JSON.stringify({active:document.activeElement?.outerHTML.slice(0,200),ready:document.querySelector('[data-product-gallery-v29]').dataset.pg29Ready,focused:document.hasFocus()})`));
          await press('Escape','Escape',27);assert.equal(await evaluate(`document.querySelector('[data-pg29-dialog]').open`),false);
        }
        data.keyboard={subscriptionToggle:hasDetails?'passed':'not-applicable',gallery:slug==='xiaomi-smart-pet-food-feeder-2'?'passed':'not-tested'};
      }
      const luminance=color=>{const rgb=color.match(/[\d.]+/g)?.slice(0,3).map(Number);assert.ok(rgb?.length===3);const c=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
      for(const cta of data.ctas){const a=luminance(cta.color),b=luminance(cta.background);cta.contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
      const schemaImageHashes={};
      const visitImages=value=>{if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(visitImages);return;}for(const [key,item] of Object.entries(value)){if(key==='image')for(const url of Array.isArray(item)?item:[item])if(typeof url==='string'&&url.startsWith('https://pfotentechnik.de/_astro/')){const file=path.resolve(dist,'.'+new URL(url).pathname);assert.ok(file.startsWith(dist+path.sep)&&fs.existsSync(file),`Missing schema image: ${url}`);schemaImageHashes[url]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');}visitImages(item);}};
      visitImages(data.schemas);
      const row={slug,viewport:width,mode:theme,...data,schemaImageHashes};results.push(row);
      if(!baseline){
        assert.equal(row.overflow,0,`${slug} ${width}: horizontal overflow`);
        assert.equal(row.unknownBox,false);assert.equal(row.noteCount,row.ctas.length?1:0);
        if(!['petlibro-granary-2-vision','cat-mate-shell-fountain'].includes(slug))assert.ok(row.ctas.length>0);
        if(redesign){
          assert.ok(row.chips<=3);assert.ok(row.ctas.every(cta=>cta.textLines===1),`${slug} ${width}: wrapped CTA text`);assert.ok(row.ctas.every(cta=>cta.contrast>=4.5),`${slug} ${theme}: insufficient CTA contrast`);assert.ok(row.image.loaded&&row.image.displayHeight>0&&row.image.width>0&&row.image.height>0,`${slug}: missing or unsized image`);
          assert.ok(row.cls<=0.1,`${slug} ${width}: layout shifts ${row.cls}`);
          if(width<760){const p=row.positions;assert.ok(p.image<p.title&&p.title<p.lead&&p.lead<p.score&&p.score<p.chips&&p.chips<p.purchase&&p.purchase<p.compare,JSON.stringify(p));}
          const beforeFile=path.join(output,'browser-before.json');
          if(fs.existsSync(beforeFile)){const before=JSON.parse(fs.readFileSync(beforeFile)).results.find(r=>r.slug===slug&&r.viewport===width&&r.mode===theme);assert.ok(before);assert.equal(row.score,before.score);assert.equal(row.canonical,before.canonical);assert.equal(row.robots,before.robots);// Astro deduplicates identical images under build-dependent filenames.
            // Compare verified bytes for image URLs; compare every other schema field exactly.
            const normalized=(schemas,hashes)=>JSON.parse(JSON.stringify(schemas,(key,value)=>typeof value==='string'&&hashes?.[value]?`sha256:${hashes[value]}`:value));
            assert.deepEqual(normalized(row.schemas,row.schemaImageHashes),normalized(before.schemas,before.schemaImageHashes));assert.deepEqual(row.ctas.map(c=>c.href),before.ctas.map(c=>c.href));}
        }
        for(const cta of row.ctas){assert.ok(cta.width>0&&cta.height>=44&&!cta.overflow&&cta.hit,JSON.stringify(row));assert.match(cta.rel,/sponsored/);}
        if(slug==='petkit-yumshare-dual-hopper'){assert.equal(row.ctas[0].href,'https://amzn.to/3TQJw1G');assert.equal(row.ctas[0].label,'Bei Amazon ansehen');assert.match(row.text,/Optionales Abo möglich/);}
        if(slug==='petlibro-polar-wet-food-feeder'){assert.equal(row.ctas.length,2);assert.ok(row.ctas.some(cta=>new URL(cta.href).hostname.endsWith('awin1.com')));}
        if(slug==='tractive-cat-6-mini')assert.match(row.text,/Abo erforderlich|Abo oder Prepaid-Service erforderlich/);
      }
    }
    }
  }
  fs.writeFileSync(path.join(output,baseline?'browser-before.json':'browser.json'),JSON.stringify({browser:'Chrome headless',base,results},null,2)+'\n');
  console.log(JSON.stringify({cases:results.length,results:results.map(({text,schemas,...row})=>row)},null,2));
}finally{
  ws?.close();if(chrome&&chrome.exitCode===null){chrome.kill('SIGTERM');await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(2000)]);}
  await new Promise(resolve=>server.close(resolve));fs.rmSync(profile,{recursive:true,force:true});
}

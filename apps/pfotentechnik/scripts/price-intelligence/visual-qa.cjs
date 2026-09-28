// Run with the repository's Electron after a production build. No merchant calls or writes.
const {app,BrowserWindow,nativeTheme,session}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'../../../..');
const dist=path.join(root,'apps/pfotentechnik/dist');
const output=path.join(root,'reports/commerce-multi-merchant');
app.setPath('userData',path.join(root,'.patch-backups/commerce-multi-merchant/electron-profile'));
app.setPath('sessionData',path.join(root,'.patch-backups/commerce-multi-merchant/electron-profile'));
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('force-device-scale-factor','1');
const route='/produkt/petlibro-polar-wet-food-feeder/';
const report={generatedAt:new Date().toISOString(),browser:'Electron Chromium',checks:[],apiRequests:[],errors:[]};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const admin=fs.readFileSync(path.join(dist,'admin/seo/prices/index.html'),'utf8');
const records=JSON.parse(admin.match(/<script[^>]*data-ops-records[^>]*>([\s\S]*?)<\/script>/)[1]);
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
    res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    if(req.method==='OPTIONS'){res.end();return;}
    let body='';for await(const part of req)body+=part;
    const input=body?JSON.parse(body):{};
    report.apiRequests.push({path:url.pathname,input});
    const record=records.find(r=>r.slug===input.slug);
    let result={products:records};
    if(url.pathname.endsWith('/check-all'))result={succeeded:records.length,failed:0,skipped:0,results:records.map(record=>({ok:true,record,providerResults:[]}))};
    else if(req.method==='POST'){
      if(url.pathname.endsWith('/manual')){
        const offer=record.commerceOffers.find(o=>o.id===input.offerId);
        offer.price.current=Number(input.current);offer.current=Number(input.current);
        offer.formattedPrice=new Intl.NumberFormat('de-DE',{style:'currency',currency:input.currency}).format(offer.current);
        if(input.offerId==='legacy'){record.current=offer.current;record.formattedCurrent=offer.formattedPrice;}
      }
      result={ok:true,record,providerResults:[{id:'petlibro-de',ok:true}]};
    }
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));return;
  }
  const candidate=path.resolve(dist,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
  if(!candidate.startsWith(dist+path.sep)||!fs.existsSync(candidate)||!fs.statSync(candidate).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(candidate)]||'application/octet-stream');fs.createReadStream(candidate).pipe(res);
});
const inspect=()=>{
  const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  const ctas=[...document.querySelectorAll('.px2-offer .px2-price__cta')];
  const badCtas=ctas.filter(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.width<100||r.height<40||r.left<p.left-1||r.right>p.right+1||e.scrollWidth>e.clientWidth+1;}).length;
  const cards=[...document.querySelectorAll('.px2-offer')].map(e=>e.getBoundingClientRect());
  const overlaps=cards.some((a,i)=>cards.some((b,j)=>i<j&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
  const badPrices=[...document.querySelectorAll('.px2-offer__heading')].filter(e=>e.scrollWidth>e.clientWidth+1).length;
  return {width:innerWidth,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),badCtas,badPrices,overlaps,ctas:ctas.length,
    brokenImages:[...document.images].filter(e=>visible(e)&&e.complete&&e.naturalWidth===0&&!e.hasAttribute('data-lightbox-image')).length,
    sponsored:ctas.every(e=>e.rel.includes('sponsored')&&e.rel.includes('nofollow')),
    canonical:document.querySelector('link[rel="canonical"]')?.href,
    offers:[...document.querySelectorAll('.px2-offer')].map(e=>e.innerText)};
};
app.whenReady().then(async()=>{
  console.log('Browser ready');
  fs.mkdirSync(output,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://127.0.0.1:4178/*']},(d,cb)=>cb({redirectURL:base+new URL(d.url).pathname}));
  const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
  win.webContents.on('console-message',event=>{if(event.level==='error'&&!event.message.includes('ERR_CONNECTION_REFUSED'))report.errors.push(event.message);});
  win.webContents.debugger.attach('1.3');
  const js=async source=>{
    const result=await Promise.race([win.webContents.debugger.sendCommand('Runtime.evaluate',{expression:source,awaitPromise:true,returnByValue:true}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('Browser evaluation timed out')),20000);timer.unref();})]);
    if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const settle=()=>new Promise(resolve=>setTimeout(resolve,350));
  for(const theme of ['light','dark']){
    nativeTheme.themeSource=theme;
    for(const width of [375,1600,320,390,768,1024,1280]){
      console.log('Inspect',theme,width);
      win.setContentSize(width,900);await win.loadURL(base+route);console.log('Loaded');await settle();
      // Load the entire page's original lazy images before the one full-page capture.
      await js(`Promise.race([Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});})),new Promise(resolve=>setTimeout(resolve,10000))]).then(()=>true);`);
      const result=await js('('+inspect.toString()+')()');report.checks.push({kind:'public',theme,...result});console.log('Inspected',result.width);
      if([375,1600].includes(width)){
        if(!win.webContents.debugger.isAttached())win.webContents.debugger.attach('1.3');
        const metrics=await win.webContents.debugger.sendCommand('Page.getLayoutMetrics');
        const image=await win.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.ceil(metrics.cssContentSize.height),scale:1}});
        fs.writeFileSync(path.join(output,`product-${width}-${theme}.png`),Buffer.from(image.data,'base64'));
      }
    }
  }
  for(const width of [375,768,1600]){
    win.setContentSize(width,900);await win.loadURL(base+'/admin/seo/prices/');await settle();
    await js(`document.querySelector('[data-view="all"]').click();var s=document.querySelector('[data-search]');s.value='petlibro-dockstream-2-smart-cordless';s.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-product-row="petlibro-dockstream-2-smart-cordless"] details').open=true;`);
    const geometry=await js(`({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),visible:[...document.querySelectorAll('[data-product-row]')].filter(e=>!e.hidden).length,priceEditors:document.querySelectorAll('[data-product-row]:not([hidden]) [data-commerce-price-editor]').length,fields:[...document.querySelectorAll('[data-product-row]:not([hidden]) [data-commerce-price-editor] input')].every(e=>e.getBoundingClientRect().right<=innerWidth+1)})`);
    report.checks.push({kind:'cockpit',width,...geometry});
  }
  await js(`document.querySelector('[data-check-price="petlibro-dockstream-2-smart-cordless"]').click()`);await settle();
  await js(`var form=document.querySelector('[data-product-row="petlibro-dockstream-2-smart-cordless"] [data-offer-editor]');form.querySelector('[name="expectedSku"]').value='QA-DRAFT';form.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-check-all]').click();`);await settle();
  report.draftPreserved=await js(`document.querySelector('[data-product-row="petlibro-dockstream-2-smart-cordless"] [name="expectedSku"]').value==='QA-DRAFT'`);
  await js(`document.querySelector('[data-product-row="petlibro-dockstream-2-smart-cordless"] [data-offer-editor]').requestSubmit()`);await settle();
  await js(`var forms=[...document.querySelectorAll('[data-product-row="petlibro-dockstream-2-smart-cordless"] [data-commerce-price-editor]')];forms.forEach((f,i)=>{var input=f.querySelector('[name="current"]');input.value=i?'88.88':'99.99';input.dispatchEvent(new Event('input',{bubbles:true}));});forms[0].requestSubmit();`);await settle();
  report.otherPriceDraftPreserved=await js(`document.querySelector('[data-product-row="petlibro-dockstream-2-smart-cordless"] [data-commerce-price-editor][data-id="petlibro-de"] [name="current"]').value==='88.88'`);
  await js(`document.querySelector('[data-product-row="petlibro-dockstream-2-smart-cordless"] [data-commerce-price-editor][data-id="petlibro-de"]').requestSubmit()`);await settle();
  report.twoPricesSaved=report.apiRequests.filter(r=>r.path.endsWith('/manual')).map(r=>({offerId:r.input.offerId,current:r.input.current}));
  report.note='Cockpit writes/refresh responses use an isolated in-memory API fixture. Real refresh/persistence are covered by service integration tests and the verified merchant fetch; QA does not change product data.';
  report.passed=report.checks.every(c=>!c.overflow&&!c.badCtas&&!c.badPrices&&!c.overlaps&&!c.brokenImages&&c.fields!==false&&(c.kind!=='cockpit'||c.priceEditors===2))&&report.draftPreserved&&report.otherPriceDraftPreserved&&report.twoPricesSaved.length===2&&['/check','/check-all','/offer'].every(suffix=>report.apiRequests.some(r=>r.path.endsWith(suffix)));
  fs.writeFileSync(path.join(output,'visual-qa.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors},null,2));
  win.destroy();server.close();app.exit(report.passed?0:1);
}).catch(e=>{console.error(e);server.close();app.exit(1);});

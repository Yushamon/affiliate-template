import fs from "node:fs/promises";

async function sharpLib(){try{return(await import("sharp")).default}catch{throw new Error('Das Paket "sharp" fehlt. Führe im Repository zuerst npm install aus.')}}
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const distance=(a,b)=>Math.sqrt(a.reduce((sum,value,index)=>sum+(value-b[index])**2,0));

async function visualMetrics(sharp,file){
  const image=sharp(file,{failOn:"none"}).rotate(); const metadata=await image.metadata();
  const {data,info}=await image.clone().resize(32,32,{fit:"fill"}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const pixel=(x,y)=>{const offset=(y*info.width+x)*info.channels;return [data[offset],data[offset+1],data[offset+2]]};
  const corners=[pixel(0,0),pixel(31,0),pixel(0,31),pixel(31,31)];const background=corners[0].map((_,channel)=>corners.reduce((sum,p)=>sum+p[channel],0)/corners.length);
  let foreground=0;let centerContrast=0;let centerCount=0;
  for(let y=0;y<32;y+=1)for(let x=0;x<32;x+=1){const current=pixel(x,y);if(distance(current,background)>35)foreground+=1;if(x>=8&&x<24&&y>=8&&y<24){centerContrast+=distance(current,background);centerCount+=1}}
  const neutral=Math.max(...background)-Math.min(...background)<18 && background.reduce((sum,v)=>sum+v,0)/3>185;
  return {width:metadata.width||0,height:metadata.height||0,format:metadata.format||"unknown",foregroundRatio:foreground/1024,centerContrast:centerCount?centerContrast/centerCount:0,neutralBackground:neutral};
}

export async function evaluateImage(file,candidate={}){
  const sharp=await sharpLib(); const stats=await fs.stat(file); const metrics=await visualMetrics(sharp,file);const reasons=[];
  const area=metrics.width*metrics.height;const ratio=metrics.width&&metrics.height?metrics.width/metrics.height:0;let score=0;
  if(area>=1_000_000)score+=30;else if(area>=500_000)score+=23;else if(area>=250_000)score+=14;else reasons.push("Auflösung zu niedrig");
  if(metrics.width>=700&&metrics.height>=500)score+=12;else reasons.push("Zu kleine Kantenlänge");
  if(ratio>=.55&&ratio<=1.9)score+=12;else if(ratio>.25&&ratio<3.2)score+=4;else reasons.push("Banner- oder Extremformat");
  if(metrics.foregroundRatio>=.08&&metrics.foregroundRatio<=.82)score+=18;else reasons.push(metrics.foregroundRatio<.08?"Produkt wahrscheinlich zu klein sichtbar":"Bildfläche sehr unruhig oder randlos");
  if(metrics.centerContrast>=22)score+=12;else reasons.push("Produkt im Zentrum nicht klar erkennbar");
  if(metrics.neutralBackground)score+=8;
  if(["product","detail","lifestyle","size"].includes(candidate.kind))score+=8;
  if(stats.size<18_000){score-=20;reasons.push("Datei zu klein")}
  const accepted=score>=55&&area>=250_000&&ratio>.25&&ratio<3.2;
  return {...metrics,bytes:stats.size,score:clamp(Math.round(score),0,100),accepted,reasons,kind:candidate.kind||"product"};
}

export async function duplicateHash(file){const sharp=await sharpLib();const {data}=await sharp(file,{failOn:"none"}).rotate().resize(9,8,{fit:"fill"}).greyscale().raw().toBuffer({resolveWithObject:true});let bits="";for(let y=0;y<8;y+=1)for(let x=0;x<8;x+=1)bits+=data[y*9+x]>data[y*9+x+1]?"1":"0";return BigInt(`0b${bits}`)}
const hamming=(a,b)=>{let value=a^b,count=0;while(value){count+=Number(value&1n);value>>=1n}return count};
export const similarity=(a,b)=>Math.round((1-hamming(a,b)/64)*100);
export async function normalizeWebp(source,destination,{width,height,quality=84}){const sharp=await sharpLib();await sharp(source,{failOn:"none"}).rotate().resize({width,height,fit:"contain",background:{r:250,g:250,b:248,alpha:1},withoutEnlargement:false}).webp({quality,effort:5}).toFile(destination)}
export async function assertImage(file){const sharp=await sharpLib();const metadata=await sharp(file,{failOn:"error"}).metadata();if(!metadata.width||!metadata.height)throw new Error("Die hochgeladene Datei ist kein lesbares Bild.");return metadata}

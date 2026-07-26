import fs from "node:fs/promises";
import path from "node:path";
import { CONFIG } from "./config.mjs";
import { IMG, sourceBucket, walk } from "./lib.mjs";
export async function sharpLib(){try{return(await import("sharp")).default}catch{throw new Error('Paket "sharp" fehlt. Bitte npm install ausführen.')}}
async function dHash(sharp,file){
 const {data}=await sharp(file,{failOn:"none"}).rotate().resize(9,8,{fit:"fill"}).greyscale().raw().toBuffer({resolveWithObject:true});
 let bits="";for(let y=0;y<8;y++)for(let x=0;x<8;x++)bits+=data[y*9+x]>data[y*9+x+1]?"1":"0";return BigInt("0b"+bits);
}
function hamming(a,b){let x=a^b,n=0;while(x){n+=Number(x&1n);x>>=1n}return n}
export function similarity(a,b){return Math.round((1-hamming(a,b)/64)*100)}
export async function analyzeSources(sourceDir){
 const sharp=await sharpLib(), files=(await walk(sourceDir)).filter(f=>IMG.has(path.extname(f).toLowerCase())), out=[];
 for(const file of files)try{
  const m=await sharp(file,{failOn:"none"}).metadata(), s=await fs.stat(file), bucket=sourceBucket(file);
  out.push({file,bucket,width:m.width||0,height:m.height||0,area:(m.width||0)*(m.height||0),bytes:s.size,hash:await dHash(sharp,file),score:(CONFIG.sourceWeights[bucket]||50)+Math.min(10,Math.log10(Math.max(1,(m.width||0)*(m.height||0))))});
 }catch{}
 out.sort((a,b)=>b.score-a.score||b.area-a.area);return {sharp,sources:out};
}
export function duplicateGroups(sources,threshold=96){
 const groups=[],used=new Set();
 for(let i=0;i<sources.length;i++){if(used.has(i))continue;const g=[i];for(let j=i+1;j<sources.length;j++)if(similarity(sources[i].hash,sources[j].hash)>=threshold){g.push(j);used.add(j)}if(g.length>1)groups.push(g.map(x=>sources[x].file))}
 return groups;
}

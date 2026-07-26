const BLOCKED = [
  ["amazon-fresh",/amazon\s*fresh|fresh\s+lieferung/i],
  ["prime-video",/prime\s*video|amazon\s*video/i],
  ["audible",/audible|hoerbuch|hörbuch/i],
  ["kindle",/kindle|e-?book/i],
  ["amazon-music",/amazon\s*music|music\s*unlimited/i],
  ["advertising",/\bwerbung\b|advertis(e|ing|ement)|sponsored|gesponsert|promotion/i],
  ["logo",/\blogo\b|brandmark|wordmark/i],
  ["banner",/\bbanner\b|billboard|leaderboard|hero-?ad/i],
  ["ui-asset",/sprite|icon|badge|pixel|avatar|favicon|loading|placeholder/i]
];
const ALLOWED_HINTS = [
  ["size",/dimension|dimensions|size|größe|groesse|maße|masse|cm\b|mm\b/i],
  ["lifestyle",/lifestyle|home|kitchen|wohnung|alltag|cat|dog|katze|hund|pet/i],
  ["detail",/detail|feature|close|control|display|filter|bowl|napf|hopper|tank|camera|kamera/i],
  ["product",/product|main|hero|front|side|angle|model/i]
];
const normalizeUrl = (value,base) => { try { const url=new URL(String(value).replaceAll("&amp;","&"),base); if(!["https:"].includes(url.protocol))return null; url.hash=""; return url.href; } catch { return null; } };

export function classifyCandidate(candidate){
  const text=[candidate.url,candidate.alt,candidate.title,candidate.context,candidate.className,candidate.id].filter(Boolean).join(" ");
  for(const [reason,pattern] of BLOCKED)if(pattern.test(text))return {accepted:false,reason,kind:"rejected"};
  const kind=ALLOWED_HINTS.find(([,pattern])=>pattern.test(text))?.[0]||"product";
  return {accepted:true,reason:"candidate",kind};
}

export function extractImageCandidates(html,baseUrl){
  const candidates=[]; const add=(url,meta={})=>{const normalized=normalizeUrl(url,baseUrl);if(!normalized)return;const candidate={url:normalized,alt:"",title:"",context:"",className:"",id:"",...meta};const filter=classifyCandidate(candidate);candidates.push({...candidate,...filter})};
  const meta=(key)=>{const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");for(const re of [new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,"i"),new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,"i")]){const match=html.match(re);if(match)return match[1]}return""};
  for(const key of ["og:image","og:image:secure_url","twitter:image"])if(meta(key))add(meta(key),{context:key});
  for(const match of html.matchAll(/<img\b([^>]+)>/gi)){
    const attrs=match[1]; const attr=(name)=>attrs.match(new RegExp(`(?:^|\\s)${name}=["']([^"']+)["']`,"i"))?.[1]||"";
    const context=html.slice(Math.max(0,match.index-220),Math.min(html.length,(match.index||0)+match[0].length+220)).replace(/<[^>]+>/g," ").replace(/\s+/g," ");
    const metaData={alt:attr("alt"),title:attr("title"),className:attr("class"),id:attr("id"),context};
    for(const name of ["data-old-hires","data-a-dynamic-image","data-src","data-lazy-src","src"]){const value=attr(name);if(!value)continue;if(name==="data-a-dynamic-image"){try{for(const url of Object.keys(JSON.parse(value.replaceAll("&quot;",'"'))))add(url,metaData)}catch{}}else add(value,metaData)}
    const srcset=attr("srcset");if(srcset)for(const part of srcset.split(","))add(part.trim().split(/\s+/)[0],metaData);
  }
  for(const match of html.matchAll(/["'](?:hiRes|large|mainUrl|imageUrl)["']\s*:\s*["'](https?:\\?\/\\?\/[^"']+)["']/gi))add(match[1].replaceAll("\\/","/"),{context:"embedded-gallery"});
  const seen=new Set();return candidates.filter((item)=>{if(seen.has(item.url))return false;seen.add(item.url);return true});
}

export const blockedReasonLabel = (reason) => ({"amazon-fresh":"Amazon Fresh","prime-video":"Prime Video","audible":"Audible","kindle":"Kindle","amazon-music":"Amazon Music",advertising:"Werbung oder Sponsoring",logo:"Logo ohne ausreichenden Produktkontext",banner:"Bannerformat","ui-asset":"UI-Asset"}[reason]||reason);

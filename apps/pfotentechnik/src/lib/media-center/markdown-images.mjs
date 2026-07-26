import fs from "node:fs/promises";
import yaml from "js-yaml";
import { splitFrontmatter } from "../price-intelligence/frontmatter-price.mjs";
import { atomicWriteFile } from "../admin/atomic-file.mjs";
const q=(value)=>JSON.stringify(String(value));
function replace(frontmatter,block){const lines=frontmatter.split(/\r?\n/);const start=lines.findIndex((line)=>/^images:\s*(?:#.*)?$/.test(line));if(start<0)throw new Error("Produktdatei besitzt keinen images-Block.");let end=start+1;while(end<lines.length&&(/^\s+/.test(lines[end])||!lines[end].trim()))end+=1;lines.splice(start,end-start,...block.split("\n"));return lines.join("\n")}
export async function updateProductImages(file,{slug,title,variants}){
  const source=await fs.readFile(file,"utf8");const parts=splitFrontmatter(source,file);const base=`../../assets/images/products/${slug}`;
  const alt=(suffix)=>`${title} ${suffix}`.trim();
  const block=["images:","  hero:",`    src: ${base}/hero.webp`,`    alt: ${q(alt("in der Hauptansicht"))}`,"  thumbnail:",`    src: ${base}/thumbnail.webp`,`    alt: ${q(alt("als kompakte Produktansicht"))}`,"  comparison:",`    src: ${base}/comparison.webp`,`    alt: ${q(alt("für den Produktvergleich"))}`,"  gallery:",...(["gallery-1","gallery-2","gallery-3"].filter((name)=>variants[name]).flatMap((name,index)=>[`    - src: ${base}/${name}.webp`,`      alt: ${q(alt(`– Detailansicht ${index+1}`))}`]))].join("\n");
  const nextYaml=replace(parts.yaml,block);yaml.load(nextYaml);const next=`---\n${nextYaml.replace(/\s+$/,"")}\n---\n${parts.body}`;await atomicWriteFile(file,next,"utf8");return next;
}

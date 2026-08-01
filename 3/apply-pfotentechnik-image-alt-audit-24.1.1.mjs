#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function findRoot(start){
 let dir=path.resolve(start);
 for(let i=0;i<12;i++){
   if(fs.existsSync(path.join(dir,"apps","pfotentechnik","package.json"))) return dir;
   const p=path.dirname(dir); if(p===dir) break; dir=p;
 }
 throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT=findRoot(process.cwd());
const file=path.join(ROOT,"apps","pfotentechnik","scripts","seo","audit-image-alt-text.mjs");
let src=fs.readFileSync(file,"utf8");

src=src.replace(
'const bare = /\\\\balt\\\\s*=\\\\s*[^\\\\s>]+/i.test(tag);',
`const bareWithValue = /\\\\balt\\\\s*=\\\\s*[^\\\\s>]+/i.test(tag);
  const minimizedEmptyAlt = /\\\\balt(?=\\\\s|\\\\/?\\>)/i.test(tag);`
);

src=src.replace(
'if (!literalDouble && !literalSingle && !bare) {',
`if (
    !literalDouble &&
    !literalSingle &&
    !dynamic &&
    !bareWithValue &&
    !minimizedEmptyAlt
  ) {`
);

const marker='const literalValue = literalDouble?.[1] ?? literalSingle?.[1];';
if(src.includes(marker) && !src.includes('Minimierter leerer Alt-Text')){
src=src.replace(marker,
`if (minimizedEmptyAlt) {
    return {
      ...base,
      severity: "info",
      code: isTechnicalPlaceholder(tag)
        ? "IMAGE_ALT_EMPTY_TECHNICAL"
        : "IMAGE_ALT_EMPTY_DECORATIVE",
      message: isTechnicalPlaceholder(tag)
        ? "Leerer Alt-Text eines technischen Bildplatzhalters."
        : "Minimierter leerer Alt-Text. Das Bild wird als dekorativ oder redundant behandelt."
    };
  }

  `+marker);
}

fs.writeFileSync(file,src);
console.log("[24.1.1] Audit aktualisiert:",path.relative(ROOT,file));

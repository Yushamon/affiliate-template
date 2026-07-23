#!/usr/bin/env python3
from __future__ import annotations
import re, shutil, subprocess, sys
from datetime import datetime
from pathlib import Path

VERSION='4.2.1'
R_START='/* PT product navigation and gallery 4.2.0 */'; R_END='/* End PT product navigation and gallery 4.2.0 */'
P_START='/* PT mobile product breadcrumb 4.2.0 */'; P_END='/* End PT mobile product breadcrumb 4.2.0 */'
M_START='/* PT manufacturer hero media 4.2.0 */'; M_END='/* End PT manufacturer hero media 4.2.0 */'

PRODUCT_CSS=r'''
/* PT product navigation and gallery 4.2.0 */
.native-product__badge--manufacturer{ text-decoration:none; transition:border-color .18s ease,background-color .18s ease,color .18s ease,transform .18s ease; }
.native-product__badge--manufacturer:hover{ border-color:color-mix(in srgb,var(--np-green,#198a46) 48%,var(--np-border,#dce5e2)); background:color-mix(in srgb,var(--np-green-soft,#eaf7ee) 80%,white); transform:translateY(-1px); }
.native-product__badge--manufacturer:focus-visible{ outline:3px solid color-mix(in srgb,var(--np-green,#198a46) 35%,transparent); outline-offset:3px; }
.native-gallery__stage{ position:relative; display:grid!important; place-items:center!important; min-height:0!important; aspect-ratio:4/3; padding:clamp(.5rem,2vw,.9rem)!important; overflow:hidden; }
.native-gallery__slide{ position:absolute!important; inset:0!important; display:none!important; place-items:center!important; width:100%!important; height:100%!important; margin:0!important; padding:clamp(.5rem,2vw,.9rem)!important; }
.native-gallery__slide.is-active{ display:grid!important; }
.native-gallery__slide>img{ display:block!important; width:100%!important; height:100%!important; max-width:100%!important; max-height:100%!important; margin:auto!important; object-fit:contain!important; object-position:center center!important; transform:none!important; }
.native-gallery__slide figcaption{ position:absolute; inset-inline:.75rem; bottom:.75rem; }
.native-gallery__thumb{ display:grid!important; place-items:center!important; overflow:hidden!important; }
.native-gallery__thumb img{ display:block!important; width:100%!important; height:100%!important; margin:0!important; object-fit:contain!important; object-position:center center!important; transform:none!important; }
@media(max-width:720px){ .native-gallery__stage{ aspect-ratio:1/1; padding:.45rem!important; } .native-gallery__slide{ padding:.45rem!important; } }
/* End PT product navigation and gallery 4.2.0 */
'''

PRODUCT_PAGE_CSS=r'''
<style is:global>
/* PT mobile product breadcrumb 4.2.0 */
@media(max-width:720px){
  body:has([data-product-page]) :is(nav[aria-label="Breadcrumb"],nav[aria-label="Breadcrumbs"],.breadcrumbs,.breadcrumb,.product-breadcrumbs,[class*="breadcrumb"]){ display:none!important; }
  body:has([data-product-page]) main[data-product-page],body:has([data-product-page]) .product-detail{ padding-top:clamp(.9rem,4vw,1.3rem); }
}
/* End PT mobile product breadcrumb 4.2.0 */
</style>
'''

MANUFACTURER_CSS=r'''
<style is:global>
/* PT manufacturer hero media 4.2.0 */
:is(.manufacturer-hero,.manufacturer-header,.brand-hero,[data-manufacturer-hero],[class*="manufacturer-hero"],[class*="brand-hero"]) :is(picture,figure,.hero-media,.manufacturer-hero__media,[class*="hero__media"],[class*="hero-media"]){ display:grid!important; place-items:center!important; width:100%; min-width:0; min-height:0!important; aspect-ratio:16/9; padding:clamp(.75rem,2.5vw,1.25rem); overflow:hidden; border-radius:inherit; background:#f7f8fa; }
:is(.manufacturer-hero,.manufacturer-header,.brand-hero,[data-manufacturer-hero],[class*="manufacturer-hero"],[class*="brand-hero"]) :is(picture img,figure img,.hero-media img,.manufacturer-hero__media img,>img){ display:block!important; width:100%!important; height:100%!important; max-width:min(100%,1120px)!important; max-height:100%!important; margin:auto!important; object-fit:contain!important; object-position:center center!important; transform:none!important; }
@media(max-width:720px){ :is(.manufacturer-hero,.manufacturer-header,.brand-hero,[data-manufacturer-hero],[class*="manufacturer-hero"],[class*="brand-hero"]) :is(picture,figure,.hero-media,.manufacturer-hero__media,[class*="hero__media"],[class*="hero-media"]){ aspect-ratio:4/3; max-height:56svh; padding:.65rem; } }
:is(html.dark,html[data-theme="dark"],html[data-color-scheme="dark"],html[data-mode="dark"]) :is(.manufacturer-hero,.manufacturer-header,.brand-hero,[data-manufacturer-hero],[class*="manufacturer-hero"],[class*="brand-hero"]) :is(picture,figure,.hero-media,.manufacturer-hero__media,[class*="hero__media"],[class*="hero-media"]){ border:1px solid #314960; background:#f7f8fa; }
/* End PT manufacturer hero media 4.2.0 */
</style>
'''

def repo_root():
    p=subprocess.run(['git','rev-parse','--show-toplevel'],capture_output=True,text=True)
    if p.returncode: raise RuntimeError('Bitte im Root des Git-Repositorys ausführen.')
    return Path(p.stdout.strip())

def remove_marked(text,start,end):
    return re.sub(re.escape(start)+r'[\s\S]*?'+re.escape(end),'',text).rstrip()+'\n'

def find_renderer(root):
    p=root/'apps/pfotentechnik/src/components/product-standard-2/ProductRenderer.astro'
    if p.exists(): return p
    m=list((root/'apps/pfotentechnik/src').rglob('ProductRenderer.astro'))
    if len(m)==1: return m[0]
    raise RuntimeError('ProductRenderer.astro wurde nicht eindeutig gefunden.')

def find_product(root):
    for n in ('[product].astro','[slug].astro'):
        p=root/'apps/pfotentechnik/src/pages/produkt'/n
        if p.exists(): return p
    raise RuntimeError('Produktseiten-Route wurde nicht gefunden.')

def find_manufacturer(root):
    folder=root/'apps/pfotentechnik/src/pages/hersteller'
    for n in ('[manufacturer].astro','[slug].astro'):
        p=folder/n
        if p.exists(): return p
    d=[p for p in folder.glob('*.astro') if '[' in p.name] if folder.exists() else []
    if len(d)==1: return d[0]
    raise RuntimeError('Herstellerseiten-Route wurde nicht eindeutig gefunden.')

def patch_renderer(path):
    text=path.read_text(encoding='utf-8')
    if 'const manufacturerHref =' not in text:
        idx=text.find('const category = asText(')
        if idx<0: raise RuntimeError('Renderer-Anker für Herstellerlink fehlt.')
        insert='''const manufacturerSlug = asText(\n  source.manufacturer?.slug ??\n  source.manufacturer?.key\n);\nconst manufacturerHref = manufacturerSlug\n  ? `/hersteller/${manufacturerSlug}/`\n  : "";\n\n'''
        text=text[:idx]+insert+text[idx:]
    old='{manufacturer && <span class="native-product__badge native-product__badge--soft">{manufacturer}</span>}'
    new='''{manufacturer && (\n        manufacturerHref\n          ? <a class="native-product__badge native-product__badge--soft native-product__badge--manufacturer" href={manufacturerHref} aria-label={`Alle Inhalte und Produkte von ${manufacturer}`}>{manufacturer}</a>\n          : <span class="native-product__badge native-product__badge--soft">{manufacturer}</span>\n      )}'''
    if old in text: text=text.replace(old,new,1)
    elif 'native-product__badge--manufacturer' not in text: raise RuntimeError('Hersteller-Chip wurde nicht gefunden.')
    text=remove_marked(text,R_START,R_END)
    if '</style>' not in text: raise RuntimeError('Renderer enthält keinen Style-Abschluss.')
    text=text.replace('</style>',PRODUCT_CSS.strip()+'\n</style>',1)
    path.write_text(text,encoding='utf-8')

def patch_page(path,css,start,end):
    text=remove_marked(path.read_text(encoding='utf-8'),start,end)
    text=re.sub(r'<style is:global>\s*</style>','',text)
    if '</ProjectLayout>' in text: text=text.replace('</ProjectLayout>',css.strip()+'\n\n</ProjectLayout>',1)
    else: text=text.rstrip()+'\n\n'+css.strip()+'\n'
    path.write_text(text,encoding='utf-8')

def main():
    root=repo_root(); renderer=find_renderer(root); product=find_product(root); manufacturer=find_manufacturer(root); files=[renderer,product,manufacturer]
    backup=root/'.patch-backups'/f'product-manufacturer-media-{VERSION}-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    for f in files:
        d=backup/f.relative_to(root); d.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(f,d)
    try:
        patch_renderer(renderer); patch_page(product,PRODUCT_PAGE_CSS,P_START,P_END); patch_page(manufacturer,MANUFACTURER_CSS,M_START,M_END)
        npm_executable = (
            shutil.which('npm.cmd')
            or shutil.which('npm.exe')
            or shutil.which('npm')
        )
        if npm_executable:
            print(f'Build wird ausgeführt mit: {npm_executable}')
            p=subprocess.run(
                [npm_executable,'run','build:pfotentechnik'],
                cwd=root,
                shell=False
            )
            if p.returncode:
                raise RuntimeError('Build fehlgeschlagen.')
        else:
            print(
                '\nHinweis: npm wurde von Python nicht gefunden. '
                'Der Patch bleibt installiert, der Build wurde übersprungen.\n'
                'Bitte anschließend manuell ausführen:\n'
                '  npm run build:pfotentechnik\n'
            )
    except Exception as error:
        for f in files:
            b=backup/f.relative_to(root)
            if b.exists():
                shutil.copy2(b,f)
        print('\nPatch fehlgeschlagen; alle Dateien wurden zurückgesetzt.',file=sys.stderr)
        print(f'Ursache: {error}',file=sys.stderr)
        raise
    print('\nPatch erfolgreich installiert.'); print('Backup:',backup.relative_to(root))

if __name__=='__main__': main()

#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil
import sys

def fail(message: str) -> None:
    print(f"Fehler: {message}", file=sys.stderr)
    raise SystemExit(1)

def find_repo_root(start: Path) -> Path:
    for candidate in [start, *start.parents]:
        target = candidate / "packages" / "affiliate-core" / "src" / "layouts" / "AffiliateLayout.astro"
        if target.exists():
            return candidate
    fail("Repository-Root nicht gefunden. Script im Repository oder einem Unterordner ausführen.")

root = find_repo_root(Path.cwd().resolve())
layout = root / "packages" / "affiliate-core" / "src" / "layouts" / "AffiliateLayout.astro"
source = layout.read_text(encoding="utf-8")

broken_block = '''const imageUrl = ogImage
  ? toAbsoluteUrl(site.domain, ogImage)
  : toAbsoluteUrl(site.domain, projectConfig.defaultOgImage ?? "/favicon.svg");
const publisherLogoUrl = toAbsoluteUrl(site.domain, siteMeta.publisher.logo);
const authorUrl = visibleAuthor.url
  ? toAbsoluteUrl(site.domain, visibleAuthor.url)
  : siteMeta.defaultAuthor.url
    ? toAbsoluteUrl(site.domain, siteMeta.defaultAuthor.url)
    : undefined;

const isHome = normalizedCanonical === "/";
const resolvedSchemaType = schemaType ?? (isHome ? "website" : "webpage");
const shouldRenderArticleSchema = resolvedSchemaType === "article";
const shouldRenderWebPageSchema = resolvedSchemaType === "webpage";
const shouldRenderBreadcrumbSchema = includeBreadcrumbSchema ?? !isHome;

const visibleAuthor = author ?? siteMeta.defaultAuthor;'''

fixed_block = '''const visibleAuthor = author ?? siteMeta.defaultAuthor;

const imageUrl = ogImage
  ? toAbsoluteUrl(site.domain, ogImage)
  : toAbsoluteUrl(site.domain, projectConfig.defaultOgImage ?? "/favicon.svg");
const publisherLogoUrl = toAbsoluteUrl(site.domain, siteMeta.publisher.logo);
const authorUrl = visibleAuthor.url
  ? toAbsoluteUrl(site.domain, visibleAuthor.url)
  : undefined;

const isHome = normalizedCanonical === "/";
const resolvedSchemaType = schemaType ?? (isHome ? "website" : "webpage");
const shouldRenderArticleSchema = resolvedSchemaType === "article";
const shouldRenderWebPageSchema = resolvedSchemaType === "webpage";
const shouldRenderBreadcrumbSchema = includeBreadcrumbSchema ?? !isHome;'''

if fixed_block in source:
    print("Hotfix ist bereits angewendet. Keine Änderung nötig.")
    raise SystemExit(0)

count = source.count(broken_block)
if count != 1:
    fail(
        "Die erwartete fehlerhafte Stelle wurde nicht exakt einmal gefunden. "
        "Datei wurde nicht verändert."
    )

backup = root / (
    ".pfotentechnik-visible-author-hotfix-5.0.1-backup-"
    + datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
)
target = backup / layout.relative_to(root)
target.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(layout, target)

layout.write_text(source.replace(broken_block, fixed_block, 1), encoding="utf-8")

print("Hotfix 5.0.1 erfolgreich angewendet.")
print(f"Backup: {backup}")
print("Jetzt ausführen:")
print("  npm run build:pfotentechnik")

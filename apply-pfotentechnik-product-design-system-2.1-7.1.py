#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

START = "/* PT product design system 2.1 / 7.1 */"
END = "/* End PT product design system 2.1 / 7.1 */"
OLD_BLOCKS = (
    ("/* PT theme contrast and product data 6.5 */", "/* End PT theme contrast and product data 6.5 */"),
    ("/* PT product design system 2.0 / 7.0 */", "/* End PT product design system 2.0 / 7.0 */"),
)

CSS = '\n/* PT product design system 2.1 / 7.1 */\n[data-product-page] {\n  --pt-product-surface:#fff;\n  --pt-product-surface-soft:#f6f8f8;\n  --pt-product-border:#dce5e2;\n  --pt-product-border-strong:#cbd8d4;\n  --pt-product-text:#101c2c;\n  --pt-product-text-soft:#435165;\n  --pt-product-text-muted:#718096;\n  --pt-product-accent:#198a46;\n  --pt-product-accent-bright:#57da8a;\n  --pt-product-accent-soft:#eaf7ee;\n  --pt-product-good:#198a46;\n  --pt-product-good-soft:#edf9f1;\n  --pt-product-bad:#c63b3b;\n  --pt-product-bad-soft:#fff1f1;\n  --pt-product-shadow:0 12px 34px rgba(17,35,29,.07);\n  color:var(--pt-product-text);\n}\n\n[data-product-page] :is(.product-fit-card,.product-pros-cons,.product-recommendation,.product-alternatives,.product-faq,.technical-data,.technical-specs,.product-specs,[class*="technical-data"],[class*="technical-specs"]) {\n  border:1px solid var(--pt-product-border);\n  border-radius:1.25rem;\n  color:var(--pt-product-text);\n  background:var(--pt-product-surface);\n  box-shadow:var(--pt-product-shadow);\n}\n\n[data-product-page] :is(.product-fit-card,.product-pros-cons,.product-recommendation,.product-alternatives,.product-faq) :is(h2,h3,h4,strong) { color:var(--pt-product-text)!important; }\n[data-product-page] :is(.product-fit-card,.product-pros-cons,.product-recommendation,.product-alternatives,.product-faq) :is(p,li,small) { color:var(--pt-product-text-soft)!important; }\n\n[data-product-page] :is(.product-fit-good,.product-suitability-good,[class*="fit-good"],[class*="suitability-good"]),\n[data-product-page] :is(.product-fit-bad,.product-suitability-bad,[class*="fit-bad"],[class*="suitability-bad"]) {\n  padding:1.15rem;\n  border:1px solid var(--pt-product-border);\n  border-radius:1rem;\n}\n[data-product-page] :is(.product-fit-good,.product-suitability-good,[class*="fit-good"],[class*="suitability-good"]) { border-left:4px solid var(--pt-product-good); background:var(--pt-product-good-soft); }\n[data-product-page] :is(.product-fit-bad,.product-suitability-bad,[class*="fit-bad"],[class*="suitability-bad"]) { border-left:4px solid var(--pt-product-bad); background:var(--pt-product-bad-soft); }\n[data-product-page] :is(.product-fit-good,.product-fit-bad,.product-suitability-good,.product-suitability-bad,[class*="fit-good"],[class*="fit-bad"],[class*="suitability-good"],[class*="suitability-bad"]) :is(h3,h4,strong) { color:var(--pt-product-text)!important; }\n[data-product-page] :is(.product-fit-good,.product-fit-bad,.product-suitability-good,.product-suitability-bad,[class*="fit-good"],[class*="fit-bad"],[class*="suitability-good"],[class*="suitability-bad"]) li { color:var(--pt-product-text-soft)!important; }\n\n[data-product-page] :is(.product-pros,.pros-card,[class*="advantages"],[class*="pros-card"]),\n[data-product-page] :is(.product-cons,.cons-card,[class*="disadvantages"],[class*="cons-card"]) {\n  padding:1.15rem;\n  border:1px solid var(--pt-product-border);\n  border-radius:1rem;\n  background:var(--pt-product-surface);\n}\n[data-product-page] :is(.product-pros,.pros-card,[class*="advantages"],[class*="pros-card"]) { border-top:3px solid var(--pt-product-good); }\n[data-product-page] :is(.product-cons,.cons-card,[class*="disadvantages"],[class*="cons-card"]) { border-top:3px solid var(--pt-product-bad); }\n[data-product-page] :is(.product-pros,.product-cons,.pros-card,.cons-card,[class*="advantages"],[class*="disadvantages"]) :is(h3,h4,strong) { color:var(--pt-product-text)!important; }\n[data-product-page] :is(.product-pros,.product-cons,.pros-card,.cons-card,[class*="advantages"],[class*="disadvantages"]) li { color:var(--pt-product-text-soft)!important; }\n\n[data-product-page] :is(.product-recommendation,.editorial-recommendation,[class*="editorial-recommendation"],[class*="recommendation-card"]) {\n  padding:clamp(1.1rem,3vw,1.5rem);\n  border-color:color-mix(in srgb,var(--pt-product-accent) 28%,var(--pt-product-border));\n  background:linear-gradient(135deg,color-mix(in srgb,var(--pt-product-accent-soft) 78%,transparent),transparent 65%),var(--pt-product-surface);\n}\n\n[data-product-page] :is(.technical-data,.technical-specs,.product-specs,.specification-list,[class*="technical-data"],[class*="technical-specs"],[class*="specification-list"]) { overflow:hidden; }\n[data-product-page] :is(.technical-data,.technical-specs,.product-specs,.specification-list,[class*="technical-data"],[class*="technical-specs"],[class*="specification-list"]) :is(dl,ul,ol) { margin:0; padding:0; }\n[data-product-page] :is(.technical-data,.technical-specs,.product-specs,.specification-list,[class*="technical-data"],[class*="technical-specs"],[class*="specification-list"]) :is(dl>div,li,.technical-data__row,.technical-specs__row,.product-specs__row,.specification-row) { min-width:0; padding:1rem 1.05rem; border-bottom:1px solid var(--pt-product-border); background:var(--pt-product-surface); }\n[data-product-page] :is(.technical-data,.technical-specs,.product-specs,.specification-list,[class*="technical-data"],[class*="technical-specs"],[class*="specification-list"]) :is(dl>div,li,.technical-data__row,.technical-specs__row,.product-specs__row,.specification-row):last-child { border-bottom:0; }\n[data-product-page] :is(.technical-data,.technical-specs,.product-specs,.specification-list,[class*="technical-data"],[class*="technical-specs"],[class*="specification-list"]) :is(dt,[class*="label"],[class*="term"]) { color:var(--pt-product-text-muted)!important; font-size:.82rem; line-height:1.35; }\n[data-product-page] :is(.technical-data,.technical-specs,.product-specs,.specification-list,[class*="technical-data"],[class*="technical-specs"],[class*="specification-list"]) :is(dd,[class*="value"]) { min-width:0; margin:.28rem 0 0; color:var(--pt-product-text)!important; font-size:.96rem; font-weight:760; line-height:1.35; overflow-wrap:anywhere; }\n\n[data-product-page] :is(.alternative-card,.product-alternative-card,[class*="alternative-card"]) {\n  display:grid;\n  grid-template-columns:116px minmax(0,1fr);\n  gap:1rem;\n  align-items:center;\n  padding:1rem;\n  border:1px solid var(--pt-product-border);\n  border-radius:1rem;\n  color:var(--pt-product-text);\n  background:var(--pt-product-surface-soft);\n}\n[data-product-page] :is(.alternative-card,.product-alternative-card,[class*="alternative-card"]) :is(h3,h4,strong) { color:var(--pt-product-text)!important; }\n[data-product-page] :is(.alternative-card,.product-alternative-card,[class*="alternative-card"]) :is(p,small) { color:var(--pt-product-text-soft)!important; }\n[data-product-page] :is(.alternative-card,.product-alternative-card,[class*="alternative-card"]) img { width:116px; height:96px; border-radius:.8rem; object-fit:cover; }\n\n[data-product-page] :is(.product-faq,.faq-section,[class*="product-faq"],[class*="faq-section"]) :is(details,.faq-item,[class*="faq-item"]) {\n  border:1px solid var(--pt-product-border);\n  border-radius:.9rem;\n  color:var(--pt-product-text);\n  background:var(--pt-product-surface-soft);\n}\n[data-product-page] :is(.product-faq,.faq-section,[class*="product-faq"],[class*="faq-section"]) :is(summary,button,[class*="question"]) { color:var(--pt-product-text)!important; background:transparent!important; }\n[data-product-page] :is(.product-faq,.faq-section,[class*="product-faq"],[class*="faq-section"]) :is(details[open],.faq-item[open]) { border-color:color-mix(in srgb,var(--pt-product-accent) 24%,var(--pt-product-border)); background:var(--pt-product-accent-soft); }\n[data-product-page] :is(.product-faq,.faq-section,[class*="product-faq"],[class*="faq-section"]) :is(p,[class*="answer"]) { color:var(--pt-product-text-soft)!important; }\n\n[data-product-page] :is(.product-score,.score-card,.rating-card,[class*="score-card"],[class*="rating-card"]) { color:var(--pt-product-text); background:var(--pt-product-surface); }\n[data-product-page] :is(.product-score,.score-card,.rating-card,[class*="score-card"],[class*="rating-card"]) :is(h2,h3,strong,[class*="score"]) { color:var(--pt-product-text)!important; }\n\n[data-product-page] :is(.sticky-product-cta,.product-sticky-cta,[class*="sticky-cta"]) {\n  border-color:var(--pt-product-border-strong);\n  color:var(--pt-product-text);\n  background:color-mix(in srgb,var(--pt-product-surface) 94%,transparent);\n  box-shadow:0 12px 36px rgba(5,18,15,.18);\n  backdrop-filter:blur(14px);\n}\n[data-product-page] :is(.sticky-product-cta,.product-sticky-cta,[class*="sticky-cta"]) :is(span,small,strong) { color:var(--pt-product-text-soft); }\n[data-product-page] :is(.sticky-product-cta,.product-sticky-cta,[class*="sticky-cta"]) :is(a,button) { color:#071811; background:var(--pt-product-accent-bright); }\n\n[data-product-page] :is(.product-gallery,[class*="product-gallery"]) { border-color:var(--pt-product-border); background:var(--pt-product-surface); }\n[data-product-page] :is(.product-gallery,[class*="product-gallery"]) :is(.thumbnail,[class*="thumbnail"]) { border-color:var(--pt-product-border); background:var(--pt-product-surface-soft); }\n[data-product-page] :is(.product-gallery,[class*="product-gallery"]) :is(.thumbnail[aria-current="true"],[class*="thumbnail"].is-active,[class*="thumbnail"][data-active="true"]) { border-color:var(--pt-product-accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--pt-product-accent) 16%,transparent); }\n\n@media (max-width:720px) {\n  [data-product-page] :is(.alternative-card,.product-alternative-card,[class*="alternative-card"]) { grid-template-columns:96px minmax(0,1fr); gap:.8rem; padding:.85rem; }\n  [data-product-page] :is(.alternative-card,.product-alternative-card,[class*="alternative-card"]) img { width:96px; height:86px; }\n  [data-product-page] :is(.technical-data,.technical-specs,.product-specs,.specification-list,[class*="technical-data"],[class*="technical-specs"]) :is(dl>div,li,.technical-data__row,.technical-specs__row,.product-specs__row,.specification-row) { padding:.9rem .95rem; }\n}\n\n@media (prefers-color-scheme:dark) {\n  [data-product-page] {\n    --pt-product-surface:#101d2f;\n    --pt-product-surface-soft:#142238;\n    --pt-product-border:rgba(203,218,232,.14);\n    --pt-product-border-strong:rgba(203,218,232,.22);\n    --pt-product-text:#f4f8fb;\n    --pt-product-text-soft:#b8c6d4;\n    --pt-product-text-muted:#93a5b8;\n    --pt-product-accent:#57da8a;\n    --pt-product-accent-bright:#5cdf91;\n    --pt-product-accent-soft:rgba(87,218,138,.1);\n    --pt-product-good:#61dc92;\n    --pt-product-good-soft:rgba(47,182,103,.11);\n    --pt-product-bad:#ff7777;\n    --pt-product-bad-soft:rgba(218,73,73,.11);\n    --pt-product-shadow:none;\n  }\n}\n\n:is(html.dark,html[data-theme="dark"],html[data-color-scheme="dark"],body.dark,[data-theme="dark"]) [data-product-page] {\n  --pt-product-surface:#101d2f;\n  --pt-product-surface-soft:#142238;\n  --pt-product-border:rgba(203,218,232,.14);\n  --pt-product-border-strong:rgba(203,218,232,.22);\n  --pt-product-text:#f4f8fb;\n  --pt-product-text-soft:#b8c6d4;\n  --pt-product-text-muted:#93a5b8;\n  --pt-product-accent:#57da8a;\n  --pt-product-accent-bright:#5cdf91;\n  --pt-product-accent-soft:rgba(87,218,138,.1);\n  --pt-product-good:#61dc92;\n  --pt-product-good-soft:rgba(47,182,103,.11);\n  --pt-product-bad:#ff7777;\n  --pt-product-bad-soft:rgba(218,73,73,.11);\n  --pt-product-shadow:none;\n}\n\n@media (prefers-color-scheme:dark) {\n  [data-product-page] :is(.product-fit-card,.product-pros-cons,.product-recommendation,.product-alternatives,.product-faq,.technical-data,.technical-specs,.product-specs,[class*="technical-data"],[class*="technical-specs"],.alternative-card,.product-alternative-card,[class*="alternative-card"],.score-card,.rating-card,[class*="score-card"],[class*="rating-card"]) {\n    border-color:var(--pt-product-border)!important;\n    color:var(--pt-product-text)!important;\n    background-color:var(--pt-product-surface)!important;\n    box-shadow:none!important;\n  }\n}\n\n:is(html.dark,html[data-theme="dark"],html[data-color-scheme="dark"],body.dark,[data-theme="dark"]) [data-product-page] :is(.product-fit-card,.product-pros-cons,.product-recommendation,.product-alternatives,.product-faq,.technical-data,.technical-specs,.product-specs,[class*="technical-data"],[class*="technical-specs"],.alternative-card,.product-alternative-card,[class*="alternative-card"],.score-card,.rating-card,[class*="score-card"],[class*="rating-card"]) {\n  border-color:var(--pt-product-border)!important;\n  color:var(--pt-product-text)!important;\n  background-color:var(--pt-product-surface)!important;\n  box-shadow:none!important;\n}\n\n/* ============================================================\n   Layout alignment, status cleanup and product-page polish 7.1\n   ============================================================ */\n\n[data-product-page] {\n  width: 100%;\n  max-width: 100%;\n  overflow-x: clip;\n}\n\n[data-product-page] :is(\n  .product-layout,\n  .product-detail-layout,\n  .product-page__layout,\n  .product-shell,\n  [class*="product-layout"],\n  [class*="product-detail-layout"]\n) {\n  min-width: 0;\n}\n\n[data-product-page] :is(\n  .product-main,\n  .product-content,\n  .product-page__content,\n  .product-detail__content,\n  .product-layout__main,\n  [class*="product-main"],\n  [class*="product-content"],\n  [class*="product-layout__main"]\n) {\n  min-width: 0;\n  max-width: 100%;\n}\n\n/* Editorial review is an internal content status, not user-facing copy. */\n[data-product-page] :is(\n  [data-test-status="editorial-review"],\n  [data-review-status="editorial-review"],\n  [data-status="editorial-review"],\n  .test-status--editorial-review,\n  .review-status--editorial-review,\n  .status--editorial-review,\n  .editorial-review,\n  [class*="test-status"],\n  [class*="review-status"]\n) {\n  display: none !important;\n}\n\n/* Keep all primary product modules on one visual axis. */\n[data-product-page] :is(\n  .product-breadcrumbs,\n  .breadcrumbs,\n  [class*="breadcrumb"],\n  .product-hero,\n  .product-intro,\n  .product-summary,\n  .product-identity,\n  .product-gallery,\n  .product-overview,\n  .product-content,\n  .product-main,\n  .product-section,\n  [class*="product-hero"],\n  [class*="product-intro"],\n  [class*="product-summary"],\n  [class*="product-identity"],\n  [class*="product-gallery"],\n  [class*="product-overview"]\n) {\n  width: 100%;\n  max-width: 100%;\n  margin-inline: 0;\n}\n\n[data-product-page] :is(\n  .product-breadcrumbs,\n  .breadcrumbs,\n  [class*="breadcrumb"]\n) {\n  margin-bottom: clamp(1.35rem, 3.5vw, 2.25rem);\n}\n\n[data-product-page] :is(\n  .product-hero,\n  .product-intro,\n  .product-summary,\n  .product-identity,\n  [class*="product-hero"],\n  [class*="product-intro"],\n  [class*="product-summary"],\n  [class*="product-identity"]\n) {\n  border-color: var(--pt-product-border);\n  color: var(--pt-product-text);\n  background: var(--pt-product-surface);\n  box-shadow: var(--pt-product-shadow);\n}\n\n[data-product-page] :is(\n  .product-hero,\n  .product-intro,\n  .product-summary,\n  .product-identity,\n  [class*="product-hero"],\n  [class*="product-intro"],\n  [class*="product-summary"],\n  [class*="product-identity"]\n) :is(h1, h2, h3, strong) {\n  color: var(--pt-product-text) !important;\n}\n\n[data-product-page] :is(\n  .product-hero,\n  .product-intro,\n  .product-summary,\n  .product-identity,\n  [class*="product-hero"],\n  [class*="product-intro"],\n  [class*="product-summary"],\n  [class*="product-identity"]\n) :is(p, small) {\n  color: var(--pt-product-text-soft) !important;\n}\n\n/* Category/manufacturer pills stay compact and readable in both themes. */\n[data-product-page] :is(\n  .product-chip,\n  .product-badge,\n  .product-tag,\n  [class*="product-chip"],\n  [class*="product-badge"],\n  [class*="product-tag"]\n) {\n  min-height: 34px;\n  padding: 0.42rem 0.72rem;\n  border: 1px solid color-mix(in srgb, var(--pt-product-accent) 24%, var(--pt-product-border));\n  border-radius: 999px;\n  color: var(--pt-product-accent) !important;\n  background: var(--pt-product-accent-soft);\n  font-size: 0.72rem;\n  font-weight: 850;\n  line-height: 1;\n}\n\n/* Reduce empty gallery stage while preserving uncropped product imagery. */\n[data-product-page] :is(\n  .product-gallery__stage,\n  .product-gallery__main,\n  .product-gallery__viewport,\n  .gallery-stage,\n  .gallery-main,\n  [class*="gallery__stage"],\n  [class*="gallery__main"],\n  [class*="gallery__viewport"]\n) {\n  width: 100%;\n  min-height: 0;\n  aspect-ratio: 16 / 10;\n  padding: clamp(0.65rem, 2vw, 1rem);\n  overflow: hidden;\n  border-radius: 1rem;\n  background: #f7f8f6;\n}\n\n[data-product-page] :is(\n  .product-gallery__stage,\n  .product-gallery__main,\n  .product-gallery__viewport,\n  .gallery-stage,\n  .gallery-main,\n  [class*="gallery__stage"],\n  [class*="gallery__main"],\n  [class*="gallery__viewport"]\n) :is(picture, img) {\n  width: 100%;\n  height: 100%;\n}\n\n[data-product-page] :is(\n  .product-gallery__stage,\n  .product-gallery__main,\n  .product-gallery__viewport,\n  .gallery-stage,\n  .gallery-main,\n  [class*="gallery__stage"],\n  [class*="gallery__main"],\n  [class*="gallery__viewport"]\n) img {\n  display: block;\n  object-fit: contain;\n  object-position: center;\n}\n\n[data-product-page] :is(\n  .gallery-arrow,\n  .product-gallery__arrow,\n  [class*="gallery-arrow"],\n  [class*="gallery__arrow"]\n) {\n  top: 50%;\n  transform: translateY(-50%);\n}\n\n/* Sticky CTA stays centered, compact and above mobile browser UI. */\n[data-product-page] :is(\n  .sticky-product-cta,\n  .product-sticky-cta,\n  [class*="sticky-cta"]\n) {\n  right: max(0.85rem, env(safe-area-inset-right));\n  bottom: max(0.85rem, env(safe-area-inset-bottom));\n  left: max(0.85rem, env(safe-area-inset-left));\n  width: auto;\n  max-width: 62rem;\n  margin-inline: auto;\n}\n\n[data-product-page] :is(\n  a,\n  button,\n  summary,\n  input,\n  select,\n  textarea\n):focus-visible {\n  outline: 3px solid color-mix(in srgb, var(--pt-product-accent) 35%, transparent);\n  outline-offset: 3px;\n}\n\n@media (max-width: 760px) {\n  [data-product-page] {\n    padding-inline: max(1rem, env(safe-area-inset-left));\n  }\n\n  [data-product-page] :is(\n    .product-layout,\n    .product-detail-layout,\n    .product-page__layout,\n    .product-shell,\n    [class*="product-layout"],\n    [class*="product-detail-layout"]\n  ) {\n    display: grid !important;\n    width: 100% !important;\n    max-width: 100% !important;\n    grid-template-columns: minmax(0, 1fr) !important;\n    margin-inline: 0 !important;\n    padding-inline: 0 !important;\n  }\n\n  [data-product-page] :is(\n    .product-main,\n    .product-content,\n    .product-page__content,\n    .product-detail__content,\n    .product-layout__main,\n    [class*="product-main"],\n    [class*="product-content"],\n    [class*="product-layout__main"]\n  ) {\n    width: 100% !important;\n    max-width: 100% !important;\n    grid-column: 1 / -1 !important;\n    margin-inline: 0 !important;\n    padding-inline: 0 !important;\n    transform: none !important;\n  }\n\n  [data-product-page] :is(\n    .product-hero,\n    .product-intro,\n    .product-summary,\n    .product-identity,\n    .product-gallery,\n    [class*="product-hero"],\n    [class*="product-intro"],\n    [class*="product-summary"],\n    [class*="product-identity"],\n    [class*="product-gallery"]\n  ) {\n    width: 100% !important;\n    max-width: none !important;\n    margin-inline: 0 !important;\n  }\n\n  [data-product-page] :is(\n    .product-hero,\n    .product-intro,\n    .product-summary,\n    .product-identity,\n    [class*="product-hero"],\n    [class*="product-intro"],\n    [class*="product-summary"],\n    [class*="product-identity"]\n  ) {\n    padding: 1.15rem;\n    border-radius: 1.15rem;\n  }\n\n  [data-product-page] :is(\n    .product-hero,\n    .product-intro,\n    .product-summary,\n    .product-identity,\n    [class*="product-hero"],\n    [class*="product-intro"],\n    [class*="product-summary"],\n    [class*="product-identity"]\n  ) h1 {\n    font-size: clamp(2rem, 8.5vw, 2.8rem);\n    line-height: 1.02;\n    letter-spacing: -0.045em;\n  }\n\n  [data-product-page] :is(\n    .product-gallery__stage,\n    .product-gallery__main,\n    .product-gallery__viewport,\n    .gallery-stage,\n    .gallery-main,\n    [class*="gallery__stage"],\n    [class*="gallery__main"],\n    [class*="gallery__viewport"]\n  ) {\n    aspect-ratio: 16 / 10;\n  }\n}\n\n@media (max-width: 390px) {\n  [data-product-page] {\n    padding-inline: max(0.8rem, env(safe-area-inset-left));\n  }\n\n  [data-product-page] :is(\n    .product-hero,\n    .product-intro,\n    .product-summary,\n    .product-identity,\n    [class*="product-hero"],\n    [class*="product-intro"],\n    [class*="product-summary"],\n    [class*="product-identity"]\n  ) {\n    padding: 1rem;\n  }\n}\n\n@media (prefers-color-scheme: dark) {\n  [data-product-page] :is(\n    .product-hero,\n    .product-intro,\n    .product-summary,\n    .product-identity,\n    .product-gallery,\n    [class*="product-hero"],\n    [class*="product-intro"],\n    [class*="product-summary"],\n    [class*="product-identity"],\n    [class*="product-gallery"]\n  ) {\n    border-color: var(--pt-product-border) !important;\n    color: var(--pt-product-text) !important;\n    background-color: var(--pt-product-surface) !important;\n    box-shadow: none !important;\n  }\n}\n\n:is(\n  html.dark,\n  html[data-theme="dark"],\n  html[data-color-scheme="dark"],\n  body.dark,\n  [data-theme="dark"]\n) [data-product-page] :is(\n  .product-hero,\n  .product-intro,\n  .product-summary,\n  .product-identity,\n  .product-gallery,\n  [class*="product-hero"],\n  [class*="product-intro"],\n  [class*="product-summary"],\n  [class*="product-identity"],\n  [class*="product-gallery"]\n) {\n  border-color: var(--pt-product-border) !important;\n  color: var(--pt-product-text) !important;\n  background-color: var(--pt-product-surface) !important;\n  box-shadow: none !important;\n}\n/* End PT product design system 2.1 / 7.1 */\n'

STATUS_SCRIPT_MARKER = "data-pt-editorial-status-cleanup"
STATUS_SCRIPT = r'''<script is:inline data-pt-editorial-status-cleanup>
  (() => {
    const root = document.querySelector('[data-product-page]');
    if (!root) return;

    const hiddenLabels = new Set([
      'editorial review',
      'editorial-review',
      'redaktionelle bewertung',
      'redaktionell bewertet'
    ]);

    root.querySelectorAll(
      '[data-test-status], [data-review-status], [class*="test-status"], [class*="review-status"], [class*="status"]'
    ).forEach((element) => {
      const value = (
        element.getAttribute('data-test-status') ||
        element.getAttribute('data-review-status') ||
        element.textContent ||
        ''
      ).trim().toLocaleLowerCase('de');

      if (hiddenLabels.has(value)) {
        element.remove();
      }
    });
  })();
</script>'''


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def remove_marked(text: str, start: str, end: str) -> str:
    while start in text and end in text:
        begin = text.index(start)
        finish = text.index(end, begin) + len(end)
        text = text[:begin].rstrip() + "\n\n" + text[finish:].lstrip()
    return text


def find_design_css(root: Path) -> Path:
    candidates = (
        root / "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css",
        root / "apps/pfotentechnik/src/styles/product.css",
        root / "apps/pfotentechnik/src/styles/global.css",
    )
    for path in candidates:
        if path.exists():
            return path
    raise RuntimeError("Keine passende PfotenTechnik-CSS-Datei gefunden.")


def find_product_page(root: Path) -> Path:
    candidates = (
        root / "apps/pfotentechnik/src/pages/produkt/[product].astro",
        root / "apps/pfotentechnik/src/pages/produkt/[slug].astro",
        root / "apps/pfotentechnik/src/pages/product/[product].astro",
        root / "apps/pfotentechnik/src/pages/product/[slug].astro",
    )
    for path in candidates:
        if path.exists():
            return path
    raise RuntimeError("Produktseiten-Route wurde nicht gefunden.")


def mark_product_page(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    changed = False

    if "data-product-page" not in text:
        match = re.search(r"<main(?P<attrs>\s[^>]*)?>", text)
        if match:
            attrs = match.group("attrs") or ""
            replacement = f"<main{attrs} data-product-page>"
            text = text[:match.start()] + replacement + text[match.end():]
            changed = True
        else:
            wrapper = re.search(
                r'<div(?P<attrs>[^>]*class="[^"]*(?:product-page|product-detail)[^"]*"[^>]*)>',
                text,
            )
            if not wrapper:
                raise RuntimeError("Produktseiten-Wrapper wurde nicht gefunden.")
            attrs = wrapper.group("attrs")
            text = text[:wrapper.start()] + f"<div{attrs} data-product-page>" + text[wrapper.end():]
            changed = True

    if STATUS_SCRIPT_MARKER not in text:
        closing = text.rfind("</main>")
        if closing >= 0:
            insert_at = closing + len("</main>")
            text = text[:insert_at] + "\n\n" + STATUS_SCRIPT + text[insert_at:]
        else:
            text = text.rstrip() + "\n\n" + STATUS_SCRIPT + "\n"
        changed = True

    path.write_text(text, encoding="utf-8")
    return changed


def update_css(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for old_start, old_end in OLD_BLOCKS:
        text = remove_marked(text, old_start, old_end)
    text = remove_marked(text, START, END)
    path.write_text(
        text.rstrip() + "\n\n" + CSS.strip() + "\n",
        encoding="utf-8",
    )


def scan_status_sources(root: Path) -> list[str]:
    results: list[str] = []
    needles = (
        "editorial-review",
        "Editorial Review",
        "editorial review",
        "testStatus",
        "reviewStatus",
    )
    search_roots = (
        root / "apps/pfotentechnik/src",
        root / "packages/affiliate-core/src",
    )

    for search_root in search_roots:
        if not search_root.exists():
            continue
        for path in search_root.rglob("*"):
            if path.suffix not in {".astro", ".ts", ".tsx", ".md", ".css"}:
                continue
            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if any(needle in content for needle in needles):
                results.append(str(path.relative_to(root)))
    return sorted(set(results))


def main() -> int:
    root = repo_root()
    css_path = find_design_css(root)
    product_page = find_product_page(root)

    originals = {
        css_path: css_path.read_text(encoding="utf-8"),
        product_page: product_page.read_text(encoding="utf-8"),
    }

    try:
        page_changed = mark_product_page(product_page)
        update_css(css_path)

        check = subprocess.run(
            ["git", "diff", "--check"],
            cwd=root,
            capture_output=True,
            text=True,
        )
        if check.returncode != 0:
            print(check.stdout, file=sys.stderr)
            print(check.stderr, file=sys.stderr)
            raise RuntimeError("git diff --check meldet Formatfehler.")
    except Exception:
        for path, content in originals.items():
            path.write_text(content, encoding="utf-8")
        raise

    status_sources = scan_status_sources(root)
    changed_files = [product_page, css_path]

    diff = subprocess.run(
        [
            "git",
            "diff",
            "--binary",
            "--",
            *[str(path.relative_to(root)) for path in changed_files],
        ],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout

    patch_path = root / "pfotentechnik-product-design-system-2.1-7.1.patch"
    patch_path.write_text(diff, encoding="utf-8")

    audit_path = root / "pfotentechnik-product-design-system-2.1-7.1-audit.txt"
    audit_path.write_text(
        "\n".join(
            [
                "PfotenTechnik Product Design System 2.1 / 7.1",
                "================================================",
                "",
                f"Produktseite: {product_page.relative_to(root)}",
                f"Design-CSS: {css_path.relative_to(root)}",
                f"Produktseiten-Markierung oder Status-Cleanup ergänzt: {'ja' if page_changed else 'bereits vorhanden'}",
                "",
                "Neue Korrekturen:",
                "- mobile Produktinhalte auf einer gemeinsamen linken Achse",
                "- persistierende Desktop-Spalten auf Mobile entfernt",
                "- Editorial Review vollständig aus der sichtbaren UI entfernt",
                "- Hero, Summary und Galerie in Dark Mode vereinheitlicht",
                "- Galerie-Stage auf 16:10 verkürzt",
                "- Breadcrumb-/Hero-Abstand reduziert",
                "- Sticky CTA zentriert und Safe-Area-fähig",
                "- Chips, Fokuszustände und mobile Überschriften verbessert",
                "",
                "Bereits enthalten:",
                "- Eignung / weniger geeignet",
                "- Vorteile / Nachteile",
                "- redaktionelle Empfehlung",
                "- technische Daten",
                "- Alternativen",
                "- FAQ",
                "- Score, Galerie und Sticky CTA",
                "- Light und Dark Mode",
                "",
                "Dateien mit Statusbezug:",
                *(
                    [f"- {item}" for item in status_sources]
                    if status_sources
                    else ["- keine weiteren Statusquellen gefunden"]
                ),
                "",
            ]
        ),
        encoding="utf-8",
    )

    print("Product Design System 2.1 / 7.1 wurde angewendet.")
    print("")
    print("Korrigiert:")
    print("  - Inhalt auf Mobile nicht mehr nach rechts versetzt")
    print("  - Editorial Review wird nicht mehr angezeigt")
    print("  - Hero und Galerie sind Dark-Mode-fähig")
    print("  - weniger Galerie-Leerraum")
    print("  - bessere Breadcrumb-, Karten- und CTA-Abstände")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-product-design-system-2.1-7.1.patch")
    print("  pfotentechnik-product-design-system-2.1-7.1-audit.txt")
    print("")
    print("Jetzt prüfen:")
    print("  git diff --check")
    print("  npm run build:pfotentechnik")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

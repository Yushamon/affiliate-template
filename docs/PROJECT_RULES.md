# Projektregeln

## Multi-Projekt

Die Plattform muss mehrere Affiliate-Projekte unterstützen.

Ein Projekt kann mehrere Produktkategorien besitzen.

Beispiel

Pet Tech

• Tracker
• Futterautomaten
• Trinkbrunnen
• Versicherungen

---

## Content

Markdown enthält niemals

✓

❌

⚠️

👉

Icons.

Darstellung übernimmt immer der Renderer.

---

## Bilder

Standardbilder kommen aus projectImages.

Markdown überschreibt nur bei Bedarf.

---

## Renderer

Renderer steuert

HTML

Icons

Bilder

Abstände

Tabellen

Nicht Markdown.

---

## SEO

SEO-Titel

↓

seoOverrides

↓

Frontmatter

↓

Fallback

---

Nach jedem Sprint

npm run build

muss erfolgreich laufen.
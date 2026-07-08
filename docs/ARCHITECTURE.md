# Affiliate Platform Architecture

## Ziel

Diese Plattform dient als wiederverwendbarer Core für mehrere Affiliate-Projekte.

Ein Projekt kann beliebig viele Kategorien enthalten.

Beispiele

• Balkonspeicher
• Pet Tech
• Smart Home
• Camping
• Werkzeug

---

## Core

src/core

Enthält ausschließlich generische Komponenten.

Keine projektspezifische Logik.

---

## Projekte

src/projects/<projekt>

Jedes Projekt besitzt eigene

• Produkte
• SEO
• Bilder
• Journey
• Content

---

## Regeln

Core darf niemals Begriffe wie

• Balkonspeicher
• Hund
• Katze

enthalten.

Nur projectConfig darf projektspezifisch sein.
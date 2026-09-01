# Structured-data Audit

Die bestehende Schema-Implementierung wurde gegen den frischen Build geprüft. Es wurden keine neuen Schema-Typen ergänzt.

| Page type | Bestehender Vertrag | Status |
|---|---|---|
| Product (101) | Organization, WebPage, BreadcrumbList, Product; bei vorhandener Bewertungsgrundlage Review/Rating | PASS |
| Comparison (28) | Organization, WebPage, BreadcrumbList, FAQPage, ItemList; direkte, stabile ListItem-URLs | PASS |
| Guide | Organization, Article, ImageObject, BreadcrumbList, bei FAQ FAQPage | PASS |
| Manufacturer | Organization, Article, ImageObject, BreadcrumbList, bei FAQ FAQPage | PASS |
| Homepage | Organization, WebSite | PASS |

`audit:technical-seo` bestätigt parsebares JSON-LD an repräsentativen Guide-, Comparison-, Product- und Manufacturer-Routen. `audit:comparison-schema` bestätigt 28/28 Comparison-ItemLists ohne unvollständige Product-Snippets. Die automatische Finalistenselektion verändert nur Darstellung, Reihenfolge und begründete Auswahl im View Model; URL, Canonical, H1, Breadcrumb und Indexability sind davon unabhängig.

Keine Review- oder AggregateRating-Aussage wurde für diese Baseline synthetisch erzeugt.

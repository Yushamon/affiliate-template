# Topical Authority Center Hotfix 1.0.1

Behebt den Astro-Compilerfehler:

```text
Invalid Unicode escape sequence
```

Ursache: Der Installer 1.0.0 schrieb zwei Template-Literal-Backticks als `\`` in
`src/pages/admin/seo/topical-authority.astro`.

## Installation

ZIP im Root von `affiliate-template` entpacken und ausführen:

```bash
node 3/install-topical-authority-center-hotfix-1.0.1.mjs
```

Danach:

```bash
npm --workspace apps/pfotentechnik run build
```

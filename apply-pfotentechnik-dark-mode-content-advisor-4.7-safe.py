#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import subprocess, sys

FILES = [
    Path("apps/pfotentechnik/src/components/AutoContentBlocks.astro"),
    Path("apps/pfotentechnik/src/components/advisor/FeederAdvisor.astro"),
]
MARKER = "pfotentechnik-dark-mode-content-advisor-4.7"
AUTO_CSS = '\n  /* pfotentechnik-dark-mode-content-advisor-4.7 */\n  :global(html[data-theme="dark"]) .cp-auto-block,\n  :global(html.dark) .cp-auto-block { color: #f8fafc; }\n\n  :global(html[data-theme="dark"]) .cp-auto-summary,\n  :global(html[data-theme="dark"]) .cp-auto-list,\n  :global(html.dark) .cp-auto-summary,\n  :global(html.dark) .cp-auto-list {\n    border-color: rgba(148, 163, 184, .24);\n    background: #132238;\n    box-shadow: 0 18px 42px rgba(0, 0, 0, .16);\n  }\n\n  :global(html[data-theme="dark"]) .cp-auto-block h2,\n  :global(html[data-theme="dark"]) .cp-auto-block h3,\n  :global(html[data-theme="dark"]) .cp-auto-block li,\n  :global(html.dark) .cp-auto-block h2,\n  :global(html.dark) .cp-auto-block h3,\n  :global(html.dark) .cp-auto-block li { color: #f8fafc; }\n\n  :global(html[data-theme="dark"]) .cp-auto-block > header > span,\n  :global(html.dark) .cp-auto-block > header > span { color: #72e6a6; }\n\n  :global(html[data-theme="dark"]) .cp-auto-block header p,\n  :global(html.dark) .cp-auto-block header p { color: #cbd5e1; }\n\n  :global(html[data-theme="dark"]) .cp-product-card,\n  :global(html[data-theme="dark"]) .cp-fit-grid article,\n  :global(html.dark) .cp-product-card,\n  :global(html.dark) .cp-fit-grid article {\n    border-color: rgba(148, 163, 184, .24);\n    color: #f8fafc;\n    background: #132238;\n  }\n\n  :global(html[data-theme="dark"]) .cp-table-wrap,\n  :global(html.dark) .cp-table-wrap { border-color: rgba(148, 163, 184, .24); }\n\n  :global(html[data-theme="dark"]) .cp-table-wrap table,\n  :global(html.dark) .cp-table-wrap table { color: #e5edf6; background: #132238; }\n\n  :global(html[data-theme="dark"]) .cp-table-wrap thead th,\n  :global(html.dark) .cp-table-wrap thead th { color: #cbd5e1; background: #1a2b43; }\n\n  @media (prefers-color-scheme: dark) {\n    :global(html:not([data-theme="light"])) .cp-auto-block { color: #f8fafc; }\n    :global(html:not([data-theme="light"])) .cp-auto-summary,\n    :global(html:not([data-theme="light"])) .cp-auto-list {\n      border-color: rgba(148, 163, 184, .24);\n      background: #132238;\n    }\n    :global(html:not([data-theme="light"])) .cp-auto-block h2,\n    :global(html:not([data-theme="light"])) .cp-auto-block h3,\n    :global(html:not([data-theme="light"])) .cp-auto-block li { color: #f8fafc; }\n    :global(html:not([data-theme="light"])) .cp-auto-block > header > span { color: #72e6a6; }\n    :global(html:not([data-theme="light"])) .cp-product-card,\n    :global(html:not([data-theme="light"])) .cp-fit-grid article {\n      border-color: rgba(148, 163, 184, .24);\n      color: #f8fafc;\n      background: #132238;\n    }\n  }\n'
ADVISOR_CSS = '\n/* pfotentechnik-dark-mode-content-advisor-4.7 */\n:global(html[data-theme="dark"]) .pt-advisor,\n:global(html.dark) .pt-advisor {\n  border-color: rgba(148, 163, 184, .24);\n  color: #f8fafc;\n  background: linear-gradient(145deg, #132238, #0f1d30);\n}\n\n:global(html[data-theme="dark"]) .pt-advisor h2,\n:global(html[data-theme="dark"]) .pt-advisor legend,\n:global(html[data-theme="dark"]) .pt-advisor__result h3,\n:global(html.dark) .pt-advisor h2,\n:global(html.dark) .pt-advisor legend,\n:global(html.dark) .pt-advisor__result h3 { color: #f8fafc; }\n\n:global(html[data-theme="dark"]) .pt-advisor__intro p,\n:global(html[data-theme="dark"]) .pt-advisor label,\n:global(html[data-theme="dark"]) .pt-advisor__result p,\n:global(html[data-theme="dark"]) .pt-advisor__result li,\n:global(html.dark) .pt-advisor__intro p,\n:global(html.dark) .pt-advisor label,\n:global(html.dark) .pt-advisor__result p,\n:global(html.dark) .pt-advisor__result li { color: #d6e0ea; }\n\n:global(html[data-theme="dark"]) .pt-advisor__eyebrow,\n:global(html[data-theme="dark"]) .pt-advisor__result-label,\n:global(html.dark) .pt-advisor__eyebrow,\n:global(html.dark) .pt-advisor__result-label { color: #72e6a6; }\n\n:global(html[data-theme="dark"]) .pt-advisor fieldset,\n:global(html.dark) .pt-advisor fieldset {\n  border-color: rgba(148, 163, 184, .24);\n  background: #17273d;\n}\n\n:global(html[data-theme="dark"]) .pt-advisor input,\n:global(html.dark) .pt-advisor input { accent-color: #39c978; }\n\n:global(html[data-theme="dark"]) .pt-advisor__result,\n:global(html.dark) .pt-advisor__result {\n  border-color: rgba(114, 230, 166, .32);\n  background: #17273d;\n}\n\n:global(html[data-theme="dark"]) .pt-advisor .pt-advisor__reset,\n:global(html.dark) .pt-advisor .pt-advisor__reset {\n  color: #e5edf6;\n  background: #22334b;\n}\n\n@media (prefers-color-scheme: dark) {\n  :global(html:not([data-theme="light"])) .pt-advisor {\n    border-color: rgba(148, 163, 184, .24);\n    color: #f8fafc;\n    background: linear-gradient(145deg, #132238, #0f1d30);\n  }\n  :global(html:not([data-theme="light"])) .pt-advisor h2,\n  :global(html:not([data-theme="light"])) .pt-advisor legend,\n  :global(html:not([data-theme="light"])) .pt-advisor__result h3 { color: #f8fafc; }\n  :global(html:not([data-theme="light"])) .pt-advisor__intro p,\n  :global(html:not([data-theme="light"])) .pt-advisor label,\n  :global(html:not([data-theme="light"])) .pt-advisor__result p,\n  :global(html:not([data-theme="light"])) .pt-advisor__result li { color: #d6e0ea; }\n  :global(html:not([data-theme="light"])) .pt-advisor fieldset {\n    border-color: rgba(148, 163, 184, .24);\n    background: #17273d;\n  }\n  :global(html:not([data-theme="light"])) .pt-advisor__result {\n    border-color: rgba(114, 230, 166, .32);\n    background: #17273d;\n  }\n}\n'

def fail(msg):
    print("FEHLER:", msg, file=sys.stderr)
    raise SystemExit(1)

def root_from(start):
    for p in (start, *start.parents):
        if (p / "apps/pfotentechnik/package.json").is_file():
            return p
    fail("Repository-Root nicht gefunden.")

def inject(text, css):
    pos = text.rfind("</style>")
    if pos < 0:
        fail("Schließendes </style> fehlt.")
    return text[:pos].rstrip() + "\n\n" + css.strip() + "\n" + text[pos:]

root = root_from(Path.cwd().resolve())
for f in FILES:
    if not (root / f).is_file():
        fail(f"Datei fehlt: {f}")

original = {f: (root / f).read_text(encoding="utf-8") for f in FILES}
if any(MARKER in value for value in original.values()):
    fail("Patch 4.7 scheint bereits installiert zu sein.")

updated = {
    FILES[0]: inject(original[FILES[0]], AUTO_CSS),
    FILES[1]: inject(original[FILES[1]], ADVISOR_CSS),
}

stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".dark-mode-content-advisor-4.7-backup-{stamp}"
for f, content in original.items():
    dest = backup / f
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding="utf-8")

try:
    for f, content in updated.items():
        (root / f).write_text(content, encoding="utf-8")
    result = subprocess.run(["npm", "run", "build:pfotentechnik"], cwd=root)
    if result.returncode:
        raise RuntimeError("Build fehlgeschlagen")
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    for f, content in original.items():
        (root / f).write_text(content, encoding="utf-8")
    raise SystemExit(1)

print("Dark Mode Content & Advisor 4.7 erfolgreich installiert.")
print(f"Backup: {backup}")

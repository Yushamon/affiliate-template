#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte das Skript im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def fix_home_section(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    old_block = (
        '              <div class="home3-rating">\n'
        '                <strong>{toEditorialScore(item.rating, 5)}</strong>\n'
        '                <small>PfotenTechnik-Score</small>\n'
        '              </div>'
    )

    new_block = (
        '              <EditorialScore\n'
        '                value={item.rating}\n'
        '                scale={5}\n'
        '                variant="compact"\n'
        '              />'
    )

    if old_block in text:
        text = text.replace(old_block, new_block, 1)
    elif "toEditorialScore(item.rating, 5)" in text:
        text = re.sub(
            r'<div class="home3-rating">\s*'
            r'<strong>\{toEditorialScore\(item\.rating,\s*5\)\}</strong>\s*'
            r'<small>PfotenTechnik-Score</small>\s*'
            r'</div>',
            new_block,
            text,
            count=1,
            flags=re.DOTALL,
        )

    if text == original:
        if "<EditorialScore" in text and "toEditorialScore(" not in text:
            return False
        raise RuntimeError(
            "Der erwartete defekte Home-Rating-Block wurde nicht gefunden."
        )

    path.write_text(text, encoding="utf-8")
    return True


def scan_undefined_calls(root: Path) -> list[str]:
    findings: list[str] = []

    for base in (
        root / "packages/affiliate-core/src",
        root / "apps/pfotentechnik/src",
    ):
        if not base.exists():
            continue

        for path in base.rglob("*"):
            if path.suffix not in {".astro", ".ts", ".tsx", ".js", ".mjs"}:
                continue

            rel = str(path.relative_to(root))
            if any(
                token in rel
                for token in (
                    "node_modules",
                    "/dist/",
                    ".before-",
                    ".backup",
                    "/backup",
                )
            ):
                continue

            text = path.read_text(encoding="utf-8")
            if "toEditorialScore(" not in text:
                continue

            has_import = bool(
                re.search(
                    r'import\s*\{[^}]*\btoEditorialScore\b[^}]*\}\s*'
                    r'from\s*["\'][^"\']+["\']',
                    text,
                    flags=re.DOTALL,
                )
            )
            defines_function = bool(
                re.search(r'(?:const|function)\s+toEditorialScore\b', text)
            )

            if not has_import and not defines_function:
                findings.append(rel)

    return findings


def main() -> int:
    root = repo_root()
    target = root / "packages/affiliate-core/src/components/home/HomeSection.astro"

    if not target.exists():
        raise RuntimeError("HomeSection.astro wurde nicht gefunden.")

    changed = fix_home_section(target)
    findings = scan_undefined_calls(root)

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

    patch_path = root / "pfotentechnik-home-score-buildfix-4.4.1.patch"
    diff = subprocess.run(
        ["git", "diff", "--binary", "--", str(target.relative_to(root))],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    audit_path = root / "pfotentechnik-home-score-buildfix-4.4.1-audit.txt"
    audit_lines = [
        "PfotenTechnik Home Score Buildfix 4.4.1",
        "======================================",
        "",
        f"HomeSection geändert: {'ja' if changed else 'bereits korrekt'}",
        "",
        "toEditorialScore-Aufrufe ohne Import oder Definition:",
        *([f"- {item}" for item in findings] if findings else ["- Keine gefunden."]),
        "",
    ]
    audit_path.write_text("\n".join(audit_lines), encoding="utf-8")

    print("Home Score Buildfix 4.4.1 wurde angewendet.")
    print("")
    print("Korrigiert:")
    print("  packages/affiliate-core/src/components/home/HomeSection.astro")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-home-score-buildfix-4.4.1.patch")
    print("  pfotentechnik-home-score-buildfix-4.4.1-audit.txt")
    print("")
    print("Jetzt erneut:")
    print("  npm run build:pfotentechnik")

    if findings:
        print("")
        print("Achtung: Im Audit stehen weitere undefinierte Aufrufe.")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

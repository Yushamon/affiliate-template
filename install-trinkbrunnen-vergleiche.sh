#!/usr/bin/env bash
set -euo pipefail

node apps/pfotentechnik/scripts/generate-water-fountain-comparisons.mjs --write "$@"

echo
echo "Vergleichsseiten erzeugt. Jetzt bauen mit:"
echo "rm -rf apps/pfotentechnik/dist apps/pfotentechnik/.astro"
echo "npm run build:pfotentechnik"

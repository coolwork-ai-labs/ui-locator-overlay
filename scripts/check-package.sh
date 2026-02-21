#!/usr/bin/env bash
set -euo pipefail

npm run check
npm run build
npm pack --dry-run >/dev/null

echo "package check passed"

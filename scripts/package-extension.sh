#!/bin/sh
set -eu

PROJECT_DIR=${1:-.}
OUTPUT=${2:-$PROJECT_DIR/ai-claims-extension.zip}
STAGING=$(mktemp -d)
trap 'rm -rf "$STAGING"' EXIT

case "$OUTPUT" in
  /*) ;;
  *) OUTPUT="$(pwd)/$OUTPUT" ;;
esac

mkdir -p "$STAGING/package/data" "$STAGING/package/icons" "$STAGING/package/lib"
cp "$PROJECT_DIR/extension/manifest.json" "$PROJECT_DIR/extension/service-worker.js" "$PROJECT_DIR/extension/sidepanel.css" "$PROJECT_DIR/extension/sidepanel.html" "$PROJECT_DIR/extension/sidepanel.js" "$STAGING/package/"
cp "$PROJECT_DIR/extension/data/analyses.json" "$PROJECT_DIR/extension/data/resolver-config.json" "$STAGING/package/data/"
cp "$PROJECT_DIR/extension/icons/icon-16.png" "$PROJECT_DIR/extension/icons/icon-32.png" "$PROJECT_DIR/extension/icons/icon-48.png" "$PROJECT_DIR/extension/icons/icon-128.png" "$STAGING/package/icons/"
cp "$PROJECT_DIR/extension/lib/analysis-registry.js" "$PROJECT_DIR/extension/lib/analysis-requests.js" "$PROJECT_DIR/extension/lib/analysis-resolver.js" "$PROJECT_DIR/extension/lib/book-identity.js" "$PROJECT_DIR/extension/lib/page-identity.js" "$PROJECT_DIR/extension/lib/source-policy.js" "$PROJECT_DIR/extension/lib/truth-score.js" "$STAGING/package/lib/"
find "$STAGING/package" -type f -exec touch -t 198001010000 {} +

rm -f "$OUTPUT"
(cd "$STAGING/package" && find . -type f -print | LC_ALL=C sort | zip -q -X "$OUTPUT" -@)
printf '%s\n' "$OUTPUT"

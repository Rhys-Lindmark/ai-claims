# AI Claims

[![Extension CI](https://github.com/Rhys-Lindmark/ai-claims/actions/workflows/extension-ci.yml/badge.svg)](https://github.com/Rhys-Lindmark/ai-claims/actions/workflows/extension-ci.yml)

An open-source, page-aware truth layer from Rhys Lindmark's Website Accelerator, published at <https://ai.rhyslindmark.com/claims>.

The north star is a Chrome extension that recognizes YouTube videos, Goodreads books, and ordinary web pages; resolves each page to a shared reviewed analysis; and shows a 0–100 truth score with its denominator, coverage, methodology version, and sources. A score stays hidden until every eligible claim is reviewed and the publication and provenance gates pass.

The current site contains synthetic fixtures that test the review machinery without presenting unreviewed examples as real facts. The first installable extension prototype lives in [`extension/`](./extension/README.md).

## Install the prototype

Download the [`extension-v0.1.3` pre-release](https://github.com/Rhys-Lindmark/ai-claims/releases/tag/extension-v0.1.3), unzip it, and load the folder from `chrome://extensions` with Developer mode enabled. It contains synthetic registry data only; no real-world truth scores ship in this release.

## Validate

```bash
npm run test:extension
npm run package:extension -- ai-claims-extension.zip
npm run build
```

## License

MIT. See [`LICENSE`](./LICENSE).

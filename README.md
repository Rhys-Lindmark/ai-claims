# AI Claims

[![Extension CI](https://github.com/Rhys-Lindmark/ai-claims/actions/workflows/extension-ci.yml/badge.svg)](https://github.com/Rhys-Lindmark/ai-claims/actions/workflows/extension-ci.yml)

An open-source, page-aware truth layer from Rhys Lindmark's Website Accelerator, published at <https://ai.rhyslindmark.com/claims>.

The north star is a Chrome extension that recognizes YouTube videos, Goodreads books, and ordinary web pages; resolves each page to a shared reviewed analysis; and shows a 0–100 truth score with its denominator, coverage, methodology version, and sources. A score stays hidden until every eligible claim is reviewed and the publication and provenance gates pass.

The current site contains synthetic fixtures that test the review machinery without presenting unreviewed examples as real facts. The first installable extension prototype lives in [`extension/`](./extension/README.md).

The public resolver contract is available at [`/claims/api/v1/analyses/resolve?entity_key=…`](https://ai.rhyslindmark.com/claims/api/v1/analyses/resolve?entity_key=web%3Aexample.invalid%2Freviewed-fixture). It is read-only, CORS-enabled, versioned, and still serves synthetic registry data only.

## Install the prototype

Download the [`extension-v0.2.0` pre-release](https://github.com/Rhys-Lindmark/ai-claims/releases/tag/extension-v0.2.0), unzip it, and load the folder from `chrome://extensions` with Developer mode enabled. It checks canonical page keys against the public resolver and supports origin-scoped automatic toolbar badges; only synthetic reviewed fixtures are currently published.

## Validate

```bash
npm run test:extension
npm run package:extension -- ai-claims-extension.zip
npm run build
```

## License

MIT. See [`LICENSE`](./LICENSE).

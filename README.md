# AI Claims

[![Extension CI](https://github.com/Rhys-Lindmark/ai-claims/actions/workflows/extension-ci.yml/badge.svg)](https://github.com/Rhys-Lindmark/ai-claims/actions/workflows/extension-ci.yml)

An open-source, page-aware truth layer from Rhys Lindmark's Website Accelerator, published at <https://ai.rhyslindmark.com/claims>.

The north star is a Chrome extension that recognizes YouTube videos, Goodreads books, and ordinary web pages; resolves each page to a shared reviewed analysis; and shows a 0–100 truth score with its denominator, coverage, methodology version, and sources. A score stays hidden until every eligible claim is reviewed and the publication and provenance gates pass.

The current site contains synthetic fixtures that test the review machinery without presenting unreviewed examples as real facts. The first installable extension prototype lives in [`extension/`](./extension/README.md).

The public resolver contract is available at [`/claims/api/v1/analyses/resolve?entity_key=…`](https://ai.rhyslindmark.com/claims/api/v1/analyses/resolve?entity_key=web%3Aexample.invalid%2Freviewed-fixture), with an entity-scoped correction feed at [`/claims/api/v1/analyses/corrections?entity_key=…`](https://ai.rhyslindmark.com/claims/api/v1/analyses/corrections?entity_key=web%3Aexample.invalid%2Freviewed-fixture). Resolver envelopes advertise supported feed contracts, page limits, and the immutable event template so older extensions can suppress incompatible correction links without losing a reviewed score. Correction feeds support `limit` plus an event-ID `cursor`; each event also has an immutable `/corrections/{event_id}?entity_key=…` record. Current pointers and feeds return short-lived ETags for cheap browser revalidation, while version and single-event records are year-cached. The APIs are read-only, CORS-enabled, versioned, and still serve synthetic registry data only.

## Install the prototype

Download the [`extension-v0.2.8` pre-release](https://github.com/Rhys-Lindmark/ai-claims/releases/tag/extension-v0.2.8), unzip it, and load the folder from `chrome://extensions` with Developer mode enabled. It sends a machine-readable correction-feed capability header, negotiates the richest shared contract, gracefully hides incompatible transition details while preserving reviewed scores, and suppresses paused scores; only synthetic reviewed fixtures are currently published.

## Validate

```bash
npm run test:extension
npm run package:extension -- ai-claims-extension.zip
npm run build
```

## License

MIT. See [`LICENSE`](./LICENSE).

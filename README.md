# AI Claims

[![Extension CI](https://github.com/Rhys-Lindmark/ai-claims/actions/workflows/extension-ci.yml/badge.svg)](https://github.com/Rhys-Lindmark/ai-claims/actions/workflows/extension-ci.yml)

An open-source, page-aware truth layer from Rhys Lindmark's Website Accelerator, published at <https://ai.rhyslindmark.com/claims>.

The north star is a Chrome extension that recognizes YouTube videos, Goodreads books, and ordinary web pages; resolves each page to a shared reviewed analysis; and shows a 0–100 truth score with its denominator, coverage, methodology version, and sources. A score stays hidden until every eligible claim is reviewed and the publication and provenance gates pass.

The current site contains synthetic fixtures that test the review machinery without presenting unreviewed examples as real facts. The first installable extension prototype lives in [`extension/`](./extension/README.md).

The public resolver contract is available at [`/claims/api/v1/analyses/resolve?entity_key=…`](https://ai.rhyslindmark.com/claims/api/v1/analyses/resolve?entity_key=web%3Aexample.invalid%2Freviewed-fixture), with an entity-scoped correction feed at [`/claims/api/v1/analyses/corrections?entity_key=…`](https://ai.rhyslindmark.com/claims/api/v1/analyses/corrections?entity_key=web%3Aexample.invalid%2Freviewed-fixture). Resolver envelopes advertise supported feed contracts, page limits, and the immutable event template so older extensions can suppress incompatible correction links without losing a reviewed score. Correction feeds support `limit` plus an event-ID `cursor`; each event also has an immutable `/corrections/{event_id}?entity_key=…` record. Current pointers and feeds return short-lived ETags for cheap browser revalidation, while version and single-event records are year-cached. The APIs are read-only, CORS-enabled, versioned, and still serve synthetic registry data only.

## Install the prototype

Download the current extension release from the release card on `/claims`, unzip it, and load the folder from `chrome://extensions` with Developer mode enabled. Unknown pages use the shared [analysis-request API](./docs/ANALYSIS_REQUEST_API.md) when available, with canonical D1 deduplication and a visibly device-only fallback during service failure; neither path accepts page text, titles, cookies, account data, ratings, or reviews. Only synthetic reviewed fixtures are currently published.

The public Claims page includes an open-source architecture map linking each extension boundary—detection, canonicalization, resolution, publication gate, and badge/evidence output—to its implementation and privacy rule.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the credential-free setup, privacy invariants, required checks, and safe first-issue workflow.

Open the [synthetic YouTube pipeline](https://ai.rhyslindmark.com/claims/episode?entity_key=youtube%3Aai-claims-synthetic-001), or verify its deployed resolver-to-route contract with `npm run test:deployed-youtube`.

Open the [synthetic Goodreads pipeline](https://ai.rhyslindmark.com/claims/book?entity_key=goodreads%3A999999999999), or verify its deployed resolver-to-route contract with `npm run test:deployed-goodreads`.

Open the [synthetic generic-web pipeline](https://ai.rhyslindmark.com/claims/web?entity_key=web%3Aexample.invalid%2Fai-claims-synthetic-page), or verify its deployed resolver-to-route contract with `npm run test:deployed-web`.

## Validate

```bash
npm run test:extension
npm run package:extension -- ai-claims-extension.zip
npm run build
```

## License

MIT. See [`LICENSE`](./LICENSE).

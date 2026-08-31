# Contributing to AI Claims

AI Claims is an open-source page truth layer: recognize a page, resolve its canonical identity, and show a score only when a complete reviewed analysis has a traceable evidence trail.

## Start locally

Requirements: Node.js 22.13 or newer, npm, and Chrome for manual extension testing.

```sh
git clone https://github.com/Rhys-Lindmark/ai-claims.git
cd ai-claims
npm ci
npm run test:extension
npm run build
```

No production credentials are required. Tests use synthetic fixtures. To try the extension, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `extension/`.

## Invariants every change must preserve

1. No reviewed evidence means no score. Partial, paused, malformed, or unresolved analyses must never expose a number.
2. Canonical-key lookup is the network boundary. Do not transmit page text, title, cookies, account data, browsing history, transcripts, or form contents.
3. Source acquisition must be authorized. Do not add transcript or Goodreads scraping paths.
4. Local history and metrics must remain identity-free. Do not retain URLs, titles, entity keys, scores, or user identifiers in those stores.
5. Every displayed score must link to a versioned evidence trail and disclose its denominator and methodology.

The machine-readable boundary map is [`extension/data/architecture.json`](extension/data/architecture.json), and privacy behavior is documented in [`docs/PRIVACY.md`](docs/PRIVACY.md).

## Safe first-issue workflow

1. Pick one bounded behavior and add or adjust its contract test in `extension/test/extension.test.js`.
2. Reuse the modules named in the architecture manifest; avoid parallel identity or score logic in UI code.
3. Run `npm run test:extension`, `npm run test:methods`, and `npm run build`.
4. If packaging changes, run `npm run package:extension` twice and confirm the ZIP hashes match.
5. In the pull request, state which invariant is affected, what data crosses a boundary, and what evidence proves the score gate still holds.

Good first contributions include new synthetic URL variants, accessibility improvements to no-score states, clearer evidence-link copy, and tests for malformed or unsupported resolver responses. Real-person verdicts, new acquisition methods, and production data ingestion require a separate source-policy review.

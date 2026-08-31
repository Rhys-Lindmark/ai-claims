## Outcome

What user-visible or contract-level behavior changes?

## Architecture boundary

- [ ] Detect
- [ ] Canonicalize
- [ ] Resolve
- [ ] Gate
- [ ] Show
- [ ] No boundary changes

Implementation file(s) from `extension/data/architecture.json`:

## Data movement and privacy

What data is read, retained, or transmitted? State “none” for each category that does not change. Confirm whether any URL, title, entity key, page text, score, account data, or user identifier crosses a new boundary.

## Source policy

Does this change transcript, Goodreads, or other source acquisition? If yes, link the policy review. Scraping-shaped defaults are not accepted.

## Publication gate evidence

Explain why partial, paused, malformed, or unresolved analyses still cannot expose a score.

## Validation

- [ ] `npm run test:extension`
- [ ] `npm run test:methods`
- [ ] `npm run build`
- [ ] Packaging changed: two `npm run package:extension` outputs have matching SHA-256 hashes

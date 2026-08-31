# AI Claims Chrome extension prototype

This Manifest V3 prototype opens AI Claims beside the current page. It recognizes YouTube videos, Goodreads books, and canonical web URLs, checks that canonical identity against the public read-only analysis resolver, and links published entries to their full evidence trail. When the resolver advertises a supported privacy-safe deployment attestation, the panel also links the exact immutable production proof and shows when it was verified.

Resolver records carry an immutable current version, superseded-version lineage, and `active`, `paused`, or `draft` publication state. A paused version may retain its prior numeric result in the audit record, but the extension suppresses that number until a new active version is published.

The panel's **Show scores as I browse this site** control grants an optional permission and saves an explicit local opt-in for that origin. Both must remain present. The same control becomes **Stop checking this site**, which removes the local opt-in and optional permission. On opted-in sites, the toolbar badge shows a number only for a complete published review, `?` for an unknown page, and nothing when review state is incomplete or the resolver is unavailable.

## Try it

From a fresh clone with Node 22.13 or newer, run `npm ci && npm run test:extension`. No production credentials are required; tests use synthetic fixtures. `npm run package:extension` creates a deterministic `ai-claims-extension.zip` for inspection or distribution.

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `extension` directory.
4. Pin **AI Claims — page truth layer**, visit a page, and click the extension icon.

The side panel requests temporary `activeTab` access only after that click. **Always check this site** grants optional access to that one origin; the prototype does not ask for blanket browsing access at installation.

## Score contract

A 0–100 score appears only when an analysis is `published`, every eligible claim is reviewed, no reviewed claims remain unresolved, and both publication and provenance gates pass. Otherwise the panel shows **Not analyzed yet** or **Score pending** with a reason.

The open scoring contract is documented in [`docs/TRUTH_SCORE_METHOD.md`](../docs/TRUTH_SCORE_METHOD.md). Method `equal-claim-truth-credit@0.1.0` gives each eligible canonical claim equal weight and maps five reviewed verdicts to 1, .75, .5, .25, or 0 credit.

`data/analyses.json` contains synthetic development fixtures only. `data/resolver-config.json` selects the public API adapter by default; changing it to `local` keeps development fully offline without changing the panel or score gate. The public `GET https://ai.rhyslindmark.com/claims/api/v1/analyses/resolve?entity_key=…` contract returns 404 for unknown entities.

On an unknown page, **Request analysis** creates one browser-local request per canonical entity. Repeated visits reuse that record across the `queued → in_review → published` lifecycle, with `failed → queued` as the only retry path. Requests are not yet synchronized to a server.

YouTube detection never triggers transcript scraping. Creator-authorized API access, a licensed publisher source, or a rights-confirmed supplied transcript is required under the [transcript acquisition decision](../docs/YOUTUBE_TRANSCRIPT_ACQUISITION.md).

Goodreads detection uses only the numeric page ID. Book identity comes from the reviewed registry, a supplied ISBN, or permitted publisher/library metadata under the [Goodreads source decision](../docs/GOODREADS_SOURCE_POLICY.md); ratings, reviews, and page metadata are not scraped.

Local product metrics retain only event type, timestamp, and coarse page kind for up to 30 days/500 events. They never store page identity and never leave `chrome.storage.local`.

## Architecture

- `lib/page-identity.js` canonicalizes YouTube, Goodreads, and ordinary page URLs.
- `lib/analysis-registry.js` applies the score publication gate.
- `lib/analysis-resolver.js` provides interchangeable local and read-only API adapters under contract `1.0.0`.
- `lib/action-badge.js` converts only publication-safe score states into toolbar badges.
- `lib/origin-opt-in.js` keeps automatic checking behind a separate, browser-local consent record.
- `lib/analysis-requests.js` provides idempotent request records and guarded lifecycle transitions.
- `lib/truth-score.js` computes the gated, versioned 0–100 score.
- `lib/source-policy.js` blocks undocumented YouTube transcript acquisition paths.
- `lib/local-metrics.js` provides identity-free local event counts and retention limits.
- `sidepanel.*` renders the page identity, score state, coverage, and evidence link.
- `service-worker.js` makes the toolbar action open the Chrome side panel.

All extension JavaScript is packaged locally. No remotely hosted code is executed.

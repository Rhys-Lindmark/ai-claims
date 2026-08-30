# AI Claims Chrome extension prototype

This Manifest V3 prototype opens AI Claims beside the current page. It recognizes YouTube videos, Goodreads books, and canonical web URLs, then resolves that identity against a local analysis registry.

## Try it

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `extension` directory.
4. Pin **AI Claims — page truth layer**, visit a page, and click the extension icon.

The side panel requests temporary `activeTab` access only after that click. **Always check this site** grants optional access to that one origin; the prototype does not ask for blanket browsing access at installation.

## Score contract

A 0–100 score appears only when an analysis is `published`, every eligible claim is reviewed, no reviewed claims remain unresolved, and both publication and provenance gates pass. Otherwise the panel shows **Not analyzed yet** or **Score pending** with a reason.

`data/analyses.json` contains synthetic development fixtures only. `data/resolver-config.json` selects the local adapter today; changing it to `api` switches to the versioned read-only `GET /v1/analyses/resolve?entity_key=…` contract without changing the panel or score gate.

## Architecture

- `lib/page-identity.js` canonicalizes YouTube, Goodreads, and ordinary page URLs.
- `lib/analysis-registry.js` applies the score publication gate.
- `lib/analysis-resolver.js` provides interchangeable local and read-only API adapters under contract `1.0.0`.
- `sidepanel.*` renders the page identity, score state, coverage, and evidence link.
- `service-worker.js` makes the toolbar action open the Chrome side panel.

All extension JavaScript is packaged locally. No remotely hosted code is executed.

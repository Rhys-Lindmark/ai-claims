# AI Claims extension privacy

## Prototype behavior

Version 0.2 reads the active tab's URL and title only after the user clicks the extension. It canonicalizes the page locally and sends only that canonical entity key—for example, a YouTube video ID, Goodreads numeric page ID, or normalized web URL key—to the read-only AI Claims resolver at `ai.rhyslindmark.com`. It does not send the page title, page text, cookies, account data, browsing history, transcripts, ISBNs, claims, or form contents. The resolver does not write lookups to application storage; the hosting provider may retain standard request logs.

The optional **Show scores as I browse this site** control grants access only to the current origin and records that explicit opt-in in `chrome.storage.local`. Both the saved opt-in and Chrome permission must be present before navigation triggers a canonical-key lookup. The control then becomes **Stop checking this site**, which deletes the local opt-in, removes the optional permission when Chrome allows it, and clears the badge; access can also be revoked in Chrome's extension site-access settings.

The optional **Always check this site** action requests access to the current origin only. Chrome stores that permission; the user can revoke it from the extension's site-access settings.

Analysis requests and their lifecycle state are stored in `chrome.storage.local` on the user's device. Uninstalling the extension removes that local data.

The prototype also stores up to 500 coarse product events for 30 days in `chrome.storage.local`: page checked, score published/pending, and analysis requested, plus page kind (`youtube`, `goodreads`, or `web`). These events contain no URL, title, page/entity ID, transcript, ISBN, claim, or user identifier and are never transmitted. The panel shows the user's own seven-day check count.

The public site's resolver probe stores its last five result categories in that browser's `localStorage`. Each entry contains only page kind and outcome. It does not store the submitted URL, title, canonical entity key, page text, score, or user identifier, and it does not transmit this history. The probe can clear this history or export a schema-versioned privacy receipt containing only those same categories.

## Before analysis requests synchronize

Any release that transmits page content or an analysis-request record must update this notice before release, name the receiving service and retention period, minimize transmitted fields, provide deletion controls, and pass the release privacy review.

Security reports should follow [`SECURITY.md`](../SECURITY.md).

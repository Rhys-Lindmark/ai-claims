# AI Claims extension privacy

## Prototype behavior

Version 0.1 reads the active tab's URL and title only after the user clicks the extension. It canonicalizes that page identity locally and looks it up in a packaged synthetic registry. It does not read page text, cookies, account data, browsing history, transcripts, or form contents. It does not send page data or analysis requests to a server.

The optional **Always check this site** action requests access to the current origin only. Chrome stores that permission; the user can revoke it from the extension's site-access settings.

Analysis requests and their lifecycle state are stored in `chrome.storage.local` on the user's device. Uninstalling the extension removes that local data.

The prototype also stores up to 500 coarse product events for 30 days in `chrome.storage.local`: page checked, score published/pending, and analysis requested, plus page kind (`youtube`, `goodreads`, or `web`). These events contain no URL, title, page/entity ID, transcript, ISBN, claim, or user identifier and are never transmitted. The panel shows the user's own seven-day check count.

## Before networked analysis ships

Any release that transmits a canonical URL, page content, or request record must update this notice before release, name the receiving service and retention period, minimize transmitted fields, provide deletion controls, and pass the release privacy review.

Security reports should follow [`SECURITY.md`](../SECURITY.md).

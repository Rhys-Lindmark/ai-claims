# YouTube transcript acquisition decision

Last verified: 2026-08-30

## Decision

AI Claims will **not** scrape YouTube pages, call undocumented caption endpoints, download audio/video with unofficial tools, or ingest transcripts from vendors that cannot document a permitted source.

The default public-video state is `permission_required`. A transcript can enter the review pipeline only through one of these routes:

1. **Creator-authorized YouTube API access.** The channel owner or authorized editor grants the documented OAuth scope and has permission to edit the video.
2. **Rights-confirmed direct supply.** A creator, publisher, or user supplies a transcript they have the right to provide and confirms the source, language, caption type, and permitted review use.
3. **Licensed off-platform source.** The podcast publisher exposes a transcript or feed under terms that permit this use; retain its URL, access time, rights basis, and digest.

If none applies, the request remains blocked rather than silently falling back to scraping.

## Why

- YouTube's `captions.list` endpoint requires OAuth authorization and returns track metadata, not the caption text. [Official `captions.list` reference](https://developers.google.com/youtube/v3/docs/captions/list)
- `captions.download` requires authorization and says the user must have permission to edit the video. [Official `captions.download` reference](https://developers.google.com/youtube/v3/docs/captions/download)
- YouTube's developer policies prohibit scraping YouTube applications, using undocumented APIs, and retrieving API data through non-API technology. [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- YouTube itself exposes a visible transcript for videos with captions, but that user feature is not a documented bulk-ingestion API. [YouTube Help: View video transcripts](https://support.google.com/youtube/answer/15930243)

## Product implications

- The extension may detect and canonicalize a YouTube video ID from the current URL, but it must not read or transmit the transcript DOM.
- “Request analysis” records page identity only. It does not imply that a transcript can be retrieved.
- The queue must expose `permission_required`, `rights_required`, `creator_authorized`, `user_supplied`, and `licensed_source` acquisition states.
- Stored transcript provenance must name the acquisition route, supplying party, rights attestation, retrieval time, language, caption type, and content digest.
- Only short source quotations needed to audit individual claims should be published; the full supplied transcript should not become a public download.
- If the product later uses YouTube API metadata, its privacy policy, YouTube attribution, user consent, deletion controls, API project, and audit posture must be reviewed before production.

## Truth-score separation

The AI Claims score is an independent editorial judgment over reviewed claims and external evidence, not a YouTube engagement metric. Any YouTube-sourced metadata must be labeled separately from the score. Before a production API integration, request a YouTube API compliance audit and describe the scoring use case explicitly; current policies put additional conditions on derived metrics and API-data storage. [Additional policies for derived metrics and data storage](https://developers.google.com/youtube/terms/derived-metrics-policy)

This memo is a conservative product decision based on current published platform rules, not legal advice.

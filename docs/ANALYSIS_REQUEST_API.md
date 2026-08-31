# Analysis request API

Contract `1.0.0` moves “analyze this page” from a device-local queue into one canonical, durable request record.

`POST /claims/api/v1/analysis-requests` accepts exactly four fields: `contract_version`, `entity_key`, `canonical_url`, and `page_kind`. The server canonicalizes the URL again, rejects mismatches and extra fields, and uses a unique index on `entity_key`; repeat submissions return the existing record instead of creating duplicate work.

`GET /claims/api/v1/analysis-requests?entity_key=…` resolves a canonical page to its request. `GET /claims/api/v1/analysis-requests/{request_id}` resolves the stable request ID. Both status surfaces are read-only, CORS-enabled, and `no-store` while lifecycle state may change.

The persisted record contains only canonical identity, coarse page kind, lifecycle state, attempt count, and timestamps. Page text, page title, transcript, Goodreads metadata, ratings, reviews, cookies, account data, and browser identity are rejected or never sent. D1 is authoritative; the extension may retain a clearly labeled device-only fallback only during service failure.

Lifecycle states remain `queued`, `in_review`, `published`, and `failed`. Publishing an analysis still requires the separate review and provenance gates; request creation cannot produce or reveal a score.

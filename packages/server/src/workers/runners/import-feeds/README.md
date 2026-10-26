# Background feed imports

`POST /feed/add-many` accepts 1–1,000 HTTP(S) feed URLs, removes duplicate URLs, and returns
HTTP 202 with `{ importId, total }`. It does not fetch any feeds during the request. The
`import-feeds` worker processes one URL per job with concurrency five and three attempts
with 1s and 2s delays for temporary failures. Invalid XML and permanent HTTP errors stop
immediately. Optional favicon failures do not prevent importing a feed.

`GET /feed/imports/:importId` returns progress and per-URL results only to the submitting
user. Progress is stored in Redis for seven days independently of BullMQ job retention.
Redis persistence should be enabled if imports and their results must survive Redis restarts.
The web app polls every two seconds while work remains, refreshes feeds as imports finish,
and stores the current import ID per account in browser storage to resume after reload.
Closing the progress dialog or hiding progress does not cancel queued work.

RSS and favicon requests run before the database transaction. The transaction saves the
feed, newest 200 posts, subscription, and user items together. Retried or concurrent imports
do not duplicate rows, reset read/favorite/bookmark flags, or add extra refresh schedules.
Image scans are deduplicated while pending or active. Queue scheduling happens after the
database commit; retries can safely finish scheduling if Redis was unavailable.

Deploy the API, web app, and worker together. The new asynchronous response replaces the
old synchronous `{ total, success, errors }` response. No database migration is required.

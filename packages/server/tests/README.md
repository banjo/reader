# Feed refresh and external request tests

Run parsing, import-selection, and HTTP request tests from the repository root:

```sh
pnpm exec tsx --test packages/server/tests/parse-feed.test.ts packages/server/tests/external-requests.test.ts
```

The worker tests use PostgreSQL and Redis from `docker/docker-compose.yml`. Point the test
URLs at your local Compose ports; the example below uses the isolated browser-test database
on port 55432:

```sh
TEST_DATABASE_URL='postgresql://banjo:banjo@127.0.0.1:55432/banjo-rss' \
TEST_REDIS_URL='redis://127.0.0.1:6379' \
  pnpm exec tsx --test packages/server/tests/*.test.ts
```

The integration test creates a random PostgreSQL schema and Redis queue prefix, then cleans
them up. It applies the existing migrations to that schema. Without both test URLs, the
worker tests are skipped. The database URL in `.env` is not used.

Coverage includes malformed posts, GUID and title fallbacks, ID-only queue payloads, legacy
jobs, duplicate delivery, subscriber isolation, and HTTP failures. A 5,000-post fixture
checks that the initial import stores the newest 200 posts, the next refresh does not
backfill the skipped history, and new posts are still delivered.

HTTP fixtures cover header/body timeouts, the shared redirect deadline, redirect limits,
declared/streamed/gzip-expanded RSS size limits, HTML truncation, content types, and retry
classification. Request-level and BullMQ retries both use three attempts, with 1s and 2s
delays. Worker calls disable request-level retries to avoid nine attempts per job.

Outbound requests block private addresses by default. `url-safety.test.ts` covers the address
ranges, protocol and port rules, and rejected requests. Fixture-server suites opt in with
`ALLOW_PRIVATE_NETWORK_REQUESTS=true` in the test file.

`cleanup-feeds.test.ts` checks that orphaned feeds are deleted with their content, join rows, and
repeatable refresh job while active and recently orphaned feeds are kept. `rate-limit.test.ts`
checks the Redis window and the test-only disable flag.

Orphan cleanup also keeps feeds with bookmarks or favorites, including a final check inside the
delete transaction. Removing the saved flags makes those feeds eligible for cleanup again.

The integration suite also checks image recovery, retry exhaustion, a real 10-second image
timeout, five concurrent image requests, and retry options on scheduled RSS jobs. Failed
temporary image lookups stay unchecked for the next hourly scan; successful pages without
an image are marked checked. Permanent HTTP/format failures are not retried immediately.
Image URLs must also return an image content type, and the image verifier clears stored URLs
that return HTML, 404, or 410 responses, then leaves them for one retry before marking them
checked. The article refresh test updates a stale post's title, description, and image from
the page metadata and verifies that `lastFetch` moves forward.

`worker-lifecycle.test.ts` checks that a worker factory opens only its queue until `start()`
is called, that repeated starts share one worker, and that closing a queue-only instance
never creates a worker. It also checks that a repeatable job with a slot waits for that slot,
keeps it on every run, and is not added twice when scheduled again after a restart. It needs
Redis but no database.

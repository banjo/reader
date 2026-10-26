# Feed refresh tests

Run parsing and import-selection tests from the repository root:

```sh
pnpm exec tsx --test packages/server/tests/parse-feed.test.ts
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

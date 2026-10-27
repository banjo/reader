# Feed tests

Run from the repository root against a disposable PostgreSQL database:

```sh
TEST_DATABASE_URL='postgresql://localhost:5432/test' \
  pnpm exec tsx --tsconfig apps/api/tsconfig.json --test apps/api/tests/feed.test.ts
```

The tests create an isolated schema, apply the existing migrations, and drop that schema
afterward. Without `TEST_DATABASE_URL`, the database tests are skipped. They do not use the
database URL from `.env`. The feed suite also covers case-insensitive search, its 20-result
cap, the subscribed-feed exclusion, selected fields only, and rejected blank or oversized
queries.

Background imports also use Redis from `docker/docker-compose.yml`. For the isolated local
Compose project used during browser testing:

```sh
TEST_DATABASE_URL='postgresql://banjo:banjo@127.0.0.1:55432/banjo-rss' \
TEST_REDIS_URL='redis://127.0.0.1:6379' \
RATE_LIMIT_DISABLED=true \
  pnpm exec tsx --tsconfig apps/api/tsconfig.json --test apps/api/tests/*.test.ts
```

`RATE_LIMIT_DISABLED=true` keeps the import suite from tripping the per-user import limit. The
rate limiter has its own tests in `packages/server/tests/rate-limit.test.ts`.

The import tests create a random Redis prefix and clean up all test queues and progress
keys. They check immediate HTTP 202 responses with workers offline, five concurrent feeds,
per-user progress access, independent retries, partial failures, duplicate imports, status
preservation, unexpected worker failures, and transaction rollback after a forced item
insert failure. Import results outlive queue job cleanup and expire after seven days.

The sidebar cache and import UI tests need no database:

```sh
pnpm exec tsx --tsconfig apps/web/tsconfig.json --test apps/web/tests/*.test.ts
```

`auth-refresh.test.ts` starts a local HTTP server and checks the API client: one retry with
the refreshed token after a 401, no retry when the refresh fails, no second refresh when the
retry is also rejected, and no refresh on success or server errors.

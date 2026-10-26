# Feed tests

Run from the repository root against a disposable PostgreSQL database:

```sh
TEST_DATABASE_URL='postgresql://localhost:5432/test' \
  pnpm exec tsx --tsconfig apps/api/tsconfig.json --test apps/api/tests/feed.test.ts
```

The tests create an isolated schema, apply the existing migrations, and drop that schema
afterward. Without `TEST_DATABASE_URL`, the database tests are skipped. They do not use the
database URL from `.env`.

The sidebar cache test needs no database:

```sh
pnpm exec tsx --tsconfig apps/web/tsconfig.json --test apps/web/tests/feed-cache.test.ts
```

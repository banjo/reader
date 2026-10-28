<p align="center">
  <img src="apps/web/public/banjoreader.svg" width="96" height="96" alt="Banjo Reader logo">
</p>

<h1 align="center">Banjo Reader</h1>

<p align="center">
  A simple RSS reader. Not much more than that, actually.
</p>

## Highlights

- 📰 Subscribe to a feed by URL, or search the feeds other readers already follow
- 🔄 Feeds refresh in the background every hour, so new posts are waiting when you open the app
- 🕰️ Older posts are rechecked in the background, so edited titles, summaries, and images stay current
- 📥 Bring your subscriptions from another reader with an OPML import
- ⭐️ Favorite and bookmark posts, and find them again in their own lists
- Keep bookmarked and favorite posts when you unsubscribe from a feed
- ✅ Show only unread posts, and mark a whole feed as read in one click
- 🗂️ Switch between a compact list and cards with images
- 🔐 Sign in with Google, and your feeds follow you across devices

## Getting started

You need [Node.js](https://nodejs.org) (see `.nvmrc`), [pnpm](https://pnpm.io), and
[Docker](https://www.docker.com) for Postgres and Redis:

```bash
pnpm install
pnpm db:local:start    # Start Postgres and Redis in Docker.
pnpm dev               # Run the web app, the API, and the worker.
```

The web app runs on [localhost:3005](http://localhost:3005), the API on port 3003, and the
worker on port 3001.

Each app needs a `.env` file. Copy the `.env.example` files in `apps/worker` and `packages/db`,
and add these to the others:

| File            | Variables                                                                  |
| --------------- | -------------------------------------------------------------------------- |
| `apps/web/.env` | `VITE_API_URL` and the `VITE_FIREBASE_*` keys from your Firebase project   |
| `apps/api/.env` | `DATABASE_URL`, the Redis settings, and `FIREBASE_ADMIN_KEY` (base64 JSON) |

To skip Google sign-in while developing, set `LOCAL_DEVELOPMENT=true` and `DEVELOPMENT_UID` in
the API, and `VITE_LOCAL_DEVELOPMENT=true` and `VITE_DEVELOPMENT_UID` in the web app. Every
request then runs as that user.

## Development

```bash
pnpm build                          # Build all apps.
pnpm typecheck                      # Type check everything.
pnpm lint:all                       # Lint everything.
pnpm format                         # Format everything with Prettier.
pnpm db:reset                       # Recreate the database. This removes all data.
pnpm db:local:logs                  # Follow the Postgres and Redis logs.
pnpm --filter db exec prisma studio # Browse the database.
```

To build a single app and the packages it depends on:

```bash
pnpm turbo run build --filter=web...
```

If a build gets stuck on stale output, start over from a clean slate:

```bash
pnpm clean && find . -name '.turbo' | xargs rm -rf
pnpm install && pnpm build
```

The repository is a [pnpm workspace](https://pnpm.io/workspaces) run with
[Turborepo](https://turbo.build):

- `apps/web`: React, Vite, Tailwind, TanStack Query, and Firebase Auth
- `apps/api`: Node.js, Hono, and Zod
- `apps/worker`: BullMQ jobs that fetch feeds and images, with Bull Board at `/ui`
- `packages/db`: Prisma and PostgreSQL
- `packages/server`: Services, repositories, and queues shared by the API and the worker
- `packages/firebase-server`: Firebase Admin, used to verify sign-ins
- `packages/model` and `packages/utils`: Shared types, logging, and helpers

GitHub Actions runs the typecheck, lint, build, and test suites on every push to `main` and on
pull requests. The workflow is in `.github/workflows/ci.yml`.

## Deployment

The API and the worker are deployed to [CapRover](https://caprover.com) with the Dockerfiles in
`docker/`:

```bash
pnpm deploy:api       # Push and deploy the API.
pnpm deploy:worker    # Push and deploy the worker.
pnpm logs:api         # Follow the API logs.
```

In production, logs are sent to [Axiom](https://axiom.co), so the API and the worker also need
`AXIOM_DATASET` and `AXIOM_TOKEN`.

Apply database migrations before deploying a release that adds one:

```bash
DATABASE_URL=... pnpm --filter db db:migrate:prod
```

### Background schedule

Each feed refreshes once an hour at its own fixed minute, so refreshes are spread across the
hour instead of all starting at once. The other scheduled jobs run at fixed times (UTC):

| Job                   | Runs               |
| --------------------- | ------------------ |
| Missing image scan    | Every hour at :30  |
| Article refresh       | Every day at 02:00 |
| Image verification    | Every day at 03:00 |
| Orphaned feed cleanup | Every day at 04:00 |

Restarting the worker does not run these jobs early. They keep their times.

### Article refresh

The worker rechecks older posts once a day. It picks posts that at least one reader has in their
feed and that have not been checked recently, then updates the title, description, and image from
the article's metadata. The original RSS body is kept.

- `REFRESH_ARTICLES_LIMIT` (default `500`) sets how many posts one run may check.
- `REFRESH_ARTICLES_OLDER_THAN_DAYS` (default `30`) sets how old a check must be before a post is
  eligible again.

Permanent failures such as a `404` are marked checked. Temporary failures stay eligible for the
next run.

### Image verification

The worker rechecks a rotating slice of stored images once a day, so it never walks the whole
table or hammers publishers.

- `VERIFY_IMAGES_LIMIT` (default `2000`) sets how many images one run may check.
- `VERIFY_IMAGES_OLDER_THAN_DAYS` (default `14`) sets how old a check must be for an image to be
  eligible again.
- `VERIFY_IMAGES_CONCURRENCY` (default `5`) sets how many image checks run at once.

Broken images are cleared and left for one new lookup by the hourly image scan.

### Orphaned feed cleanup

Unsubscribing removes ordinary posts from that reader's lists, but keeps bookmarks, favorites,
read status, and tags on saved posts. Saved posts remain in All, Read later, and Favorites.
Subscribing again keeps those flags and does not create duplicate items.

When the last reader unsubscribes, feeds without any bookmarked or favorite items are kept for
a grace period and then deleted along with the hourly refresh job. Feeds with saved items are
not deleted. They become eligible for cleanup after those items are no longer saved.

- `CLEANUP_ORPHANED_FEEDS_AFTER_DAYS` (default `30`) sets the grace period.
- `CLEANUP_ORPHANED_FEEDS_LIMIT` (default `100`) sets how many feeds one run may delete.

### Limits and outbound requests

- `MAX_FEEDS_PER_USER` (default `500`) caps how many feeds one account can follow. Set it on both
  the API and the worker, since imports are processed by the worker.
- Feed adds, imports, searches, and item updates are rate limited in Redis. The limits are
  per-user and return HTTP `429` with a `Retry-After` header.
- Outbound requests reject loopback, private, link-local, and metadata addresses, non-HTTP
  protocols, and ports other than `80` and `443`. Redirects are checked again at every hop.
- `ALLOW_PRIVATE_NETWORK_REQUESTS=true` disables that guard. It exists for tests that fetch local
  fixture servers and is ignored when `NODE_ENV=production`.
- `RATE_LIMIT_DISABLED=true` disables rate limiting. It is ignored when `NODE_ENV=production`.

### Health checks

- `GET /health` is a liveness check and only confirms the process is running.
- `GET /health/ready` checks PostgreSQL and Redis, returning `503` when either is unavailable.
- The worker exposes `GET /health` as well.

`.github/workflows/uptime.yml` checks the production web app hourly. Set the repository variable
`API_HEALTH_URL` to also check API readiness. For tighter monitoring, point an external uptime
service at the same URLs.

### Backups

`scripts/backup-db.sh` writes a compressed `pg_dump` and removes old local copies:

```bash
DATABASE_URL=... BACKUP_DIR=/var/backups/banjo ./scripts/backup-db.sh
```

Restore a dump with `pg_restore --clean --if-exists --dbname "$DATABASE_URL" <file>`.

Set `BACKUP_S3_URI` to upload with the AWS CLI as well. A daily cron entry keeps the schedule
outside the application process:

```cron
0 3 * * * DATABASE_URL=... BACKUP_DIR=/var/backups/banjo /path/to/reader/scripts/backup-db.sh
```

`.github/workflows/backup.yml` can also run the backup and store it as a GitHub artifact. It is
disabled until the `PRODUCTION_DATABASE_URL` repository secret is set; the database must be
reachable from GitHub Actions. Artifacts expire, so keep a separate off-site copy for real
disaster recovery.

## License

MIT

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

### Article refresh

The worker rechecks older posts once a day. It picks posts that at least one reader has in their
feed and that have not been checked recently, then updates the title, description, and image from
the article's metadata. The original RSS body is kept.

- `REFRESH_ARTICLES_LIMIT` (default `500`) sets how many posts one run may check.
- `REFRESH_ARTICLES_OLDER_THAN_DAYS` (default `30`) sets how old a check must be before a post is
  eligible again.

Permanent failures such as a `404` are marked checked. Temporary failures stay eligible for the
next run.

## License

MIT

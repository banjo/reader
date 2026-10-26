# Fix list

From a code review in October 2026. Fix these in order. The first three steps fix most of the
slowness with large feeds. Steps 1 to 3 should go in one release, because step 2 changes how
inserts behave.

## 1. Users can change other users' items

Two endpoints trust any item id from any signed-in user.

- `PUT /item/:id` (`apps/api/src/routes/item/routes.ts`) doesn't check who owns the item. It
  also takes the raw JSON body and spreads it into `prisma.item.update`
  (`ItemRepository.updateItem`), so a user can change `userId`, `feedId`, or `contentId`.
  It ignores the `:id` in the URL and uses `body.id` instead.
- `POST /items/read` (`apps/api/src/routes/items/routes.ts`) marks any ids as read
  (`ItemRepository.markItemsAsRead`).

**Fix**

- [x] Validate the `PUT` body with Zod and only allow `isRead`, `isBookmarked`, and
      `isFavorite`. Use the id from the URL.
- [x] Update with `prisma.item.updateMany({ where: { id, userId }, data })`. If `count` is 0,
      return 404.
- [x] In `markItemsAsRead`, add `userId` to the `where`, and cap the `ids` array (for example
      at 500) in the Zod schema.

## 2. Add database indexes and unique constraints

The schema uses `relationMode = "prisma"`. In that mode, Prisma creates no foreign keys and no
indexes on relation fields. So `Item.userId`, `Item.feedId`, `Item.contentId`, and
`ItemContent.feedId` have no indexes. Every item list, count, mark-all-as-read, and
unsubscribe reads the whole table, and it gets slower as more feeds are added.

There are also no unique constraints on items or posts, so `skipDuplicates: true` in
`createMany` does nothing. Concurrent jobs, or a feed that repeats a link, create duplicate
rows.

**Fix**

- [x] In `packages/db/prisma/schema.prisma`, add:

    ```prisma
    model Item {
      // ...
      @@unique([userId, contentId])
      @@index([userId, feedId])
      @@index([feedId])
      @@index([contentId])
    }

    model ItemContent {
      // ...
      @@unique([feedId, link])
      @@index([hasFetchedImage, id])
    }

    model Tag {
      // ...
      @@index([userId])
    }
    ```

- [x] Before the migration, remove existing duplicates or it will fail. Delete duplicate
      `Item` rows by `(userId, contentId)`, keeping the lowest `id`. For duplicate
      `ItemContent` rows by `(feedId, link)`, keep the lowest `id`, point their items at it
      (or delete those items), then delete the rest. Write this as SQL at the top of the
      migration file.
- [x] Update the count checks in `ItemRepository.createContent` and
      `createItemsFromContent`. They return an error when `count !== length`. With unique
      constraints, skipped duplicates are expected, so drop the check or only log it.
- [x] In `createContent`, look up the new rows with `feedId` and `link in [...]`. Leave out
      `title in [...]`, since two separate `in` filters can match rows you didn't create.

## 3. Stop loading every item to count or look up a feed

Several queries load all items, with the full post HTML, when they only need a number or an
id.

**The side menu loads everything.** `GET /feed` (`apps/api/src/routes/feed/routes.ts`, via
`FeedRepository.getAllFeedsByUserId`) loads every item of every feed you follow, with
content, then counts them in JavaScript. The web app runs it often:

- The query key is `["items", "feed", "all"]`
  (`apps/web/src/components/nav/sidemenu/side-menu-container.tsx`). Every favorite, bookmark,
  or read mutation refreshes all `["items"]` queries, so this runs again each time.
- React Query refetches it whenever the browser tab regains focus.

**Feed counts are wrong.** `FeedRepository.getFeedItemsCount` doesn't filter by user, so a
feed's page total includes every user who follows it. It also loads the rows only to call
`.length`.

**Subscribing loads every user's items.** For a feed that already exists, `addFeed` calls
`getFeedByRssUrl`, and `addFeedToUser` returns the feed too. Both load all items of all users,
with content, and only the id is used. `assignFeedItemsToUser` then loads every post with
content just to read their ids.

**Fix**

- [ ] Replace the `GET /feed` counting with one grouped query:

    ```sql
    select "feedId",
           count(*)                                              as total,
           count(*) filter (where not "isRead")                  as unread,
           count(*) filter (where "isBookmarked" and not "isRead") as "bookmarkedUnread",
           count(*) filter (where "isFavorite" and not "isRead")   as "favoriteUnread"
    from "Item"
    where "userId" = $1
    group by "feedId"
    ```

    Load the feeds themselves without `items`.

- [ ] Rename the side menu query key to `["feeds"]` so item mutations don't refetch it.
      Invalidate it on purpose after read changes, or update the counts optimistically. Give
      it a `staleTime`.
- [ ] Change `getFeedItemsCount` to `prisma.item.count({ where: { feed: { internalIdentifier },
      userId, ...filter } })`.
- [ ] Remove the `include: { items }` from `getFeedByRssUrl`, `addFeedToUser`, and
      `getFeedByInternalIdentifier`, or add slim versions that return only the feed.
- [ ] Make `assignFeedItemsToUser` a single `insert into "Item" ... select ... from
      "ItemContent" where "feedId" = $1 on conflict do nothing`, or at least
      `select: { id: true }`.

## 4. Pagination: duplicates, page size limit, and the unfollowed feed view

**Duplicates between pages (the Josh Comeau TODO).** Lists are sorted only by
`content.pubDate` (`ItemRepository.getAllItemsByUserId`,
`FeedRepository.getUserFeedByInternalIdentifier`). That value isn't unique, and posts without
a date get "now" (`ContentMapper.ts`), so a whole fetch can share one timestamp. With offset
paging, Postgres can return tied rows in a different order on each query, so posts repeat or
go missing between pages.

**No page size limit.** `parsePagination` (`apps/api/src/utils.ts`) accepts any `pageSize`,
and doesn't handle `NaN`.

**No pagination for feeds you don't follow.** `FeedService.getFeedWithItemsOrContent` sends
the whole feed, with all its HTML, when you aren't subscribed.

**Fix**

- [ ] Sort by `[{ content: { pubDate: "desc" } }, { id: "desc" }]` everywhere, and by
      `[{ pubDate: "desc" }, { id: "desc" }]` for content.
- [ ] Remove the extra in-memory `sortItems` calls after the database query. They're
      redundant and not stable.
- [ ] Clamp `page` to at least 1 and `pageSize` to 1–100, and fall back to the defaults on
      `NaN`.
- [ ] Paginate `contentItems` in the unfollowed view with `take`, `skip`, and the same sort,
      and count them separately.

## 5. Send and store less post content

Every item response includes `content.htmlContent`, which the web app never reads (it shows
`description ?? content`). For feeds that put full articles in RSS, each page of items can be
several MB. The full HTML is also stored in Postgres for every post.

**Fix**

- [ ] Use `select` on `content` in the item and feed queries to return only `id`, `title`,
      `description`, `content`, `link`, `imageUrl`, and `pubDate`, or use Prisma 6's
      `omit: { htmlContent: true }`.
- [ ] Decide whether to keep storing `htmlContent` at all. If it's for a future reader view,
      keep it but never send it in lists. If not, stop saving it and drop the column.
- [ ] Consider truncating `content` and `description` to a few hundred characters when
      saving, since they're only shown as a preview.

## 6. Make the hourly feed refresh cheap

`fetch-rss-feed-worker.ts` and `ParseService.shouldParseAgain` do much more work than needed:

- `getFeedWithContentById` loads every stored post, with HTML, for the feed.
- The new-post check runs `currentContent.every(...)` inside `items.filter(...)`, which is n×m
  comparisons.
- The "nothing changed" early return is broken. `sortBy` from `@banjoanton/utils` only
  compares strings and numbers and treats `Date` values as equal, so
  `sortBy(currentContent, "createdAt")` does nothing and `first(...)` is whatever row comes
  first. The same no-op is in `FeedRepository.getFeedWithContentByInternalIdentifier`.
- The new posts, with full HTML, go into Redis as the data for the next queue job
  (`addToUsersWorker().add({ content })`).
- `addToUsersWorker` runs one `createMany` per follower with `Promise.all`.
- `ParseFeedSchema` validates the whole feed at once and requires `title` and a valid `link`
  on each post. One bad post makes the entire feed fail every hour.

**Fix**

- [ ] Load only links:
      `prisma.itemContent.findMany({ where: { feedId }, select: { link: true } })`, then put
      them in a `Set`.
- [ ] Remove the `sortBy` title check. With the unique constraint from step 2, inserting with
      `skipDuplicates` is enough. Fix or remove the other `sortBy(..., "createdAt")` too.
- [ ] Pass only `contentIds` and `feedId` into the add-to-users job.
- [ ] In add-to-users, insert for all followers in one statement: `insert into "Item" (...)
      select ft."B", $feedId, c.id, ... from "_FeedToUser" ft cross join "ItemContent" c
      where ft."A" = $feedId and c.id = any($ids) on conflict do nothing`. Check which of `A`
      and `B` is the feed and which is the user in the migration.
- [ ] Validate each post separately with `safeParse` and skip bad ones with a log line. Fall
      back to `guid` when `link` is missing, and to a cut-down description when `title` is
      missing.
- [ ] Store only the newest N posts (for example 200) the first time a feed is added, so a
      feed with 5,000 posts in its RSS doesn't fill the database on day one.

## 7. Add limits to outside requests

- `ParseService.parseImage` and `parseFavicon` call `fetch` with no timeout and read the whole
  response as text. A slow or very large page holds up the worker.
- `rss-parser` is created with default options and buffers the whole feed in memory.
- The add-image worker runs one job at a time (BullMQ's default). These jobs mostly wait on
  the network, so a large backlog takes a long time.

**Fix**

- [ ] Use `fetch(url, { signal: AbortSignal.timeout(10_000) })`, check that `content-type` is
      HTML, and stop reading after the first ~256 KB (the `<head>` is all we need).
- [ ] Create the parser with `new RssParser({ timeout: 15_000, maxRedirects: 3 })`. For a hard
      size limit, fetch the feed yourself with a byte cap and use `parseString`.
- [ ] Set `concurrency` (for example 5) on the add-image worker.

## 8. Move OPML import to a background job

`POST /feed/add-many` runs `addFeed` for every URL at the same time, inside one HTTP request.
A big OPML file takes over 60 seconds and the request times out. Error reporting doesn't work
either: `addFeed` returns `Result.error` instead of throwing, so every promise in
`Promise.allSettled` succeeds, `errors` is always empty, and the toast says everything worked.

**Fix**

- [ ] Add an `import-feeds` queue. The endpoint adds one job per URL (or one job with all URLs)
      and returns at once with the number queued.
- [ ] Run the jobs with limited concurrency (for example 5). Rely on BullMQ retries for
      network errors.
- [ ] Check `result.success` from `addFeed` and record failures, so the web app can show which
      feeds failed. A simple version: the web app shows "Importing N feeds" and the sidebar
      fills in as feeds arrive.
- [ ] Wrap `addFeed` in a transaction so a failure halfway doesn't leave a feed with no
      posts.

## 9. Smaller cleanups

- [ ] **Search:** `FeedRepository.searchFeeds` is case-sensitive, has no limit, and loads every
      follower of every match only to filter them in JavaScript. Use
      `mode: "insensitive"`, `take: 20`, `users: { none: { id: userId } }` in the `where`,
      and `select` only the fields `SearchFeed` needs.
- [ ] **Queues in the API:** `createWorker` builds a BullMQ `Worker` right away, so the API
      also opens worker Redis connections that are never used. Create the `Worker` lazily in
      `start()`, so the API only creates `Queue`s.
- [ ] **Dead code:** `FeedService.fetchAndUpdateRssFeed` is already removed (in the dependency
      upgrade). Run `pnpm knip` to find others (`getFeedById`, `getAllItemsByFeed`,
      `createItem` look unused).

## Other open items

From the earlier TODO list, not covered by the steps above.

- [ ] Add tests
- [ ] Add a delay before showing the "no items found" box
- [ ] `CleanFeedWithItems` can return items or content as items. Make it consistent and type
      safe.
- [ ] Find out why ESM doesn't work with tsup in a library
- [ ] Add a request id to logging
- [ ] Fix 401s when the auth token expires. How to keep it up to date?
- [ ] Add a placeholder for cards with no image
- [ ] Show the current page or number of pages in the pagination
- [ ] Fix optimistic updates on favorite and bookmark

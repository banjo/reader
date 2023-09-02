# banjo-rss

A simple RSS reader.

## Database

```bash
# use local docker instance (change .env)
nr db:local:run

# see logs
nr db:local:logs

# reset database (remove all data)
nr db:reset

# open prisma studio
npx prisma studio
```

## TODO:

-   [x] Create user in database on sign up
-   [x] Fix problem with externalId and local id, auth() only contains externalId
-   [x] Add createdAt and updatedAt to all models
-   [x] Add validation and workflow with zod
-   [x] Add logging
-   [ ] Add tests with vitest
-   [x] Make own model separate from database model
-   [x] Add feed image to feed model
-   [x] Add public id for feed model (for url)
-   [x] Do not return result from repository, return result from service?
-   [x] Fetch client side for dynamic data instead (or combo?)
-   [x] fix dark and white mode for table
-   [ ] Add delay for "no items found" box
-   [ ] Add transactions to database
-   [ ] CleanFeedWithItems currently can return items or content as items, should be consistent and type safe in future.
-   [x] Do not need worker url in packages that do not use it 
-   [x] API Urls should be in a separate file
-   [x] Replace ky with something else where headers work
-   [x] Add env example file
-   [ ] Fix why ESM does not work with TSUP in a library?
-   [x] Fix docker cleanup job
-   [x] Fix dockerbuild using turbo
-   [x] Change to postgresql
-   [x] Add logging (axiom?)
-   [x] Do not use api for worker in api, use worker directly
-   [ ] Add request id to logging
-   [ ] Add error handling to repositories
-   [x] Why does not the image worker run?
-   [x] Fix local development without internet
-   [ ] Fix bug with pagination on prod with josh w comaeu double?
-   [ ] Fix bug with import large rss file request takes 60 seconds and time outs
-   [ ] Fix auth 401 things, how to keep it up to date?
-   [x] Mark all as read, not only the ones that are visible
-   [x] When on subscribe, go to start page
-   [ ] Card, no image placeholder
-   [ ] Pagination, current page or amount of pages or something
-   [ ] Fix optimistic updates on favorite and bookmark?

## Build specific app

```bash
# build web
turbo run build --filter={./apps/web}...
```

## Clean build

```bash 
nr clean && find . -name '.turbo' | xargs rm -rf && ni && nr build --filter api && node apps/api/dist/index.cjs
```

## License

Licensed under the [MIT license](https://github.com/shadcn/ui/blob/main/LICENSE.md).

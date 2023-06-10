# banjo-rss

A simple RSS reader built with Next.js.

## Database

```bash
# connect to planetscale
pscale connect banjo-rss initial-setup --port 3309 # intial-setup is the branch name in planetscale

# use local docker instance (change .env)
nr db:local:run

# see logs
nr db:local:logs

# reset database (remove all data)
nr db:update

# open prisma studio
npx prisma studio
```

## TODO:
-   [ ] Create user in database on sign up
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




## License

Licensed under the [MIT license](https://github.com/shadcn/ui/blob/main/LICENSE.md).

# banjo-rss

A simple RSS reader built with Next.js.

## Database

```bash
# connect locally
pscale connect banjo-rss initial-setup --port 3309

# add changes to database
npx prisma db push

# open prisma studio
npx prisma studio
```

## TODO:

-   [ ] Add all prisma functions
-   [ ] Add all api functions
-   [ ] Create user in database on sign up
-   [ ] Fix problem with externalId and local id, auth() only contains externalId
-   [ ] Add createdAt and updatedAt to all models




## License

Licensed under the [MIT license](https://github.com/shadcn/ui/blob/main/LICENSE.md).

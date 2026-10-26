-- Run with: psql "$TEST_DATABASE_URL" -X -f packages/db/tests/item-indexes.sql
-- Use a disposable database. Each run creates and removes its own schema.
\set ON_ERROR_STOP on
SELECT 'item_indexes_test_' || pg_backend_pid() AS test_schema \gset
CREATE SCHEMA :"test_schema";
SET search_path TO :"test_schema";

\ir ../prisma/migrations/20230816194235_init/migration.sql
\ir ../prisma/migrations/20230916195751_url_not_unique/migration.sql
\ir ../prisma/migrations/20261023134129_prisma_6_relation_keys/migration.sql

INSERT INTO "Feed" ("id", "updatedAt", "name", "url", "rssUrl", "internalIdentifier")
VALUES (1, now(), 'First', 'https://one.test', 'https://one.test/rss', 'first'),
       (2, now(), 'Second', 'https://two.test', 'https://two.test/rss', 'second');

INSERT INTO "User" ("id", "updatedAt", "email", "externalId")
VALUES (1, now(), 'one@test.invalid', 'one'),
       (2, now(), 'two@test.invalid', 'two'),
       (3, now(), 'three@test.invalid', 'three');

INSERT INTO "ItemContent" ("id", "feedId", "updatedAt", "title", "link", "lastFetch", "pubDate")
VALUES (1, 1, now(), 'Original', 'https://post.test/a', now(), now()),
       (2, 1, now(), 'Changed title', 'https://post.test/a', now(), now()),
       (3, 1, now(), 'Other post', 'https://post.test/b', now(), now()),
       (4, 2, now(), 'Same link in another feed', 'https://post.test/a', now(), now());

INSERT INTO "Item" ("id", "updatedAt", "feedId", "userId", "contentId", "isRead", "isBookmarked", "isFavorite")
VALUES (10, now(), 1, 1, 2, true, false, false),
       (11, now(), 1, 1, 1, false, true, false),
       (12, now(), 1, 1, 1, false, false, true),
       (13, now(), 1, 2, 2, false, false, false),
       (14, now(), 1, 2, 1, false, true, false),
       (15, now(), 1, 1, 3, false, false, false),
       (16, now(), 2, 1, 4, false, false, false),
       (17, now(), 1, 3, 2, false, false, false);

INSERT INTO "Tag" ("id", "updatedAt", "name", "userId")
VALUES (1, now(), 'First tag', 1),
       (2, now(), 'Second tag', 1),
       (3, now(), 'Other user tag', 2);

INSERT INTO "_ItemToTag" ("A", "B")
VALUES (10, 1), (11, 1), (11, 2), (12, 2), (13, 3), (14, 3);

\ir ../prisma/migrations/20261026120000_item_indexes_and_uniqueness/migration.sql

DO $$
BEGIN
    IF (SELECT array_agg("id" ORDER BY "id") FROM "ItemContent") IS DISTINCT FROM ARRAY[1, 3, 4] THEN
        RAISE EXCEPTION 'Content deduplication must keep the lowest id and respect feedId';
    END IF;

    IF (SELECT array_agg("id" ORDER BY "id") FROM "Item") IS DISTINCT FROM ARRAY[10, 13, 15, 16, 17] THEN
        RAISE EXCEPTION 'Item deduplication must keep the lowest id and respect userId';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "Item"
        WHERE "id" = 10 AND "contentId" = 1 AND "isRead" AND "isBookmarked" AND "isFavorite"
    ) THEN
        RAISE EXCEPTION 'Merged items must point to retained content and preserve all flags';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM "Item"
        WHERE "id" = 13 AND "contentId" = 1 AND NOT "isRead" AND "isBookmarked" AND NOT "isFavorite"
    ) THEN
        RAISE EXCEPTION 'Merging flags must not affect another user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Item" WHERE "id" = 17 AND "contentId" = 1) THEN
        RAISE EXCEPTION 'Nonduplicate items must also be remapped to retained content';
    END IF;

    IF (SELECT count(*) FROM "_ItemToTag") <> 3
       OR NOT EXISTS (SELECT 1 FROM "_ItemToTag" WHERE "A" = 10 AND "B" = 1)
       OR NOT EXISTS (SELECT 1 FROM "_ItemToTag" WHERE "A" = 10 AND "B" = 2)
       OR NOT EXISTS (SELECT 1 FROM "_ItemToTag" WHERE "A" = 13 AND "B" = 3) THEN
        RAISE EXCEPTION 'Tag associations must be merged without duplicates or orphaned rows';
    END IF;

    IF (SELECT count(*) FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = ANY (ARRAY[
              'Item_userId_contentId_key', 'Item_userId_feedId_idx', 'Item_feedId_idx',
              'Item_contentId_idx', 'ItemContent_feedId_link_key',
              'ItemContent_hasFetchedImage_id_idx', 'Tag_userId_idx'
          ])) <> 7 THEN
        RAISE EXCEPTION 'All seven indexes must exist';
    END IF;

    BEGIN
        INSERT INTO "ItemContent" ("id", "feedId", "updatedAt", "title", "link", "lastFetch", "pubDate")
        VALUES (100, 1, now(), 'New title', 'https://post.test/a', now(), now());
        RAISE EXCEPTION 'Duplicate feed/link pairs must be rejected';
    EXCEPTION WHEN unique_violation THEN
        NULL;
    END;

    BEGIN
        INSERT INTO "Item" ("id", "updatedAt", "feedId", "userId", "contentId")
        VALUES (100, now(), 1, 1, 1);
        RAISE EXCEPTION 'Duplicate user/content pairs must be rejected';
    EXCEPTION WHEN unique_violation THEN
        NULL;
    END;
END;
$$;

DROP SCHEMA :"test_schema" CASCADE;
\echo 'Item index migration regression checks passed.'

BEGIN;

-- Keep writes out until both deduplication and the unique indexes are complete.
LOCK TABLE "ItemContent", "Item", "_ItemToTag" IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE "_ItemContentDeduplication" ON COMMIT DROP AS
SELECT "id", "keepId"
FROM (
    SELECT "id", MIN("id") OVER (PARTITION BY "feedId", "link") AS "keepId"
    FROM "ItemContent"
) duplicates
WHERE "id" <> "keepId";

UPDATE "Item" AS item
SET "contentId" = duplicates."keepId"
FROM "_ItemContentDeduplication" AS duplicates
WHERE item."contentId" = duplicates."id";

DELETE FROM "ItemContent" AS content
USING "_ItemContentDeduplication" AS duplicates
WHERE content."id" = duplicates."id";

-- Remapping content can create new duplicate items. Preserve their flags and tags.
CREATE TEMP TABLE "_ItemDeduplication" ON COMMIT DROP AS
SELECT *
FROM (
    SELECT "id",
           MIN("id") OVER duplicate_items AS "keepId",
           BOOL_OR("isRead") OVER duplicate_items AS "isRead",
           BOOL_OR("isBookmarked") OVER duplicate_items AS "isBookmarked",
           BOOL_OR("isFavorite") OVER duplicate_items AS "isFavorite"
    FROM "Item"
    WINDOW duplicate_items AS (PARTITION BY "userId", "contentId")
) duplicates
WHERE "id" <> "keepId";

UPDATE "Item" AS item
SET "isRead" = duplicates."isRead",
    "isBookmarked" = duplicates."isBookmarked",
    "isFavorite" = duplicates."isFavorite"
FROM (
    SELECT DISTINCT "keepId", "isRead", "isBookmarked", "isFavorite"
    FROM "_ItemDeduplication"
) AS duplicates
WHERE item."id" = duplicates."keepId";

INSERT INTO "_ItemToTag" ("A", "B")
SELECT DISTINCT duplicates."keepId", tags."B"
FROM "_ItemToTag" AS tags
JOIN "_ItemDeduplication" AS duplicates ON duplicates."id" = tags."A"
ON CONFLICT DO NOTHING;

DELETE FROM "_ItemToTag" AS tags
USING "_ItemDeduplication" AS duplicates
WHERE tags."A" = duplicates."id";

DELETE FROM "Item" AS item
USING "_ItemDeduplication" AS duplicates
WHERE item."id" = duplicates."id";

CREATE UNIQUE INDEX "Item_userId_contentId_key" ON "Item"("userId", "contentId");
CREATE INDEX "Item_userId_feedId_idx" ON "Item"("userId", "feedId");
CREATE INDEX "Item_feedId_idx" ON "Item"("feedId");
CREATE INDEX "Item_contentId_idx" ON "Item"("contentId");
CREATE UNIQUE INDEX "ItemContent_feedId_link_key" ON "ItemContent"("feedId", "link");
CREATE INDEX "ItemContent_hasFetchedImage_id_idx" ON "ItemContent"("hasFetchedImage", "id");
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

COMMIT;

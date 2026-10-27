-- Track when an image was last verified so the daily scan can rotate through the table.
-- Existing rows start eligible immediately; new rows get the current timestamp.
ALTER TABLE "ItemContent"
    ADD COLUMN "imageCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00';

ALTER TABLE "ItemContent" ALTER COLUMN "imageCheckedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ItemContent_imageCheckedAt_id_idx" ON "ItemContent"("imageCheckedAt", "id");

-- The daily article refresh filters and sorts on lastFetch.
CREATE INDEX "ItemContent_lastFetch_id_idx" ON "ItemContent"("lastFetch", "id");

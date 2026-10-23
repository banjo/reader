-- AlterTable
ALTER TABLE "_FeedToUser" ADD CONSTRAINT "_FeedToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_FeedToUser_AB_unique";

-- AlterTable
ALTER TABLE "_ItemToTag" ADD CONSTRAINT "_ItemToTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ItemToTag_AB_unique";

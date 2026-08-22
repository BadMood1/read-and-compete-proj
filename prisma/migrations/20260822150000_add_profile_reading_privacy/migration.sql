-- AlterTable
ALTER TABLE "users"
ADD COLUMN "recent_finished_books_visible_to_non_friends" BOOLEAN NOT NULL DEFAULT true;

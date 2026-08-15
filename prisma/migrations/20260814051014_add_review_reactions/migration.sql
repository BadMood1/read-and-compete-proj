-- CreateEnum
CREATE TYPE "ReviewReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateTable
CREATE TABLE "review_reactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "type" "ReviewReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_reactions_review_id_type_idx" ON "review_reactions"("review_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "review_reactions_user_id_review_id_key" ON "review_reactions"("user_id", "review_id");

-- AddForeignKey
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

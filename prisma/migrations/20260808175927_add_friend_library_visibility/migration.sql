-- AlterTable
ALTER TABLE "friend_requests" ADD COLUMN     "receiver_library_visible_to_sender" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sender_library_visible_to_receiver" BOOLEAN NOT NULL DEFAULT true;

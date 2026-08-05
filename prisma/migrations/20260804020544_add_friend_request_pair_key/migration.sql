-- Add the nullable column first so existing friend requests can be backfilled.
ALTER TABLE "friend_requests" ADD COLUMN "pair_key" TEXT;

-- User IDs are CUID strings. C collation gives the same stable ordering used by
-- createFriendshipPairKey, while the length prefixes keep the key unambiguous.
UPDATE "friend_requests"
SET "pair_key" = CASE
    WHEN "sender_id" COLLATE "C" < "receiver_id" COLLATE "C" THEN
        char_length("sender_id")::TEXT || ':' || "sender_id" || '|' ||
        char_length("receiver_id")::TEXT || ':' || "receiver_id"
    ELSE
        char_length("receiver_id")::TEXT || ':' || "receiver_id" || '|' ||
        char_length("sender_id")::TEXT || ':' || "sender_id"
END;

ALTER TABLE "friend_requests" ALTER COLUMN "pair_key" SET NOT NULL;

-- A request to the same user is invalid even if application validation is bypassed.
ALTER TABLE "friend_requests"
ADD CONSTRAINT "friend_requests_distinct_users_check"
CHECK ("sender_id" <> "receiver_id");

-- Keep pair_key honest so its uniqueness really represents an unordered user pair.
ALTER TABLE "friend_requests"
ADD CONSTRAINT "friend_requests_pair_key_matches_users_check"
CHECK (
    "pair_key" = CASE
        WHEN "sender_id" COLLATE "C" < "receiver_id" COLLATE "C" THEN
            char_length("sender_id")::TEXT || ':' || "sender_id" || '|' ||
            char_length("receiver_id")::TEXT || ':' || "receiver_id"
        ELSE
            char_length("receiver_id")::TEXT || ':' || "receiver_id" || '|' ||
            char_length("sender_id")::TEXT || ':' || "sender_id"
    END
);

CREATE UNIQUE INDEX "friend_requests_pair_key_key"
ON "friend_requests"("pair_key");

-- Drop the old index only after the stronger unordered-pair index exists.
DROP INDEX "friend_requests_sender_id_receiver_id_key";

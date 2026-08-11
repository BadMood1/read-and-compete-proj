-- Поле nullable: оно заполняется только у книги со статусом FINISHED.
ALTER TABLE "user_books"
ADD COLUMN "finished_books_count_at_finish" INTEGER;

-- Для существующих прочитанных книг восстанавливаем порядковый снимок
-- по дате завершения. ID делает порядок стабильным при одинаковых датах.
WITH ranked_finished_books AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "user_id"
            ORDER BY "finished_at" ASC, "id" ASC
        )::INTEGER AS "finished_books_count_at_finish"
    FROM "user_books"
    WHERE
        "status" = 'FINISHED'
        AND "finished_at" IS NOT NULL
)
UPDATE "user_books" AS current_user_book
SET "finished_books_count_at_finish" = ranked_finished_books."finished_books_count_at_finish"
FROM ranked_finished_books
WHERE current_user_book."id" = ranked_finished_books."id";

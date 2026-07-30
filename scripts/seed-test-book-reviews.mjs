import pg from "pg";

const { Client } = pg;

const TEST_BOOK_ID = "cmrzwxxa00000alwoehm90pxk";

// Постоянные ID позволяют запускать скрипт повторно без создания дублей.
const TEST_REVIEW_AUTHORS = [
    {
        userId: "test-review-user-alina",
        reviewId: "test-review-algernon-alina",
        name: "Алина Соколова",
        email: "test-review-alina@example.invalid",
        rating: 10,
        text: "Очень человечная и одновременно тяжёлая история. После финала ещё долго возвращалась мыслями к Чарли и его дневнику.",
    },
    {
        userId: "test-review-user-maksim",
        reviewId: "test-review-algernon-maksim",
        name: "Максим Орлов",
        email: "test-review-maksim@example.invalid",
        rating: 8,
        text: "Начало показалось непривычным из-за языка записей, но именно через него особенно хорошо видно, как меняется герой.\n\nФинал сильный, хотя местами книга давит слишком сильно.",
    },
    {
        userId: "test-review-user-daria",
        reviewId: "test-review-algernon-daria",
        name: "Дарья Волкова",
        email: "test-review-daria@example.invalid",
        rating: 9,
        text: "Понравилось, что роман говорит не только об интеллекте, но и об одиночестве, достоинстве и отношении людей к тем, кто отличается от них.",
    },
    {
        userId: "test-review-user-nikita",
        reviewId: "test-review-algernon-nikita",
        name: "Никита Лебедев",
        email: "test-review-nikita@example.invalid",
        rating: 7,
        text: "Хорошая книга и интересная идея, но середина для меня немного затянулась. Несмотря на это, концовка полностью оправдала чтение.",
    },
    {
        userId: "test-review-user-sofia",
        reviewId: "test-review-algernon-sofia",
        name: "София Морозова",
        email: "test-review-sofia@example.invalid",
        rating: 10,
        text: "Редкий случай, когда простая форма повествования делает историю только сильнее. Очень бережный и запоминающийся роман.",
    },
    {
        userId: "test-review-user-artem",
        reviewId: "test-review-algernon-artem",
        name: "Артём Козлов",
        email: "test-review-artem@example.invalid",
        rating: 9,
        text: null,
    },
    {
        userId: "test-review-user-elena",
        reviewId: "test-review-algernon-elena",
        name: "Елена Новикова",
        email: "test-review-elena@example.invalid",
        rating: 8,
        text: null,
    },
    {
        userId: "test-review-user-roman",
        reviewId: "test-review-algernon-roman",
        name: "Роман Фёдоров",
        email: "test-review-roman@example.invalid",
        rating: 6,
        text: null,
    },
];

function getDatabaseConnectionString() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured");
    }

    const connectionUrl = new URL(databaseUrl);

    // Сохраняем строгую TLS-проверку и не получаем предупреждение pg-connection-string.
    if (connectionUrl.searchParams.get("sslmode") === "require") {
        connectionUrl.searchParams.set("sslmode", "verify-full");
    }

    return connectionUrl.toString();
}

async function seedTestBookReviews() {
    const client = new Client({
        connectionString: getDatabaseConnectionString(),
    });

    await client.connect();

    try {
        await client.query("BEGIN");

        const bookResult = await client.query("SELECT title FROM books WHERE id = $1", [
            TEST_BOOK_ID,
        ]);

        if (bookResult.rowCount === 0) {
            throw new Error(`Book ${TEST_BOOK_ID} was not found`);
        }

        if (process.argv.includes("--cleanup")) {
            // Удаляем только созданных этим скриптом пользователей; их рецензии удалятся каскадно.
            await client.query("DELETE FROM users WHERE id = ANY($1::text[])", [
                TEST_REVIEW_AUTHORS.map((author) => author.userId),
            ]);

            await client.query("COMMIT");
            console.log("Тестовые пользователи и рецензии удалены.");
            return;
        }

        for (const [index, author] of TEST_REVIEW_AUTHORS.entries()) {
            await client.query(
                `INSERT INTO users (id, name, email)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (id) DO UPDATE
                 SET name = EXCLUDED.name,
                     email = EXCLUDED.email`,
                [author.userId, author.name, author.email],
            );

            const createdAt = new Date(Date.now() - index * 60 * 60 * 1000);

            await client.query(
                `INSERT INTO reviews
                    (id, user_id, book_id, rating, text, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $6)
                 ON CONFLICT (user_id, book_id) DO UPDATE
                 SET rating = EXCLUDED.rating,
                     text = EXCLUDED.text,
                     updated_at = EXCLUDED.updated_at`,
                [
                    author.reviewId,
                    author.userId,
                    TEST_BOOK_ID,
                    author.rating,
                    author.text,
                    createdAt,
                ],
            );
        }

        await client.query("COMMIT");
        console.log(
            `Добавлено или обновлено ${TEST_REVIEW_AUTHORS.length} тестовых рецензий для «${bookResult.rows[0].title}».`,
        );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        await client.end();
    }
}

seedTestBookReviews().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

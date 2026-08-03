import { randomUUID } from "node:crypto";

import pg from "pg";

const { Client } = pg;

const TEST_USER_ID = "test-review-user-alina";
const TEST_SESSION_LIFETIME_IN_HOURS = 24;

// Собирает одну cookie в формате, который Cookie Editor умеет импортировать напрямую.
function createCookieEditorImport(sessionToken, expiresAt) {
    return [
        {
            domain: "localhost",
            expirationDate: expiresAt.getTime() / 1000,
            hostOnly: true,
            httpOnly: true,
            name: "authjs.session-token",
            path: "/",
            sameSite: "lax",
            secure: false,
            session: false,
            storeId: null,
            value: sessionToken,
        },
    ];
}

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

async function createTestUserSession() {
    const client = new Client({
        connectionString: getDatabaseConnectionString(),
    });

    await client.connect();

    try {
        await client.query("BEGIN");

        const userResult = await client.query("SELECT name FROM users WHERE id = $1", [
            TEST_USER_ID,
        ]);

        if (userResult.rowCount === 0) {
            throw new Error("Тестовый пользователь не найден. Сначала запустите npm run seed:test-reviews.");
        }

        // Старые сессии удаляем, чтобы в БД не копились одноразовые тестовые токены.
        await client.query("DELETE FROM sessions WHERE user_id = $1", [TEST_USER_ID]);

        const sessionToken = randomUUID();
        const expiresAt = new Date(
            Date.now() + TEST_SESSION_LIFETIME_IN_HOURS * 60 * 60 * 1000,
        );

        await client.query(
            `INSERT INTO sessions (id, session_token, user_id, expires)
             VALUES ($1, $2, $3, $4)`,
            [randomUUID(), sessionToken, TEST_USER_ID, expiresAt],
        );

        await client.query("COMMIT");

        // Выводим готовый JSON без пояснений, чтобы его можно было сразу вставить в Cookie Editor.
        console.log(JSON.stringify(createCookieEditorImport(sessionToken, expiresAt), null, 2));
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        await client.end();
    }
}

createTestUserSession().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

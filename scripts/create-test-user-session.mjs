import { randomUUID } from "node:crypto";

import pg from "pg";

const { Client } = pg;

const TEST_USER_ID = "test-review-user-alina";
const TEST_SESSION_LIFETIME_IN_HOURS = 24;

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

        console.log(`Тестовая сессия создана для: ${userResult.rows[0].name}`);
        console.log("Cookie name: authjs.session-token");
        console.log(`Cookie value: ${sessionToken}`);
        console.log(`Expires: ${expiresAt.toISOString()}`);
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

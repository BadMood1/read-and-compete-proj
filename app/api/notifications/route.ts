import { connection } from "next/server";

import { getCurrentSession } from "@/lib/auth/get-current-session";
import { getCurrentUserNotifications } from "@/lib/notifications/current-user-notification-queries";

const PRIVATE_NO_STORE_HEADERS = {
    "Cache-Control": "private, no-store",
};

// Отдаёт свежие уведомления только владельцу текущей серверной сессии.
// Этот небольшой API позволяет обновлять колокольчик без перезагрузки всей страницы.
export async function GET() {
    // Явно ждём настоящий HTTP-запрос: персональный ответ нельзя создавать во время build.
    // Вызов расположен вне try, чтобы Next.js сам обработал остановку prerendering.
    await connection();

    try {
        const session = await getCurrentSession();

        if (!session?.user?.id) {
            return Response.json(
                { error: "Сначала войдите в аккаунт." },
                { status: 401, headers: PRIVATE_NO_STORE_HEADERS },
            );
        }

        const notificationsData = await getCurrentUserNotifications();

        return Response.json(notificationsData, {
            headers: PRIVATE_NO_STORE_HEADERS,
        });
    } catch (error) {
        console.error("Notifications refresh request failed:", error);

        return Response.json(
            { error: "Не удалось обновить уведомления." },
            { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
        );
    }
}

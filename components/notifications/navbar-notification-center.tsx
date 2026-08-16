import { Bell } from "lucide-react";

import { CurrentUserNotificationsSheet } from "@/components/notifications/current-user-notifications-sheet";
import { getCurrentUserNotifications } from "@/lib/notifications/current-user-notification-queries";

// Серверная обёртка не передаёт Prisma в браузер: клиент получает только готовые данные панели.
export async function NavbarNotificationCenter() {
    const notificationsData = await getCurrentUserNotifications();

    return <CurrentUserNotificationsSheet initialNotificationsData={notificationsData} />;
}

// Сохраняет место настоящего колокольчика, пока сервер получает уведомления.
export function NavbarNotificationCenterSkeleton() {
    return (
        <span
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground motion-safe:animate-pulse sm:size-9"
            aria-hidden="true"
        >
            <Bell className="size-4 opacity-40" />
        </span>
    );
}

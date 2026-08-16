import "server-only";

import type { NotificationType } from "@/app/generated/prisma/enums";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { MAX_NOTIFICATIONS_PER_USER } from "@/lib/notifications/notification-limits";
import prisma from "@/lib/prisma";

// Короткие публичные данные пользователя, который вызвал уведомление.
type CurrentUserNotificationActor = {
    id: string;
    name: string | null;
    image: string | null;
};

// Данные комментария нужны только уведомлению о новой реплике под рецензией.
type CurrentUserNotificationReviewComment = {
    id: string;
    text: string;
    review: {
        id: string;
        book: {
            googleBooksId: string;
            title: string;
        };
    };
};

export type CurrentUserNotificationSummary = {
    id: string;
    type: NotificationType;
    createdAt: Date;
    isRead: boolean;
    actor: CurrentUserNotificationActor;
    // У событий дружбы комментария нет, поэтому Prisma вернёт null.
    reviewComment: CurrentUserNotificationReviewComment | null;
};

export type CurrentUserNotificationsData = {
    notifications: CurrentUserNotificationSummary[];
    // Считаем все непрочитанные уведомления из сохранённых последних 30.
    unreadNotificationsCount: number;
    // Общее число помогает определить, остались ли среди сохранённых записей прочитанные.
    totalNotificationsCount: number;
};

// Возвращает данные, которых достаточно будущей панели уведомлений в Navbar.
export async function getCurrentUserNotifications(): Promise<CurrentUserNotificationsData> {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;

    // Функция остаётся безопасной, даже если её случайно вызвать вне защищённого layout.
    if (!currentUserId) {
        return {
            notifications: [],
            unreadNotificationsCount: 0,
            totalNotificationsCount: 0,
        };
    }

    // Список и оба счётчика не зависят друг от друга, поэтому запрашиваем их параллельно.
    const [notificationRecords, unreadNotificationsCount, totalNotificationsCount] = await Promise.all([
        prisma.notification.findMany({
            where: {
                recipientId: currentUserId,
            },
            // id сохраняет стабильный порядок, если две записи получили одинаковое время.
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: MAX_NOTIFICATIONS_PER_USER,
            select: {
                id: true,
                type: true,
                readAt: true,
                createdAt: true,
                actor: {
                    // Email и остальные приватные данные пользователя панели не нужны.
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                reviewComment: {
                    select: {
                        id: true,
                        text: true,
                        review: {
                            select: {
                                id: true,
                                book: {
                                    select: {
                                        googleBooksId: true,
                                        title: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
        prisma.notification.count({
            where: {
                recipientId: currentUserId,
                readAt: null,
            },
        }),
        prisma.notification.count({
            where: {
                recipientId: currentUserId,
            },
        }),
    ]);

    return {
        unreadNotificationsCount,
        totalNotificationsCount,
        // UI достаточно простого флага; точную внутреннюю дату прочтения наружу не отдаём.
        notifications: notificationRecords.map(({ readAt, ...notification }) => ({
            ...notification,
            isRead: readAt !== null,
        })),
    };
}

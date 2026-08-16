"use server";

import type { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/auth";
import {
    getCurrentUserNotifications,
    type CurrentUserNotificationsData,
} from "@/lib/notifications/current-user-notification-queries";
import prisma from "@/lib/prisma";

export type CurrentUserNotificationMutationResult =
    | {
          success: true;
          affectedNotificationsCount: number;
          unreadNotificationsCount: number;
      }
    | {
          success: false;
          error: string;
      };

type CurrentUserNotificationListMutationResult =
    | {
          success: true;
          affectedNotificationsCount: number;
          unreadNotificationsCount: number;
          // Массовая операция сразу возвращает новый список, поэтому UI не перезагружает layout.
          notificationsData: CurrentUserNotificationsData;
      }
    | {
          success: false;
          error: string;
      };

// Считает оставшиеся непрочитанные записи внутри той же транзакции, что и изменение.
function countCurrentUserUnreadNotifications(
    transaction: Prisma.TransactionClient,
    currentUserId: string,
) {
    return transaction.notification.count({
        where: {
            recipientId: currentUserId,
            readAt: null,
        },
    });
}

// Автоматически отмечает конкретное уведомление после нажатия на него в панели.
export async function markCurrentUserNotificationAsRead(
    notificationId: string,
): Promise<CurrentUserNotificationMutationResult> {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const normalizedNotificationId =
        typeof notificationId === "string" ? notificationId.trim() : "";

    if (!currentUserId) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedNotificationId) {
        return { success: false, error: "Не удалось определить уведомление." };
    }

    const mutationResult = await prisma.$transaction(async (transaction) => {
        // recipientId не позволяет отметить прочитанным уведомление другого пользователя.
        // readAt: null делает повторный вызов безопасным: уже прочитанная запись не изменится.
        const updateResult = await transaction.notification.updateMany({
            where: {
                id: normalizedNotificationId,
                recipientId: currentUserId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        });

        if (updateResult.count === 0) {
            // Нулевой count допустим для повторного клика по уже прочитанной записи.
            // Дополнительное чтение отличает его от отсутствующего или чужого ID.
            const existingCurrentUserNotification = await transaction.notification.findFirst({
                where: {
                    id: normalizedNotificationId,
                    recipientId: currentUserId,
                },
                select: {
                    id: true,
                },
            });

            if (!existingCurrentUserNotification) {
                return { success: false, error: "Уведомление не найдено." } as const;
            }
        }

        const unreadNotificationsCount = await countCurrentUserUnreadNotifications(
            transaction,
            currentUserId,
        );

        return {
            success: true,
            affectedNotificationsCount: updateResult.count,
            unreadNotificationsCount,
        } as const;
    });

    return mutationResult;
}

// Отмечает прочитанными сразу все уведомления вошедшего пользователя.
export async function markAllCurrentUserNotificationsAsRead(): Promise<CurrentUserNotificationListMutationResult> {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    // Один updateMany является атомарной SQL-операцией и безопасен при повторном вызове.
    const updateResult = await prisma.notification.updateMany({
        where: {
            recipientId: currentUserId,
            readAt: null,
        },
        data: {
            readAt: new Date(),
        },
    });

    // Повторно читаем данные, чтобы захватить уведомление, которое могло прийти параллельно.
    const notificationsData = await getCurrentUserNotifications();

    return {
        success: true,
        affectedNotificationsCount: updateResult.count,
        unreadNotificationsCount: notificationsData.unreadNotificationsCount,
        notificationsData,
    };
}

// Навсегда удаляет историю, которую текущий пользователь уже прочитал.
export async function deleteCurrentUserReadNotifications(): Promise<CurrentUserNotificationListMutationResult> {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    // readAt: { not: null } сохраняет все уведомления, которые пользователь ещё не видел.
    const deleteResult = await prisma.notification.deleteMany({
        where: {
            recipientId: currentUserId,
            readAt: {
                not: null,
            },
        },
    });

    // Повторно получаем актуальные счётчики и оставшийся список после удаления.
    const notificationsData = await getCurrentUserNotifications();

    return {
        success: true,
        affectedNotificationsCount: deleteResult.count,
        unreadNotificationsCount: notificationsData.unreadNotificationsCount,
        notificationsData,
    };
}

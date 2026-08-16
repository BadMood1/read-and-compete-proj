import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { NotificationType } from "@/app/generated/prisma/enums";
import { MAX_NOTIFICATIONS_PER_USER } from "@/lib/notifications/notification-limits";

type CreateNotificationAndRemoveOverflowOptions = {
    transaction: Prisma.TransactionClient;
    recipientUserId: string;
    actorUserId: string;
    type: NotificationType;
    reviewCommentId?: string;
};

type CreateReviewCommentNotificationOptions = {
    transaction: Prisma.TransactionClient; // транзакция, чтобы откатилось всё вместе, если что-то пойдёт не так
    reviewAuthorUserId: string;
    commentAuthorUserId: string;
    reviewCommentId: string;
};

type CreateFriendshipNotificationOptions = {
    transaction: Prisma.TransactionClient;
    recipientUserId: string;
    actorUserId: string;
};

// Создаёт уведомление и сразу удаляет более старые записи сверх общего лимита.
// Функция выполняется внутри исходной транзакции: основное действие и уведомление
// либо сохранятся вместе, либо вместе откатятся при ошибке.
async function createNotificationAndRemoveOverflow({
    transaction,
    recipientUserId,
    actorUserId,
    type,
    reviewCommentId,
}: CreateNotificationAndRemoveOverflowOptions) {
    await transaction.notification.create({
        data: {
            recipientId: recipientUserId,
            actorId: actorUserId,
            type,
            reviewCommentId,
        },
    });

    // Первые 30 записей после сортировки — те, которые нужно оставить.
    // Запрос возвращает только ID всех более старых уведомлений.
    const notificationsOutsideLimit = await transaction.notification.findMany({
        where: {
            recipientId: recipientUserId,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: MAX_NOTIFICATIONS_PER_USER,
        select: {
            id: true,
        },
    });

    if (notificationsOutsideLimit.length === 0) {
        return;
    }

    // recipientId дополнительно гарантирует, что не затронем записи другого пользователя.
    await transaction.notification.deleteMany({
        where: {
            recipientId: recipientUserId,
            id: {
                in: notificationsOutsideLimit.map((notification) => notification.id),
            },
        },
    });
}

// Создаёт уведомление автору рецензии в той же транзакции, что и новый комментарий.
export async function createReviewCommentNotificationForReviewAuthor({
    transaction,
    reviewAuthorUserId,
    commentAuthorUserId,
    reviewCommentId,
}: CreateReviewCommentNotificationOptions) {
    // Собственный комментарий под своей рецензией не должен уведомлять самого пользователя.
    if (reviewAuthorUserId === commentAuthorUserId) {
        return;
    }

    await createNotificationAndRemoveOverflow({
        transaction,
        recipientUserId: reviewAuthorUserId,
        actorUserId: commentAuthorUserId,
        type: NotificationType.REVIEW_COMMENT_RECEIVED,
        reviewCommentId,
    });
}

// Сообщает получателю, что другой пользователь отправил ему заявку в друзья.
export async function createFriendRequestReceivedNotification({
    transaction,
    recipientUserId,
    actorUserId,
}: CreateFriendshipNotificationOptions) {
    await createNotificationAndRemoveOverflow({
        transaction,
        recipientUserId,
        actorUserId,
        type: NotificationType.FRIEND_REQUEST_RECEIVED,
    });
}

// Сообщает первоначальному отправителю, что его заявку приняли.
export async function createFriendRequestAcceptedNotification({
    transaction,
    recipientUserId,
    actorUserId,
}: CreateFriendshipNotificationOptions) {
    await createNotificationAndRemoveOverflow({
        transaction,
        recipientUserId,
        actorUserId,
        type: NotificationType.FRIEND_REQUEST_ACCEPTED,
    });
}

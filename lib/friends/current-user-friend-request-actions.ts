"use server";

import { FriendRequestStatus } from "@/app/generated/prisma/enums";
import { auth } from "@/auth";
import {
    CurrentUserFriendshipState,
    type CurrentUserFriendshipState as CurrentUserFriendshipStateValue,
} from "@/lib/friends/current-user-friendship-state";
import prisma from "@/lib/prisma";
import { revalidateUserProfilePage } from "@/lib/profile/profile-page-revalidation";

// Все операции возвращают компоненту одно и то же понятное состояние дружбы.
type CurrentUserFriendshipMutationResult =
    | {
          success: true;
          currentUserFriendshipState: CurrentUserFriendshipStateValue;
      }
    | {
          success: false;
          error: string;
      };

// После общей проверки либо получаем ID обоих участников, либо готовую ошибку для UI.
type ValidatedFriendshipMutationParticipantsResult =
    | {
          success: true;
          currentUserId: string;
          otherUserId: string;
      }
    | {
          success: false;
          error: string;
      };

// Одинаково проверяет участников перед отправкой, принятием и отклонением заявки.
async function getValidatedFriendshipMutationParticipants(
    rawOtherUserId: string,
): Promise<ValidatedFriendshipMutationParticipantsResult> {
    // ID текущего пользователя всегда берём из серверной сессии, а не получаем от клиента.
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Значение от клиента нельзя считать корректным: приводим его к строке без пробелов по краям.
    const normalizedOtherUserId =
        typeof rawOtherUserId === "string" ? rawOtherUserId.trim() : "";

    // --- ПРОВЕРКИ ОБОИХ УЧАСТНИКОВ ОПЕРАЦИИ ---

    if (!currentUserId) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedOtherUserId) {
        return { success: false, error: "Не удалось определить пользователя." };
    }

    if (currentUserId === normalizedOtherUserId) {
        return { success: false, error: "Нельзя выполнить это действие со своим профилем." };
    }

    // Проверяем, что второй пользователь действительно существует в нашей базе.
    const otherUser = await prisma.user.findUnique({
        where: {
            id: normalizedOtherUserId,
        },
        // Нужен только факт существования пользователя.
        select: {
            id: true,
        },
    });

    if (!otherUser) {
        return { success: false, error: "Пользователь не найден." };
    }

    return {
        success: true,
        currentUserId,
        otherUserId: otherUser.id,
    };
}

// Любое изменение отношений влияет на состояние кнопок в обоих профилях.
function revalidateFriendshipProfilePages(firstUserId: string, secondUserId: string) {
    revalidateUserProfilePage(firstUserId);
    revalidateUserProfilePage(secondUserId);
}

// Возвращает только текущий статус заявки в точном направлении sender -> receiver.
// Используется, когда updateMany ничего не обновил и нужно выяснить причину.
function getIncomingFriendRequestStatus(senderUserId: string, receiverUserId: string) {
    return prisma.friendRequest.findUnique({
        where: {
            senderId_receiverId: {
                senderId: senderUserId,
                receiverId: receiverUserId,
            },
        },
        select: {
            status: true,
        },
    });
}

// Отправляет заявку от текущего пользователя выбранному получателю.
export async function sendCurrentUserFriendRequest(
    receiverUserId: string,
): Promise<CurrentUserFriendshipMutationResult> {
    // Общая проверка возвращает доверенный ID из сессии и проверенный ID получателя.
    const participants = await getValidatedFriendshipMutationParticipants(receiverUserId);

    // --- ПРОВЕРКИ ВХОДНЫХ ДАННЫХ ---

    if (!participants.success) {
        return participants;
    }

    const { currentUserId, otherUserId: normalizedReceiverUserId } = participants;

    // Ищем связь в обоих направлениях: текущий пользователь мог как отправить,
    // так и ранее получить заявку от выбранного пользователя.
    const existingFriendRequest = await prisma.friendRequest.findFirst({
        where: {
            OR: [
                {
                    senderId: currentUserId,
                    receiverId: normalizedReceiverUserId,
                },
                {
                    senderId: normalizedReceiverUserId,
                    receiverId: currentUserId,
                },
            ],
        },
        select: {
            id: true,
            senderId: true,
            status: true,
        },
    });

    // --- ОБРАБОТКА УЖЕ СУЩЕСТВУЮЩЕЙ СВЯЗИ ---

    // Принятая заявка уже представляет дружбу — создавать новую нельзя и не нужно.
    if (existingFriendRequest?.status === FriendRequestStatus.ACCEPTED) {
        return {
            success: true,
            currentUserFriendshipState: CurrentUserFriendshipState.FRIENDS,
        };
    }

    if (existingFriendRequest?.status === FriendRequestStatus.PENDING) {
        // senderId показывает, кто сейчас ждёт ответа, а кто должен ответить на заявку.
        const wasSentByCurrentUser = existingFriendRequest.senderId === currentUserId;

        // Если заявку прислал владелец профиля, пользователь должен принять или отклонить её.
        if (!wasSentByCurrentUser) {
            return {
                success: false,
                error: "У вас уже есть входящая заявка от этого пользователя.",
            };
        }

        // Повторный вызов не создаёт дубликат и подтверждает актуальное состояние интерфейсу.
        return {
            success: true,
            currentUserFriendshipState: CurrentUserFriendshipState.OUTGOING_FRIEND_REQUEST,
        };
    }

    if (existingFriendRequest?.status === FriendRequestStatus.REJECTED) {
        // Отклонённую раньше запись переиспользуем для новой заявки.
        // Роли обновляем на случай, если теперь инициатором стал другой пользователь.
        // Новая createdAt вернёт повторную заявку в начало списка свежих входящих.
        await prisma.friendRequest.update({
            where: {
                id: existingFriendRequest.id,
            },
            data: {
                senderId: currentUserId,
                receiverId: normalizedReceiverUserId,
                status: FriendRequestStatus.PENDING,
                createdAt: new Date(),
            },
        });
    } else {
        // Между пользователями нет записи. upsert создаёт заявку и защищает от дубля,
        // если два одинаковых запроса успели прийти почти одновременно.
        await prisma.friendRequest.upsert({
            where: {
                senderId_receiverId: {
                    senderId: currentUserId,
                    receiverId: normalizedReceiverUserId,
                },
            },
            update: {},
            create: {
                senderId: currentUserId,
                receiverId: normalizedReceiverUserId,
            },
        });
    }

    // После записи оба профиля должны при следующем рендере показать новое состояние.
    revalidateFriendshipProfilePages(currentUserId, normalizedReceiverUserId);

    return {
        success: true,
        currentUserFriendshipState: CurrentUserFriendshipState.OUTGOING_FRIEND_REQUEST,
    };
}

// Принимает только PENDING-заявку, адресованную текущему пользователю.
export async function acceptCurrentUserFriendRequest(
    senderUserId: string,
): Promise<CurrentUserFriendshipMutationResult> {
    // senderUserId приходит из профиля, а ID получателя берётся из текущей сессии.
    const participants = await getValidatedFriendshipMutationParticipants(senderUserId);

    if (!participants.success) {
        return participants;
    }

    const { currentUserId, otherUserId: normalizedSenderUserId } = participants;

    // receiverId из сессии не позволяет принять заявку, адресованную другому пользователю.
    // updateMany дополнительно проверяет PENDING и не перезаписывает уже принятое решение.
    const updateResult = await prisma.friendRequest.updateMany({
        where: {
            senderId: normalizedSenderUserId,
            receiverId: currentUserId,
            status: FriendRequestStatus.PENDING,
        },
        data: {
            status: FriendRequestStatus.ACCEPTED,
        },
    });

    // count === 0 означает, что подходящая входящая PENDING-заявка не обновилась.
    // Читаем её текущий статус, чтобы отличить повторное нажатие от отсутствующей заявки.
    if (updateResult.count === 0) {
        const existingFriendRequest = await getIncomingFriendRequestStatus(
            normalizedSenderUserId,
            currentUserId,
        );

        // Повторное принятие идемпотентно: интерфейс всё равно получает верное состояние.
        if (existingFriendRequest?.status === FriendRequestStatus.ACCEPTED) {
            return {
                success: true,
                currentUserFriendshipState: CurrentUserFriendshipState.FRIENDS,
            };
        }

        // Если другой запрос уже успел отклонить заявку, принимать её больше нельзя.
        if (existingFriendRequest?.status === FriendRequestStatus.REJECTED) {
            return { success: false, error: "Эта заявка уже отклонена." };
        }

        return { success: false, error: "Входящая заявка не найдена." };
    }

    // count > 0: заявка только что стала ACCEPTED, поэтому обновляем оба профиля.
    revalidateFriendshipProfilePages(currentUserId, normalizedSenderUserId);

    return {
        success: true,
        currentUserFriendshipState: CurrentUserFriendshipState.FRIENDS,
    };
}

// Отклоняет только PENDING-заявку, адресованную текущему пользователю.
export async function rejectCurrentUserFriendRequest(
    senderUserId: string,
): Promise<CurrentUserFriendshipMutationResult> {
    // senderUserId приходит из профиля, а ID получателя берётся из текущей сессии.
    const participants = await getValidatedFriendshipMutationParticipants(senderUserId);

    if (!participants.success) {
        return participants;
    }

    const { currentUserId, otherUserId: normalizedSenderUserId } = participants;

    // Меняем только входящую PENDING-заявку текущего пользователя.
    // Так нельзя отклонить чужую, уже принятую или уже отклонённую заявку.
    const updateResult = await prisma.friendRequest.updateMany({
        where: {
            senderId: normalizedSenderUserId,
            receiverId: currentUserId,
            status: FriendRequestStatus.PENDING,
        },
        data: {
            status: FriendRequestStatus.REJECTED,
        },
    });

    // Если обновлений нет, отдельно выясняем: действие повторили, заявка принята или её нет.
    if (updateResult.count === 0) {
        const existingFriendRequest = await getIncomingFriendRequestStatus(
            normalizedSenderUserId,
            currentUserId,
        );

        // Повторное отклонение также не должно превращаться в ошибку интерфейса.
        if (existingFriendRequest?.status === FriendRequestStatus.REJECTED) {
            return {
                success: true,
                currentUserFriendshipState: CurrentUserFriendshipState.NOT_FRIENDS,
            };
        }

        // Принятую заявку нельзя задним числом отклонить этой операцией.
        if (existingFriendRequest?.status === FriendRequestStatus.ACCEPTED) {
            return { success: false, error: "Эта заявка уже принята." };
        }

        return { success: false, error: "Входящая заявка не найдена." };
    }

    // count > 0: заявка только что стала REJECTED, поэтому обновляем оба профиля.
    revalidateFriendshipProfilePages(currentUserId, normalizedSenderUserId);

    return {
        success: true,
        currentUserFriendshipState: CurrentUserFriendshipState.NOT_FRIENDS,
    };
}

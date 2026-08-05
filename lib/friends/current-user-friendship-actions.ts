"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { FriendRequestStatus } from "@/app/generated/prisma/enums";
import { auth } from "@/auth";
import { createFriendshipPairKey } from "@/lib/friends/create-friendship-pair-key";
import {
    CurrentUserFriendshipState,
    type CurrentUserFriendshipState as CurrentUserFriendshipStateValue,
} from "@/lib/friends/current-user-friendship-state";
import { getFriendshipStateForProfileViewer } from "@/lib/friends/current-user-friendship-queries";
import prisma from "@/lib/prisma";
import { revalidateUserProfilePage } from "@/lib/profile/profile-page-revalidation";

// Одного повтора достаточно для обычного unique-конфликта, но оставляем
// ещё одну попытку на случай параллельной смены статуса.
const SEND_FRIEND_REQUEST_MAX_ATTEMPTS = 3;

// --- ОБЩИЕ ТИПЫ РЕЗУЛЬТАТОВ ---

// Все операции возвращают компоненту одно и то же понятное состояние дружбы.
type CurrentUserFriendshipMutationResult =
    | {
          success: true;
          currentUserFriendshipState: CurrentUserFriendshipStateValue;
      }
    | {
          success: false;
          error: string;
          // При конфликте сервер возвращает реальное состояние, чтобы обновить устаревшие кнопки.
          currentUserFriendshipState?: CurrentUserFriendshipStateValue;
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

// --- ОБЩИЕ ПРОВЕРКИ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Одинаково проверяет участников перед любой операцией с заявкой или дружбой.
async function getValidatedFriendshipMutationParticipants(
    rawOtherUserId: string,
): Promise<ValidatedFriendshipMutationParticipantsResult> {
    // ID текущего пользователя всегда берём из серверной сессии, а не получаем от клиента.
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Значение от клиента нельзя считать корректным: приводим его к строке без пробелов по краям.
    const normalizedOtherUserId = typeof rawOtherUserId === "string" ? rawOtherUserId.trim() : "";

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

// По pairKey всегда находится не более одной заявки в любом направлении.
// Функция нужна после неудачного условного update, чтобы объяснить причину.
function getFriendRequestStatusForPair(friendshipPairKey: string) {
    return prisma.friendRequest.findUnique({
        where: {
            pairKey: friendshipPairKey,
        },
        select: {
            status: true,
        },
    });
}

// При одновременной отправке A -> B и B -> A один create законно получит
// unique-конфликт pairKey. Такую гонку не считаем общей ошибкой UI, а перечитываем запись.
function isPrismaUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function createSuccessfulFriendshipMutationResult(
    currentUserFriendshipState: CurrentUserFriendshipStateValue,
): CurrentUserFriendshipMutationResult {
    return {
        success: true,
        currentUserFriendshipState,
    };
}

function createFailedFriendshipMutationResult(
    error: string,
    currentUserFriendshipState: CurrentUserFriendshipStateValue,
): CurrentUserFriendshipMutationResult {
    return {
        success: false,
        error,
        currentUserFriendshipState,
    };
}

// Если мутация ничего не изменила, возвращает интерфейсу фактическое состояние из БД.
// Это синхронизирует устаревшую вкладку после повторного или параллельного действия.
async function getSuccessfulResultWithCurrentFriendshipState(
    currentUserId: string,
    otherUserId: string,
): Promise<CurrentUserFriendshipMutationResult> {
    const currentUserFriendshipState = await getFriendshipStateForProfileViewer(currentUserId, otherUserId);

    return createSuccessfulFriendshipMutationResult(currentUserFriendshipState);
}

// Возвращает понятную ошибку вместе с фактическим состоянием отношений из БД.
// Клиент покажет сообщение, но при этом сразу заменит устаревшие кнопки правильными.
async function getFailedResultWithCurrentFriendshipState(
    currentUserId: string,
    otherUserId: string,
    error: string,
): Promise<CurrentUserFriendshipMutationResult> {
    const currentUserFriendshipState = await getFriendshipStateForProfileViewer(currentUserId, otherUserId);

    return createFailedFriendshipMutationResult(error, currentUserFriendshipState);
}

// Активная запись могла измениться сразу после предварительного чтения.
// Поэтому перед ответом send ещё раз сверяем фактическое состояние.
async function getResultForExistingActiveFriendRequest(
    currentUserId: string,
    otherUserId: string,
): Promise<CurrentUserFriendshipMutationResult | null> {
    const currentUserFriendshipState = await getFriendshipStateForProfileViewer(currentUserId, otherUserId);

    // Запись успели удалить или отклонить: send должен повторить попытку записи.
    if (currentUserFriendshipState === CurrentUserFriendshipState.NOT_FRIENDS) {
        return null;
    }

    if (currentUserFriendshipState === CurrentUserFriendshipState.INCOMING_FRIEND_REQUEST) {
        return createFailedFriendshipMutationResult(
            "Этот пользователь уже отправил вам заявку — примите или отклоните её.",
            currentUserFriendshipState,
        );
    }

    return createSuccessfulFriendshipMutationResult(currentUserFriendshipState);
}

// --- ОТПРАВКА И ОБРАБОТКА ЗАЯВОК ---

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
    const friendshipPairKey = createFriendshipPairKey(currentUserId, normalizedReceiverUserId);

    // Каждая попытка либо записывает одну каноническую пару, либо повторяет чтение,
    // если другой запрос успел создать или перевести её в другой статус.
    for (let attempt = 0; attempt < SEND_FRIEND_REQUEST_MAX_ATTEMPTS; attempt += 1) {
        const existingFriendRequest = await getFriendRequestStatusForPair(friendshipPairKey);

        if (existingFriendRequest?.status === FriendRequestStatus.REJECTED) {
            // Обновляем только всё ещё REJECTED-запись. Если другой send был первым,
            // count === 0 заставит нас перечитать его направление, а не перезатереть его.
            const updateResult = await prisma.friendRequest.updateMany({
                where: {
                    pairKey: friendshipPairKey,
                    status: FriendRequestStatus.REJECTED,
                },
                data: {
                    senderId: currentUserId,
                    receiverId: normalizedReceiverUserId,
                    pairKey: friendshipPairKey,
                    status: FriendRequestStatus.PENDING,
                    createdAt: new Date(),
                },
            });

            if (updateResult.count === 0) {
                continue; // другой запрос успел изменить запись, поэтому повторяем чтение
            }

            revalidateFriendshipProfilePages(currentUserId, normalizedReceiverUserId);

            return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedReceiverUserId);
        }

        if (existingFriendRequest) {
            const existingRequestResult = await getResultForExistingActiveFriendRequest(
                currentUserId,
                normalizedReceiverUserId,
            );

            if (existingRequestResult) {
                return existingRequestResult;
            }

            continue; // запись успели удалить или отклонить
        }

        try {
            // create, а не read-then-upsert, позволяет различить победившее направление.
            // Уникальный pairKey не даст двум встречным create образовать две записи.
            await prisma.friendRequest.create({
                data: {
                    senderId: currentUserId,
                    receiverId: normalizedReceiverUserId,
                    pairKey: friendshipPairKey,
                },
            });
        } catch (error) {
            if (isPrismaUniqueConstraintError(error)) {
                continue;
            }

            throw error;
        }

        revalidateFriendshipProfilePages(currentUserId, normalizedReceiverUserId);

        return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedReceiverUserId);
    }

    // Если пара менялась на каждой попытке, возвращаем наиболее свежее состояние.
    // Клиент обновит кнопки и сможет безопасно повторить действие.
    const concurrentResult = await getResultForExistingActiveFriendRequest(
        currentUserId,
        normalizedReceiverUserId,
    );

    return (
        concurrentResult ??
        createFailedFriendshipMutationResult(
            "Состояние заявки изменилось. Попробуйте ещё раз.",
            CurrentUserFriendshipState.NOT_FRIENDS,
        )
    );
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
    const friendshipPairKey = createFriendshipPairKey(currentUserId, normalizedSenderUserId);

    // receiverId из сессии не позволяет принять заявку, адресованную другому пользователю.
    // pairKey однозначно выбирает пару, а updateMany атомарно проверяет направление и PENDING.
    const updateResult = await prisma.friendRequest.updateMany({
        where: {
            pairKey: friendshipPairKey,
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
        const existingFriendRequest = await getFriendRequestStatusForPair(friendshipPairKey);

        // Повторное принятие идемпотентно: интерфейс всё равно получает верное состояние.
        if (existingFriendRequest?.status === FriendRequestStatus.ACCEPTED) {
            return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedSenderUserId);
        }

        // Если другой запрос уже успел отклонить заявку, принимать её больше нельзя.
        if (existingFriendRequest?.status === FriendRequestStatus.REJECTED) {
            return getFailedResultWithCurrentFriendshipState(
                currentUserId,
                normalizedSenderUserId,
                "Эта заявка уже отклонена.",
            );
        }

        // Если между update и чтением появилась новая PENDING-заявка, не принимаем её неявно.
        if (existingFriendRequest?.status === FriendRequestStatus.PENDING) {
            return getFailedResultWithCurrentFriendshipState(
                currentUserId,
                normalizedSenderUserId,
                "Состояние заявки изменилось. Проверьте актуальные кнопки.",
            );
        }

        // Отправитель мог отменить заявку, пока в открытой вкладке ещё видны старые кнопки.
        return getFailedResultWithCurrentFriendshipState(
            currentUserId,
            normalizedSenderUserId,
            "Пользователь уже отменил эту заявку.",
        );
    }

    // count > 0: заявка только что стала ACCEPTED, поэтому обновляем оба профиля.
    revalidateFriendshipProfilePages(currentUserId, normalizedSenderUserId);

    return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedSenderUserId);
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
    const friendshipPairKey = createFriendshipPairKey(currentUserId, normalizedSenderUserId);

    // Меняем только входящую PENDING-заявку текущего пользователя.
    // Так нельзя отклонить чужую, уже принятую или уже отклонённую заявку.
    const updateResult = await prisma.friendRequest.updateMany({
        where: {
            pairKey: friendshipPairKey,
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
        const existingFriendRequest = await getFriendRequestStatusForPair(friendshipPairKey);

        // Повторное отклонение также не должно превращаться в ошибку интерфейса.
        if (existingFriendRequest?.status === FriendRequestStatus.REJECTED) {
            return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedSenderUserId);
        }

        // Принятую заявку нельзя задним числом отклонить этой операцией.
        if (existingFriendRequest?.status === FriendRequestStatus.ACCEPTED) {
            return getFailedResultWithCurrentFriendshipState(
                currentUserId,
                normalizedSenderUserId,
                "Эта заявка уже принята.",
            );
        }

        // Новая PENDING-заявка могла появиться уже после update; такой новый запрос не отклоняем неявно.
        if (existingFriendRequest?.status === FriendRequestStatus.PENDING) {
            return getFailedResultWithCurrentFriendshipState(
                currentUserId,
                normalizedSenderUserId,
                "Состояние заявки изменилось. Проверьте актуальные кнопки.",
            );
        }

        // Отправитель мог отменить заявку, пока в открытой вкладке ещё видны старые кнопки.
        return getFailedResultWithCurrentFriendshipState(
            currentUserId,
            normalizedSenderUserId,
            "Пользователь уже отменил эту заявку.",
        );
    }

    // count > 0: заявка только что стала REJECTED, поэтому обновляем оба профиля.
    revalidateFriendshipProfilePages(currentUserId, normalizedSenderUserId);

    return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedSenderUserId);
}

// Отменяет только исходящую PENDING-заявку, отправленную текущим пользователем.
export async function cancelCurrentUserOutgoingFriendRequest(
    receiverUserId: string,
): Promise<CurrentUserFriendshipMutationResult> {
    const participants = await getValidatedFriendshipMutationParticipants(receiverUserId);

    // --- ПРОВЕРКА ОТПРАВИТЕЛЯ И ПОЛУЧАТЕЛЯ ---

    if (!participants.success) {
        return participants;
    }

    const { currentUserId, otherUserId: normalizedReceiverUserId } = participants;
    const friendshipPairKey = createFriendshipPairKey(currentUserId, normalizedReceiverUserId);

    // deleteMany объединяет проверку владельца, направления и статуса в одной операции.
    // Поэтому пользователь не сможет отменить входящую или уже принятую заявку.
    const deleteResult = await prisma.friendRequest.deleteMany({
        where: {
            pairKey: friendshipPairKey,
            senderId: currentUserId,
            receiverId: normalizedReceiverUserId,
            status: FriendRequestStatus.PENDING,
        },
    });

    // --- ОБРАБОТКА УСТАРЕВШЕГО СОСТОЯНИЯ ---

    // Ничего не удалилось: заявка могла быть отменена ранее или уже принята получателем.
    // Возвращаем реальное состояние, чтобы клиент показал правильные кнопки.
    if (deleteResult.count === 0) {
        return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedReceiverUserId);
    }

    // Заявка удалена, поэтому оба профиля должны заново получить состояние отношений.
    revalidateFriendshipProfilePages(currentUserId, normalizedReceiverUserId);

    // Обычно получим NOT_FRIENDS. Повторное чтение также учитывает редкую встречную заявку.
    return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedReceiverUserId);
}

// --- УПРАВЛЕНИЕ УЖЕ ПРИНЯТОЙ ДРУЖБОЙ ---

// Удаляет принятую дружбу между текущим пользователем и владельцем профиля.
export async function removeCurrentUserFriendship(
    otherUserId: string,
): Promise<CurrentUserFriendshipMutationResult> {
    const participants = await getValidatedFriendshipMutationParticipants(otherUserId);

    // --- ПРОВЕРКА ОБОИХ УЧАСТНИКОВ ДРУЖБЫ ---

    if (!participants.success) {
        return participants;
    }

    const { currentUserId, otherUserId: normalizedOtherUserId } = participants;
    const friendshipPairKey = createFriendshipPairKey(currentUserId, normalizedOtherUserId);

    // После принятия заявки направление больше не важно: удалить дружбу может любой участник.
    // pairKey собран из ID текущего и проверенного второго пользователя,
    // поэтому фильтр не может затронуть отношения другой пары.
    const deleteResult = await prisma.friendRequest.deleteMany({
        where: {
            pairKey: friendshipPairKey,
            status: FriendRequestStatus.ACCEPTED,
        },
    });

    // --- ОБРАБОТКА УСТАРЕВШЕГО СОСТОЯНИЯ ---

    // Если дружбы уже нет, возвращаем текущее состояние вместо ложной общей ошибки.
    if (deleteResult.count === 0) {
        return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedOtherUserId);
    }

    // Принятая связь удалена — оба профиля должны заново получить состояние отношений.
    revalidateFriendshipProfilePages(currentUserId, normalizedOtherUserId);

    // Обычно получим NOT_FRIENDS, но запрос не потеряет возможную активную заявку.
    return getSuccessfulResultWithCurrentFriendshipState(currentUserId, normalizedOtherUserId);
}

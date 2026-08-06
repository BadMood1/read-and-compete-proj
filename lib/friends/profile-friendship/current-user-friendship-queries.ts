import "server-only";

import { FriendRequestStatus } from "@/app/generated/prisma/enums";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { createFriendshipPairKey } from "@/lib/friends/profile-friendship/create-friendship-pair-key";
import {
    CurrentUserFriendshipState,
    type CurrentUserFriendshipState as CurrentUserFriendshipStateValue,
} from "@/lib/friends/profile-friendship/current-user-friendship-state";
import prisma from "@/lib/prisma";

// --- ОПРЕДЕЛЕНИЕ СОСТОЯНИЯ ДЛЯ ДВУХ ИЗВЕСТНЫХ ПОЛЬЗОВАТЕЛЕЙ ---

// Считает состояние дружбы с точки зрения пользователя, который смотрит профиль.
// Отдельная функция нужна Server Actions, чтобы после мутации вернуть актуальное состояние UI.
export async function getFriendshipStateForProfileViewer(
    profileViewerUserId: string,
    profileOwnerUserId: string,
): Promise<CurrentUserFriendshipStateValue> {
    if (profileViewerUserId === profileOwnerUserId) {
        return CurrentUserFriendshipState.CURRENT_USER_PROFILE;
    }

    // Канонический ключ одинаков для A -> B и B -> A. Уникальность pairKey
    // гарантирует, что состояние не зависит от случайной записи findFirst.
    const friendshipPairKey = createFriendshipPairKey(
        profileViewerUserId,
        profileOwnerUserId,
    );
    const friendRequest = await prisma.friendRequest.findUnique({
        where: {
            pairKey: friendshipPairKey,
        },
        // Для определения состояния нужны только статус и направление заявки.
        select: {
            senderId: true,
            status: true,
        },
    });

    // Отклонённая заявка хранит историю, но активной связью не считается.
    if (!friendRequest || friendRequest.status === FriendRequestStatus.REJECTED) {
        return CurrentUserFriendshipState.NOT_FRIENDS;
    }

    // После принятия направление заявки уже не важно: пользователи являются друзьями.
    if (friendRequest.status === FriendRequestStatus.ACCEPTED) {
        return CurrentUserFriendshipState.FRIENDS;
    }

    // Для PENDING важно направление: ожидаем ответ другого пользователя или отвечаем сами.
    return friendRequest.senderId === profileViewerUserId
        ? CurrentUserFriendshipState.OUTGOING_FRIEND_REQUEST
        : CurrentUserFriendshipState.INCOMING_FRIEND_REQUEST;
}

// --- СОСТОЯНИЕ ДЛЯ ТЕКУЩЕГО АВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ ---

// Получает пользователя из сессии и определяет его отношения с владельцем открытого профиля.
export async function getCurrentUserFriendshipStateWithProfileUser(
    profileUserId: string,
): Promise<CurrentUserFriendshipStateValue | null> {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;
    const normalizedProfileUserId = profileUserId.trim();

    // null означает, что состояние нельзя определить без корректных ID обоих пользователей.
    if (!currentUserId || !normalizedProfileUserId) {
        return null;
    }

    return getFriendshipStateForProfileViewer(currentUserId, normalizedProfileUserId);
}

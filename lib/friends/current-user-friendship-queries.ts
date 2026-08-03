import "server-only";

import { FriendRequestStatus } from "@/app/generated/prisma/enums";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import {
    CurrentUserFriendshipState,
    type CurrentUserFriendshipState as CurrentUserFriendshipStateValue,
} from "@/lib/friends/current-user-friendship-state";
import prisma from "@/lib/prisma";

// Определяет отношения текущего пользователя с владельцем открытого профиля.
export async function getCurrentUserFriendshipStateWithProfileUser(
    profileUserId: string,
): Promise<CurrentUserFriendshipStateValue | null> {
    // Состояние всегда считается относительно вошедшего пользователя.
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;
    const normalizedProfileUserId = profileUserId.trim();

    // null означает, что состояние нельзя определить без корректных пользователей.
    if (!currentUserId || !normalizedProfileUserId) {
        return null;
    }

    if (currentUserId === normalizedProfileUserId) {
        return CurrentUserFriendshipState.CURRENT_USER_PROFILE;
    }

    // Ищем активную связь в обоих направлениях, потому что любой из пользователей
    // мог быть отправителем заявки. Отклонённая заявка активной связью не считается.
    const activeFriendRequest = await prisma.friendRequest.findFirst({
        where: {
            status: {
                in: [FriendRequestStatus.PENDING, FriendRequestStatus.ACCEPTED],
            },
            OR: [
                {
                    senderId: currentUserId,
                    receiverId: normalizedProfileUserId,
                },
                {
                    senderId: normalizedProfileUserId,
                    receiverId: currentUserId,
                },
            ],
        },
        // Для определения состояния нужны только статус и направление заявки.
        select: {
            senderId: true,
            status: true,
        },
    });

    // Нет активной записи — можно показать кнопку «Добавить в друзья».
    if (!activeFriendRequest) {
        return CurrentUserFriendshipState.NOT_FRIENDS;
    }

    // После принятия направление заявки уже не важно: пользователи являются друзьями.
    if (activeFriendRequest.status === FriendRequestStatus.ACCEPTED) {
        return CurrentUserFriendshipState.FRIENDS;
    }

    // Для PENDING важно направление: ожидаем ответ другого пользователя или отвечаем сами.
    return activeFriendRequest.senderId === currentUserId
        ? CurrentUserFriendshipState.OUTGOING_FRIEND_REQUEST
        : CurrentUserFriendshipState.INCOMING_FRIEND_REQUEST;
}

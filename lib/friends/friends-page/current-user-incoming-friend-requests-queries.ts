import "server-only";

import { FriendRequestStatus } from "@/app/generated/prisma/enums";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { createUserNameOrUsernameSearchFilter } from "@/lib/friends/friends-page/user-name-or-username-search-filter";
import prisma from "@/lib/prisma";

// Публичные данные отправителя и ID самой заявки, необходимые карточке списка.
export type CurrentUserIncomingFriendRequestSummary = {
    id: string;
    // При повторной отправке запись переиспользуется, но дата меняется и сбрасывает состояние карточки.
    createdAt: Date;
    sender: {
        id: string;
        username: string | null;
        name: string | null;
        image: string | null;
    };
};

// Возвращает только активные заявки, адресованные вошедшему пользователю.
export async function getCurrentUserIncomingFriendRequests(
    searchQuery = "",
): Promise<CurrentUserIncomingFriendRequestSummary[]> {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;
    const normalizedSearchQuery = searchQuery.trim();

    // Защищённый layout обычно не допустит этот случай, но запрос безопасен и сам по себе.
    if (!currentUserId) {
        return [];
    }

    return prisma.friendRequest.findMany({
        where: {
            receiverId: currentUserId,
            status: FriendRequestStatus.PENDING,
            // При активном поиске фильтруем имя или @username отправителя заявки.
            ...(normalizedSearchQuery
                ? {
                      sender: createUserNameOrUsernameSearchFilter(normalizedSearchQuery),
                  }
                : {}),
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            createdAt: true,
            sender: {
                // Email не нужен карточке и не покидает серверный слой запросов.
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true,
                },
            },
        },
    });
}

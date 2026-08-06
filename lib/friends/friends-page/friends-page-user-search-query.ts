import "server-only";

import { getCurrentSession } from "@/lib/auth/get-current-session";
import prisma from "@/lib/prisma";
import { FriendRequestStatus } from "@/app/generated/prisma/enums";

export type FriendsPageUserSearchResult = {
    id: string;
    name: string | null;
    image: string | null;
    hasOutgoingFriendRequest: boolean;
};

export async function searchUsersForFriendsPage(searchQuery: string): Promise<FriendsPageUserSearchResult[]> {
    const normalizedSearchQuery = searchQuery.trim();

    if (normalizedSearchQuery.length < 2) {
        return [];
    }

    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;

    // Защищённый layout обычно не допустит этот случай, но запрос безопасен и сам по себе.
    if (!currentUserId) {
        return [];
    }

    const users = await prisma.user.findMany({
        where: {
            id: {
                not: currentUserId,
            },
            name: {
                contains: normalizedSearchQuery,
                mode: "insensitive",
            },

            // Найденный пользователь не должен быть нашим другом
            // или автором уже показанной входящей заявки.
            // отправленные нам запросы:
            sentFriendRequests: {
                none: {
                    receiverId: currentUserId,
                    status: {
                        in: [FriendRequestStatus.PENDING, FriendRequestStatus.ACCEPTED],
                    },
                },
            },

            // Исключаем дружбу, которую когда-то инициировали мы.
            // PENDING здесь не исключаем: такого пользователя ещё нужно показать.
            // отправленные от нас запросы:
            receivedFriendRequests: {
                none: {
                    senderId: currentUserId,
                    status: FriendRequestStatus.ACCEPTED,
                },
            },
        },
        select: {
            id: true,
            name: true,
            image: true,
            receivedFriendRequests: {
                where: {
                    senderId: currentUserId,
                    status: FriendRequestStatus.PENDING,
                },
                select: {
                    id: true,
                },
                take: 1,
            },
        },
        orderBy: {
            name: "asc",
        },
        take: 10, // Ограничиваем количество результатов, чтобы не перегружать интерфейс.
    });

    const mappedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        image: user.image,
        hasOutgoingFriendRequest: user.receivedFriendRequests.length > 0,
    }));

    return mappedUsers;
}

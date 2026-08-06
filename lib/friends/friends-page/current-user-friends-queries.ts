import "server-only";

import { FriendRequestStatus } from "@/app/generated/prisma/enums";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import prisma from "@/lib/prisma";

// Публичные данные одного друга, которых достаточно будущей карточке списка.
export type CurrentUserFriendSummary = {
    id: string;
    name: string | null;
    image: string | null;
};

// Возвращает принятых друзей вошедшего пользователя — независимо от того,
// кем он был в исходной заявке: отправителем или получателем.
export async function getCurrentUserFriends(
    searchQuery = "",
): Promise<CurrentUserFriendSummary[]> {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;
    const normalizedSearchQuery = searchQuery.trim();

    // Защищённый layout обычно не допустит этот случай, но запрос остаётся безопасным
    // и при случайном переиспользовании вне страницы /friends.
    if (!currentUserId) {
        return [];
    }

    const acceptedFriendships = await prisma.friendRequest.findMany({
        where: {
            status: FriendRequestStatus.ACCEPTED,
            // В каждой ветке ищем имя именно второго участника, а не текущего пользователя.
            OR: normalizedSearchQuery
                ? [
                      {
                          senderId: currentUserId,
                          receiver: {
                              name: {
                                  contains: normalizedSearchQuery,
                                  mode: "insensitive",
                              },
                          },
                      },
                      {
                          receiverId: currentUserId,
                          sender: {
                              name: {
                                  contains: normalizedSearchQuery,
                                  mode: "insensitive",
                              },
                          },
                      },
                  ]
                : [
                      // Без поиска направление не важно: текущий пользователь мог быть с любой стороны.
                      { senderId: currentUserId },
                      { receiverId: currentUserId },
                  ],
        },
        // updatedAt меняется при принятии заявки, поэтому свежие дружбы идут первыми.
        orderBy: {
            updatedAt: "desc",
        },
        select: {
            sender: {
                // Email и OAuth-данные не нужны карточке и не выходят из слоя запросов.
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            receiver: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    // FriendRequest хранит обоих участников, а UI нужен только тот, кто не является нами.
    return acceptedFriendships.map((friendship) =>
        friendship.sender.id === currentUserId ? friendship.receiver : friendship.sender,
    );
}

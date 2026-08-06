import "server-only";

import { FriendRequestStatus } from "@/app/generated/prisma/enums";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import prisma from "@/lib/prisma";

// Публичные данные отправителя и ID самой заявки, необходимые карточке списка.
export type CurrentUserIncomingFriendRequestSummary = {
    id: string;
    // При повторной отправке запись переиспользуется, но дата меняется и сбрасывает состояние карточки.
    createdAt: Date;
    sender: {
        id: string;
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
            // При активном поиске фильтруем имя отправителя заявки.
            ...(normalizedSearchQuery
                ? {
                      sender: {
                          name: {
                              contains: normalizedSearchQuery,
                              mode: "insensitive" as const,
                          },
                      },
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
                    name: true,
                    image: true,
                },
            },
        },
    });
}

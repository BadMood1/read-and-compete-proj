"use server";

import { revalidatePath } from "next/cache";

import { FriendRequestStatus } from "@/app/generated/prisma/enums";
import { auth } from "@/auth";
import { createFriendshipPairKey } from "@/lib/friends/profile-friendship/create-friendship-pair-key";
import prisma from "@/lib/prisma";
import { revalidateUserProfilePage } from "@/lib/profile/profile-page-revalidation";

// Успешный ответ возвращает реально сохранённую настройку, а ошибка — текст для UI.
export type UpdateCurrentUserLibraryVisibilityForFriendResult =
    | {
          success: true;
          isCurrentUserLibraryVisibleToFriend: boolean;
      }
    | {
          success: false;
          error: string;
      };

// Разрешает или запрещает конкретному другу видеть библиотеку текущего пользователя.
export async function updateCurrentUserLibraryVisibilityForFriend(
    friendUserId: string,
    isLibraryVisible: boolean,
): Promise<UpdateCurrentUserLibraryVisibilityForFriendResult> {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const normalizedFriendUserId =
        typeof friendUserId === "string" ? friendUserId.trim() : "";

    // ПРОВЕРКИ

    if (!currentUserId) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedFriendUserId) {
        return { success: false, error: "Не удалось определить пользователя." };
    }

    if (typeof isLibraryVisible !== "boolean") {
        return { success: false, error: "Неверное значение видимости библиотеки." };
    }

    if (currentUserId === normalizedFriendUserId) {
        return { success: false, error: "Нельзя выполнить это действие со своим профилем." };
    }

    const friendshipPairKey = createFriendshipPairKey(currentUserId, normalizedFriendUserId);

    const friendship = await prisma.friendRequest.findUnique({
        where: {
            pairKey: friendshipPairKey,
        },
        select: {
            id: true,
            senderId: true,
            receiverId: true,
            status: true,
        },
    });

    if (!friendship || friendship.status !== FriendRequestStatus.ACCEPTED) {
        return { success: false, error: "Пользователь не является вашим другом." };
    }

    const isCurrentUserSender = friendship.senderId === currentUserId;
    const isCurrentUserReceiver = friendship.receiverId === currentUserId;

    if (!isCurrentUserSender && !isCurrentUserReceiver) {
        return { success: false, error: "Текущий пользователь не участвует в этой дружбе." };
    }

    const newLibraryVisibilityUpdateData = isCurrentUserSender
        ? { senderLibraryVisibleToReceiver: isLibraryVisible }
        : { receiverLibraryVisibleToSender: isLibraryVisible };

    const updateResult = await prisma.friendRequest.updateMany({
        where: {
            id: friendship.id,
            status: FriendRequestStatus.ACCEPTED,
            ...(isCurrentUserSender
                ? {
                      senderId: currentUserId,
                      receiverId: normalizedFriendUserId,
                  }
                : {
                      senderId: normalizedFriendUserId,
                      receiverId: currentUserId,
                  }),
        },
        data: newLibraryVisibilityUpdateData,
    });

    if (updateResult.count === 0) {
        return {
            success: false,
            error: "Дружба изменилась. Обновите страницу и попробуйте ещё раз.",
        };
    }

    revalidatePath("/friends");
    revalidateUserProfilePage(currentUserId);
    revalidateUserProfilePage(normalizedFriendUserId);

    return {
        success: true,
        isCurrentUserLibraryVisibleToFriend: isLibraryVisible,
    };
}

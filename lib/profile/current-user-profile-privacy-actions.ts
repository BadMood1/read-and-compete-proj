"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidateUserProfilePage } from "@/lib/profile/profile-page-revalidation";

export type UpdateCurrentUserRecentFinishedBooksVisibilityForNonFriendsResult =
    | {
          success: true;
          recentFinishedBooksVisibleToNonFriends: boolean;
      }
    | {
          success: false;
          error: string;
      };

// Сохраняет общую видимость последних книг только для пользователей не в друзьях.
export async function updateCurrentUserRecentFinishedBooksVisibilityForNonFriends(
    recentFinishedBooksVisibleToNonFriends: boolean,
): Promise<UpdateCurrentUserRecentFinishedBooksVisibilityForNonFriendsResult> {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    // Server Action доступен как серверная точка входа, поэтому повторно проверяем значение клиента.
    if (typeof recentFinishedBooksVisibleToNonFriends !== "boolean") {
        return { success: false, error: "Неверное значение видимости профиля." };
    }

    try {
        const updatedUser = await prisma.user.update({
            where: {
                // ID из сессии не позволяет изменить настройку чужого профиля.
                id: currentUserId,
            },
            data: {
                recentFinishedBooksVisibleToNonFriends,
            },
            select: {
                recentFinishedBooksVisibleToNonFriends: true,
            },
        });

        revalidateUserProfilePage(currentUserId);

        return {
            success: true,
            recentFinishedBooksVisibleToNonFriends:
                updatedUser.recentFinishedBooksVisibleToNonFriends,
        };
    } catch (error) {
        console.error("Failed to update current user profile privacy.", error);

        return {
            success: false,
            error: "Не удалось сохранить настройку. Попробуйте ещё раз.",
        };
    }
}

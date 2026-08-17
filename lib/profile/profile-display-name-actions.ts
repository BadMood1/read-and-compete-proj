"use server";

import { refresh } from "next/cache";

import { auth } from "@/auth";
import {
    getProfileDisplayNameValidationError,
    normalizeProfileDisplayName,
} from "@/lib/profile/profile-display-name";
import prisma from "@/lib/prisma";

export type UpdateCurrentUserProfileDisplayNameResult =
    | {
          success: true;
          displayName: string;
      }
    | {
          success: false;
          error: string;
      };

// Изменяет отображаемое имя только у пользователя из текущей серверной сессии.
export async function updateCurrentUserProfileDisplayName(
    displayName: string,
): Promise<UpdateCurrentUserProfileDisplayNameResult> {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    // Server Action доступна как POST-запрос, поэтому входное значение проверяем и во время выполнения.
    if (typeof displayName !== "string") {
        return { success: false, error: "Введите корректное имя." };
    }

    const normalizedDisplayName = normalizeProfileDisplayName(displayName);
    const validationError = getProfileDisplayNameValidationError(normalizedDisplayName);

    if (validationError) {
        return { success: false, error: validationError };
    }

    try {
        const updatedUser = await prisma.user.update({
            // ID берём из сессии, поэтому клиент не может изменить имя другого пользователя.
            where: {
                id: currentUserId,
            },
            data: {
                name: normalizedDisplayName,
            },
            select: {
                name: true,
            },
        });

        // Обновляем текущий серверный рендер: новое имя сразу появится и в профиле, и в Navbar.
        refresh();

        return {
            success: true,
            displayName: updatedUser.name ?? normalizedDisplayName,
        };
    } catch (error) {
        console.error("Failed to update current user display name.", error);

        return {
            success: false,
            error: "Не удалось изменить имя. Попробуйте ещё раз.",
        };
    }
}

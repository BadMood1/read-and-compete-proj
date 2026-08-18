"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/auth";
import {
    getProfileDisplayNameValidationError,
    normalizeProfileDisplayName,
} from "@/lib/profile/profile-display-name";
import {
    getProfileUsernameValidationError,
    normalizeProfileUsername,
} from "@/lib/profile/username/profile-username";
import prisma from "@/lib/prisma";

type ProfileIdentityField = "displayName" | "username";

type UpdateCurrentUserProfileIdentityInput = {
    displayName: string;
    username: string;
};

export type UpdateCurrentUserProfileIdentityResult =
    | {
          success: true;
          displayName: string;
          username: string;
      }
    | {
          success: false;
          error: string;
          errorField?: ProfileIdentityField;
      };

function isPrismaUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// Одним запросом сохраняет публичное имя и адрес профиля только текущего пользователя.
export async function updateCurrentUserProfileIdentity(
    input: UpdateCurrentUserProfileIdentityInput,
): Promise<UpdateCurrentUserProfileIdentityResult> {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    // Server Action остаётся публичной POST-точкой, поэтому не доверяем TypeScript-типу клиента.
    if (
        typeof input !== "object" ||
        input === null ||
        typeof input.displayName !== "string" ||
        typeof input.username !== "string"
    ) {
        return { success: false, error: "Введите корректные данные профиля." };
    }

    const normalizedDisplayName = normalizeProfileDisplayName(input.displayName);
    const displayNameValidationError = getProfileDisplayNameValidationError(normalizedDisplayName);

    if (displayNameValidationError) {
        return {
            success: false,
            error: displayNameValidationError,
            errorField: "displayName",
        };
    }

    const normalizedUsername = normalizeProfileUsername(input.username);
    const usernameValidationError = getProfileUsernameValidationError(normalizedUsername);

    if (usernameValidationError) {
        return {
            success: false,
            error: usernameValidationError,
            errorField: "username",
        };
    }

    try {
        const updatedUser = await prisma.user.update({
            where: {
                // ID берём из сессии: клиент не может отредактировать чужой профиль.
                id: currentUserId,
            },
            data: {
                name: normalizedDisplayName,
                username: normalizedUsername,
            },
            select: {
                name: true,
                username: true,
            },
        });

        return {
            success: true,
            displayName: updatedUser.name ?? normalizedDisplayName,
            username: updatedUser.username ?? normalizedUsername,
        };
    } catch (error) {
        // Предварительная проверка могла устареть, но unique-index всё равно не пропустит дубль.
        if (isPrismaUniqueConstraintError(error)) {
            return {
                success: false,
                error: "Этот username уже занят.",
                errorField: "username",
            };
        }

        console.error("Failed to update current user profile identity.", error);

        return {
            success: false,
            error: "Не удалось сохранить профиль. Попробуйте ещё раз.",
        };
    }
}

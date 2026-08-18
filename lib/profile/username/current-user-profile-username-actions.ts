"use server";

import { auth } from "@/auth";
import {
    getProfileUsernameValidationError,
    normalizeProfileUsername,
} from "@/lib/profile/username/profile-username";
import { isProfileUsernameAvailableForCurrentUser } from "@/lib/profile/username/profile-username-queries";

export type CheckCurrentUserProfileUsernameAvailabilityResult =
    | {
          success: true;
          username: string;
          isAvailable: boolean;
      }
    | {
          success: false;
          error: string;
      };

// Проверяет доступность для подсказки в UI. Окончательную защиту всё равно выполняет unique-index БД.
export async function checkCurrentUserProfileUsernameAvailability(
    profileUsername: string,
): Promise<CheckCurrentUserProfileUsernameAvailabilityResult> {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (typeof profileUsername !== "string") {
        return { success: false, error: "Введите корректный username." };
    }

    const normalizedProfileUsername = normalizeProfileUsername(profileUsername);
    const validationError = getProfileUsernameValidationError(normalizedProfileUsername);

    if (validationError) {
        return { success: false, error: validationError };
    }

    try {
        const isAvailable = await isProfileUsernameAvailableForCurrentUser(
            normalizedProfileUsername,
            currentUserId,
        );

        return {
            success: true,
            username: normalizedProfileUsername,
            isAvailable,
        };
    } catch (error) {
        console.error("Failed to check profile username availability.", error);

        return {
            success: false,
            error: "Не удалось проверить username. Попробуйте ещё раз.",
        };
    }
}

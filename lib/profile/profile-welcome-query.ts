import "server-only";

import { getAvailableProfileUsernameSuggestion } from "@/lib/profile/username/profile-username-queries";
import prisma from "@/lib/prisma";
import { getUserDisplayName } from "@/lib/users/user-display-name";

// Готовит сохранённые значения и свободное предложение username для welcome-формы.
export async function getProfileWelcomeData(currentUserId: string) {
    const normalizedCurrentUserId = currentUserId.trim();

    if (!normalizedCurrentUserId) {
        return null;
    }

    const currentUser = await prisma.user.findUnique({
        where: {
            id: normalizedCurrentUserId,
        },
        select: {
            name: true,
            username: true,
        },
    });

    if (!currentUser) {
        return null;
    }

    const displayName = getUserDisplayName(currentUser.name);
    const username =
        currentUser.username ??
        (await getAvailableProfileUsernameSuggestion({
            displayName,
            currentUserId: normalizedCurrentUserId,
        }));

    return {
        displayName,
        username,
    };
}

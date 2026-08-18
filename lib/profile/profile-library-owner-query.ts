import "server-only";

import prisma from "@/lib/prisma";

// Получает владельца по username и временно поддерживает старые ссылки с user ID.
export async function getProfileLibraryOwnerByIdentifier(profileIdentifier: string) {
    const normalizedProfileIdentifier = profileIdentifier.trim().toLowerCase();

    if (!normalizedProfileIdentifier) {
        return null;
    }

    return prisma.user.findFirst({
        where: {
            OR: [
                { username: normalizedProfileIdentifier },
                { id: normalizedProfileIdentifier },
            ],
        },
        // Email, аватар и OAuth-данные этой компактной странице не нужны.
        select: {
            id: true,
            name: true,
            username: true,
        },
    });
}

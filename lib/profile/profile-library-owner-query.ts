import "server-only";

import prisma from "@/lib/prisma";

// Получает только публичные данные, необходимые заголовку библиотеки профиля.
export async function getProfileLibraryOwnerById(profileUserId: string) {
    const normalizedProfileUserId = profileUserId.trim();

    if (!normalizedProfileUserId) {
        return null;
    }

    return prisma.user.findUnique({
        where: {
            id: normalizedProfileUserId,
        },
        // Email, аватар и OAuth-данные этой компактной странице не нужны.
        select: {
            id: true,
            name: true,
        },
    });
}

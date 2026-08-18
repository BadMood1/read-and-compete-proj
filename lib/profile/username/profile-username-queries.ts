import "server-only";

import {
    createProfileUsernameCandidate,
    generateProfileUsernameBaseFromDisplayName,
} from "@/lib/profile/username/profile-username";
import prisma from "@/lib/prisma";

const MAX_PROFILE_USERNAME_SEQUENCE_NUMBER = 999;

type GetAvailableProfileUsernameSuggestionOptions = {
    displayName: string;
    // При редактировании собственный сохранённый username не должен считаться занятым.
    currentUserId?: string;
};

// Проверяет конкретный нормализованный username. Совпадение с username текущего пользователя разрешено.
export async function isProfileUsernameAvailableForCurrentUser(
    profileUsername: string,
    currentUserId: string,
) {
    const existingUser = await prisma.user.findUnique({
        where: {
            username: profileUsername,
        },
        select: {
            id: true,
        },
    });

    return existingUser === null || existingUser.id === currentUserId;
}

// Предлагает первый свободный вариант: username, username1, username2 и так далее.
export async function getAvailableProfileUsernameSuggestion({
    displayName,
    currentUserId,
}: GetAvailableProfileUsernameSuggestionOptions) {
    const profileUsernameBase = generateProfileUsernameBaseFromDisplayName(displayName);
    const profileUsernameCandidates = [
        createProfileUsernameCandidate(profileUsernameBase, null),
        ...Array.from({ length: MAX_PROFILE_USERNAME_SEQUENCE_NUMBER }, (_, index) =>
            createProfileUsernameCandidate(profileUsernameBase, index + 1),
        ),
    ];

    // Запрашиваем только варианты, которые реально можем предложить, а не все username
    // с похожим началом. Так объём ответа остаётся ограниченным даже при большой базе.
    const matchingUsers = await prisma.user.findMany({
        where: {
            username: {
                in: profileUsernameCandidates,
            },
        },
        select: {
            id: true,
            username: true,
        },
    });
    const occupiedProfileUsernames = new Set(
        matchingUsers
            .filter((user) => user.id !== currentUserId)
            .flatMap((user) => (user.username ? [user.username] : [])),
    );

    for (const candidate of profileUsernameCandidates) {
        if (!occupiedProfileUsernames.has(candidate)) {
            return candidate;
        }
    }

    // Реально достичь лимита почти невозможно, но вызывающий код не должен получить занятое значение.
    throw new Error("Не удалось подобрать свободный username.");
}

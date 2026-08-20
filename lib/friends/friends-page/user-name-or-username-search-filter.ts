import type { Prisma } from "@/app/generated/prisma/client";
import { normalizeProfileUsername } from "@/lib/profile/username/profile-username";

// Создаёт один Prisma-фильтр для общей строки поиска по имени и @username.
// Начальный @ убирается только для сравнения с username: в базе он хранится без этого символа.
export function createUserNameOrUsernameSearchFilter(searchQuery: string): Prisma.UserWhereInput {
    const normalizedDisplayNameSearchQuery = searchQuery.trim();
    const normalizedUsernameSearchQuery = normalizeProfileUsername(searchQuery);
    const userSearchConditions: Prisma.UserWhereInput[] = [
        {
            name: {
                contains: normalizedDisplayNameSearchQuery,
                mode: "insensitive",
            },
        },
    ];

    // Не добавляем contains: "": такой фильтр ошибочно нашёл бы любого пользователя.
    if (normalizedUsernameSearchQuery) {
        userSearchConditions.push({
            username: {
                contains: normalizedUsernameSearchQuery,
                mode: "insensitive",
            },
        });
    }

    return {
        OR: userSearchConditions,
    };
}

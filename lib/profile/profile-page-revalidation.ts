import "server-only";

import { revalidatePath } from "next/cache";

import { createProfilePath } from "@/lib/profile/profile-navigation";

// После пользовательской мутации профиль должен заново получить статистику и последние книги.
export function revalidateUserProfilePage(userId: string) {
    // Пока часть ссылок ещё содержит ID, обновляем и этот конкретный совместимый URL.
    revalidatePath(createProfilePath(userId));

    // Канонический URL использует username, которого у вызывающей мутации может не быть.
    // Паттерн обновляет все страницы профилей без дополнительного запроса пользователя.
    revalidatePath("/(app)/profile/[username]", "page");
}

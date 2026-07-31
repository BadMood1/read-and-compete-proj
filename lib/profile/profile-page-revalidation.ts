import "server-only";

import { revalidatePath } from "next/cache";

import { createProfilePath } from "@/lib/profile/profile-navigation";

// После пользовательской мутации профиль должен заново получить статистику и последние книги.
export function revalidateUserProfilePage(userId: string) {
    revalidatePath(createProfilePath(userId));
}

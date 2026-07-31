import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/get-current-session";
import { createProfilePath } from "@/lib/profile/profile-navigation";

// Короткий адрес /profile всегда открывает профиль текущего пользователя.
export default async function CurrentUserProfilePage() {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        redirect("/login");
    }

    redirect(createProfilePath(currentUserId));
}

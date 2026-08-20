import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
    redirectToLoginFromCurrentPage,
    redirectToWelcomeFromCurrentPage,
} from "@/lib/auth/current-page-authentication-redirects";
import { createProfilePath } from "@/lib/profile/profile-navigation";

// /profile — только короткий адрес: отправляем пользователя на его публичный URL до рендера UI.
export async function GET() {
    // Route Handler не проходит через layout, поэтому самостоятельно проверяем сессию.
    const session = await auth();
    const currentUserId = session?.user?.id;
    const currentUsername = session?.user?.username;

    if (!currentUserId) {
        return redirectToLoginFromCurrentPage();
    }

    if (!currentUsername) {
        return redirectToWelcomeFromCurrentPage();
    }

    redirect(createProfilePath(currentUsername));
}

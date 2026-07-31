import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createProfilePath } from "@/lib/profile/profile-navigation";

// /profile — только короткий адрес: отправляем пользователя на его публичный URL до рендера UI.
export async function GET() {
    // Route Handler не проходит через layout, поэтому самостоятельно проверяем сессию.
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        redirect("/login");
    }

    redirect(createProfilePath(currentUserId));
}

// мы создаем route.ts в app папке, то по запросу по /profile
//  вместо page.tsx вызывается GET из route.ts и layout не рендерится

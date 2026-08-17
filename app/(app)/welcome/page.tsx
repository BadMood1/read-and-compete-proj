import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { ProfileWelcomeDisplayNameEditor } from "@/components/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { getUserDisplayName } from "@/lib/users/user-display-name";

// Auth.js открывает страницу после первого OAuth-входа; вручную её также можно открыть для теста.
export default async function WelcomePage() {
    // Layout уже вызывает эту функцию, а React cache повторно использует результат в одном рендере.
    const session = await getCurrentSession();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const initialDisplayName = getUserDisplayName(session.user.name);

    return (
        <main className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6">
            <Card className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-[0_24px_70px_rgba(50,35,25,0.10)]">
                <CardHeader className="px-6 pt-3 text-center sm:px-8">
                    <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                        <Sparkles className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="text-2xl font-semibold">Как к вам обращаться?</CardTitle>
                    <CardDescription className="mx-auto mt-1 max-w-sm leading-6">
                        Выберите имя для своего профиля. Его можно изменить в любой момент.
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-3 sm:px-8">
                    <ProfileWelcomeDisplayNameEditor initialDisplayName={initialDisplayName} />
                </CardContent>
            </Card>
        </main>
    );
}

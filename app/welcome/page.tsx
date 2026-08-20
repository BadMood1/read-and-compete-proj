import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ProfileWelcomeIdentityEditor } from "@/components/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    createLoginPagePathWithReturnPath,
    getValidatedAuthenticationReturnPath,
} from "@/lib/auth/authentication-return-path";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { getProfileWelcomeData } from "@/lib/profile/profile-welcome-query";

type WelcomePageProps = {
    searchParams: Promise<{
        returnPath?: string | string[];
    }>;
};

// Suspense сразу показывает форму-заглушку, пока сервер проверяет сессию и подбирает username.
export default function WelcomePage({ searchParams }: WelcomePageProps) {
    return (
        <Suspense fallback={<WelcomePageSkeleton />}>
            <WelcomePageContent searchParams={searchParams} />
        </Suspense>
    );
}

// После каждого OAuth-входа готовый профиль проходит дальше, а новый пользователь видит форму.
async function WelcomePageContent({ searchParams }: WelcomePageProps) {
    const [session, resolvedSearchParams] = await Promise.all([
        getCurrentSession(),
        searchParams,
    ]);
    const returnPath = getValidatedAuthenticationReturnPath(
        resolvedSearchParams.returnPath,
    );

    if (!session?.user?.id) {
        redirect(createLoginPagePathWithReturnPath(returnPath));
    }

    // Существующему пользователю форма не нужна: welcome работает как короткий continuation-gate.
    if (session.user.username) {
        redirect(returnPath);
    }

    const welcomeData = await getProfileWelcomeData(session.user.id);

    if (!welcomeData) {
        redirect(createLoginPagePathWithReturnPath(returnPath));
    }

    return (
        <main className="flex min-h-svh w-full items-center justify-center px-4 py-10 sm:px-6">
            <Card className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-[0_24px_70px_rgba(50,35,25,0.10)]">
                <CardHeader className="px-6 pt-3 text-center sm:px-8">
                    <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                        <Sparkles className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="text-2xl font-semibold">Настроим профиль</CardTitle>
                    <CardDescription className="mx-auto mt-1 max-w-sm leading-6">
                        Выберите имя и username для ссылки на ваш профиль.
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-3 sm:px-8">
                    <ProfileWelcomeIdentityEditor
                        initialDisplayName={welcomeData.displayName}
                        initialUsername={welcomeData.username}
                        returnPath={returnPath}
                    />
                </CardContent>
            </Card>
        </main>
    );
}

// Повторяет размеры карточки, чтобы готовая форма появилась без скачка интерфейса.
function WelcomePageSkeleton() {
    return (
        <main
            className="flex min-h-svh w-full items-center justify-center px-4 py-10 sm:px-6"
            role="status"
            aria-label="Загрузка настройки профиля"
        >
            <Card className="w-full max-w-lg animate-pulse rounded-3xl border border-border bg-card shadow-[0_24px_70px_rgba(50,35,25,0.10)]">
                <CardHeader className="px-6 pt-3 text-center sm:px-8">
                    <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary">
                        <Sparkles className="size-5 text-primary/25" aria-hidden="true" />
                    </span>

                    <div className="mx-auto h-7 w-48 rounded-md bg-muted" />

                    <div className="mx-auto mt-2 h-4 w-full max-w-sm rounded-md bg-muted" />
                </CardHeader>

                <CardContent className="space-y-5 px-6 pb-3 sm:px-8">
                    {/* Display name */}
                    <div>
                        <div className="h-5 w-32 rounded-md bg-muted" />

                        <div className="mt-2 h-4 w-64 max-w-full rounded-md bg-muted" />

                        <div className="mt-3 h-12 w-full rounded-xl bg-muted" />

                        {/* Место под сообщение валидации */}
                        <div className="h-6" />
                    </div>

                    {/* Username */}
                    <div>
                        <div className="h-5 w-24 rounded-md bg-muted" />

                        <div className="mt-2 h-4 w-72 max-w-full rounded-md bg-muted" />

                        <div className="mt-3 h-12 w-full rounded-xl bg-muted" />

                        {/* Место под статус username */}
                        <div className="h-6" />
                    </div>

                    {/* Место под общую ошибку формы */}
                    <div className="h-5" />

                    {/* Кнопка */}
                    <div className="flex justify-end">
                        <div className="h-11 w-32 rounded-xl bg-primary/20" />
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}

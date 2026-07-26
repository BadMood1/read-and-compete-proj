import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";

// Сразу показывает fallback, пока проверяется сессия пользователя.
export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Suspense fallback={<AppLayoutLoading />}>
            <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>
        </Suspense>
    );
}

// Динамическая часть layout: auth() выполняется только во время запроса.
async function AuthenticatedAppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();

    // Неавторизованный пользователь не должен увидеть защищённые страницы.
    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-svh flex-col">
            <Navbar user={session.user} />
            {children}
        </div>
    );
}

// Повторяет размеры настоящего Navbar, чтобы после загрузки интерфейс не смещался.
function AppLayoutLoading() {
    return (
        <div className="flex min-h-svh flex-col" role="status" aria-label="Загрузка приложения">
            <header className="border-b border-border/70 bg-card/90 shadow-[0_5px_24px_rgba(48,36,28,0.07)]">
                <nav className="mx-auto flex h-16 w-full max-w-7xl animate-pulse items-center justify-between gap-3 px-4 sm:px-6">
                    {/* Заглушки логотипа и названия приложения. */}
                    <div className="flex shrink-0 items-center gap-2.5">
                        <span className="size-9 rounded-xl bg-secondary/70" />
                        <span className="hidden h-5 w-32 rounded-md bg-muted sm:block" />
                    </div>

                    {/* На мобильном ссылки выглядят как иконки, а на desktop включают текст. */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <span
                                    key={index}
                                    className="h-9 w-9 rounded-lg bg-muted md:w-24"
                                />
                            ))}
                        </div>
                        <span className="size-9 rounded-full bg-muted" />
                    </div>
                </nav>
            </header>
        </div>
    );
}

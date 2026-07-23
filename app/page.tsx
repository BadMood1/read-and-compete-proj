import { BookOpen, CheckCircle2 } from "lucide-react";

import { auth } from "@/auth";
import { SignInButton, SignOutButton } from "@/components/auth-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
    // auth() читает серверную сессию — SessionProvider на клиенте не нужен.
    const session = await auth();
    const user = session?.user;
    console.log(session);
    const displayName = user?.name ?? "Читатель";
    const initials = displayName
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <main className="flex min-h-svh flex-1 items-center justify-center bg-muted/40 px-4 py-10">
            <div className="w-full max-w-md space-y-6">
                <header className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <BookOpen className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Read &amp; Compete</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Читай, следи за прогрессом и соревнуйся с друзьями
                        </p>
                    </div>
                </header>

                {user ? (
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mb-2 flex justify-center">
                                <Avatar size="lg" className="size-16">
                                    {user.image ? <AvatarImage src={user.image} alt={displayName} /> : null}
                                    <AvatarFallback className="text-lg">{initials || "RC"}</AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle className="text-lg">{displayName}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <CheckCircle2 className="size-4 shrink-0" />
                                Авторизация работает, сессия получена
                            </div>

                            {user.id ? (
                                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        ID пользователя из Prisma
                                    </p>
                                    <p className="mt-1 break-all font-mono text-xs">{user.id}</p>
                                </div>
                            ) : null}
                        </CardContent>

                        <CardFooter>
                            <SignOutButton />
                        </CardFooter>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Добро пожаловать</CardTitle>
                            <CardDescription>
                                Войди через один из подключённых провайдеров. После callback пользователь и
                                сессия сохранятся в PostgreSQL.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <SignInButton provider="github" />
                            <SignInButton provider="google" />
                        </CardContent>

                        <CardFooter className="justify-center text-center text-xs text-muted-foreground">
                            Пароли не хранятся — вход обрабатывают GitHub и Google
                        </CardFooter>
                    </Card>
                )}
            </div>
        </main>
    );
}

"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type LeaderboardPageErrorProps = {
    error: Error & {
        digest?: string;
    };
    unstable_retry: () => void;
};

// Перехватывает неожиданные ошибки рейтинга, не ломая весь защищённый layout.
export default function LeaderboardPageError({
    error,
    unstable_retry,
}: LeaderboardPageErrorProps) {
    useEffect(() => {
        // В production сюда позже можно подключить сервис сбора ошибок.
        console.error(error);
    }, [error]);

    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
            <section
                className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-destructive/30 bg-card/45 px-6 py-10 text-center"
                aria-labelledby="leaderboard-error-title"
            >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <TriangleAlert className="size-5" aria-hidden="true" />
                </span>

                <h1 id="leaderboard-error-title" className="mt-4 text-xl font-semibold">
                    Не удалось загрузить рейтинг
                </h1>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Возможно, база данных временно недоступна. Повторите попытку через несколько
                    секунд.
                </p>

                <Button type="button" size="lg" className="mt-6" onClick={unstable_retry}>
                    <RefreshCw aria-hidden="true" />
                    Повторить
                </Button>
            </section>
        </main>
    );
}

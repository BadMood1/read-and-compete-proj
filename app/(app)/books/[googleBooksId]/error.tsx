"use client";

import { RefreshCw, Search, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type BookPageErrorProps = {
    error: Error & {
        digest?: string;
    };
    unstable_retry: () => void;
};

// Перехватывает временные ошибки страницы книги, не подменяя их состоянием 404.
export default function BookPageError({ error, unstable_retry }: BookPageErrorProps) {
    useEffect(() => {
        // В production это место позже можно подключить к сервису сбора ошибок.
        console.error(error);
    }, [error]);

    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
            <section className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-destructive/30 bg-card/45 px-6 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <TriangleAlert className="size-5" aria-hidden="true" />
                </span>

                <h1 className="mt-4 text-xl font-semibold">Не удалось загрузить книгу</h1>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Возможно, источник данных временно недоступен. Повторите попытку или вернитесь к
                    поиску книг.
                </p>

                <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2">
                    <Button type="button" size="lg" className="min-w-0" onClick={unstable_retry}>
                        <RefreshCw aria-hidden="true" />
                        Повторить
                    </Button>
                    <Button asChild variant="outline" size="lg" className="min-w-0">
                        <Link href="/">
                            <Search aria-hidden="true" />
                            К поиску
                        </Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}

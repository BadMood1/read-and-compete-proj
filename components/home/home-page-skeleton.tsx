// Повторяет начальное состояние главной, пока Next.js получает параметры текущего URL.
export function HomePageSkeleton() {
    return (
        <section
            className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-8"
            role="status"
        >
            <span className="sr-only">Загружаем поиск книг...</span>

            <div className="motion-safe:animate-pulse" aria-hidden="true">
                {/* Вводный текст сохраняет высоту настоящего заголовка на мобильном и desktop. */}
                <div>
                    <div className="h-4 w-20 rounded-full bg-primary/20" />

                    <div className="mt-2 space-y-2 sm:space-y-0">
                        <div className="h-9 w-full max-w-sm rounded-lg bg-muted sm:h-12 sm:max-w-xl" />
                        <div className="h-9 w-28 rounded-lg bg-muted sm:hidden" />
                    </div>

                    <div className="mt-4 space-y-2">
                        <div className="h-4 w-full max-w-4xl rounded-full bg-muted" />
                        <div className="h-4 w-full rounded-full bg-muted sm:hidden" />
                        <div className="h-4 w-3/4 rounded-full bg-muted sm:hidden" />
                    </div>
                </div>

                {/* На мобильном flex-none не даёт полю поиска потерять заданную высоту. */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <div className="relative h-12 w-full flex-none rounded-xl border border-input bg-card sm:min-w-0 sm:flex-1">
                        <div className="absolute top-1/2 left-4 size-5 -translate-y-1/2 rounded-md bg-muted" />
                        <div className="absolute top-1/2 left-12 h-4 w-52 max-w-[60%] -translate-y-1/2 rounded-full bg-muted" />
                    </div>
                    <div className="h-12 w-full flex-none rounded-xl bg-primary/25 sm:w-28" />
                </div>

                {/* Заглушка соответствует пустому состоянию до первого поиска. */}
                <div className="mt-12 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/45 px-6 text-center">
                    <div className="size-12 rounded-2xl bg-secondary/70" />
                    <div className="mt-4 h-5 w-36 rounded-md bg-muted" />
                    <div className="mt-3 h-4 w-full max-w-sm rounded-full bg-muted" />
                    <div className="mt-2 h-4 w-56 max-w-[80%] rounded-full bg-muted" />
                </div>
            </div>
        </section>
    );
}

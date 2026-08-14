const LEADERBOARD_ROW_NAME_WIDTHS = [
    "w-28",
    "w-36",
    "w-24",
    "w-32",
    "w-28",
] as const;

// Повторяет размеры фильтров и списка, пока сервер рассчитывает рейтинг.
export function LeaderboardPageSkeleton() {
    return (
        <div role="status">
            <span className="sr-only">Загружаем рейтинг...</span>

            <div className="motion-safe:animate-pulse" aria-hidden="true">
                {/* Панель выбора метрики и периода. */}
                <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
                    <div className="grid gap-5 md:flex md:items-end md:justify-between">
                        <div>
                            <div className="mb-2 h-3 w-20 rounded-full bg-muted" />
                            <div className="grid grid-cols-2 rounded-xl bg-muted p-1 sm:w-fit">
                                <div className="h-9 w-full rounded-lg bg-background/70 sm:w-20" />
                                <div className="h-9 w-full sm:w-24" />
                            </div>
                        </div>

                        <div className="min-w-0 md:ml-auto md:w-md">
                            <div className="mb-2 h-3 w-16 rounded-full bg-muted md:ml-auto" />
                            <div className="grid grid-cols-4 rounded-xl bg-muted p-1">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className={
                                            index === 1
                                                ? "h-9 rounded-lg bg-background/70"
                                                : "h-9 rounded-lg"
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Состав участников, даты и строки будущего рейтинга. */}
                <div className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="grid h-11 w-44 grid-cols-2 rounded-xl bg-muted p-1">
                                <div className="rounded-lg bg-background/70" />
                                <div className="rounded-lg" />
                            </div>
                            <div className="mt-2 h-4 w-40 rounded-full bg-muted" />
                        </div>

                        <div className="h-4 w-16 rounded-full bg-muted" />
                    </div>

                    <div className="mt-4 space-y-1 border-t border-border pt-2">
                        {LEADERBOARD_ROW_NAME_WIDTHS.map((nameWidthClassName, index) => (
                            <div
                                key={`${nameWidthClassName}-${index}`}
                                className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-transparent px-2 py-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:px-3"
                            >
                                <div className="size-8 justify-self-center rounded-full bg-muted" />

                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="size-10 shrink-0 rounded-full bg-muted" />
                                    <div
                                        className={`h-4 max-w-full rounded-full bg-muted ${nameWidthClassName}`}
                                    />
                                </div>

                                <div className="shrink-0">
                                    <div className="ml-auto h-4 w-16 rounded-full bg-muted" />
                                    <div className="mt-1.5 ml-auto h-3 w-12 rounded-full bg-muted" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

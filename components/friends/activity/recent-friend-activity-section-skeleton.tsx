// Повторяет размеры готовой секции, пока сервер получает персональную активность друзей.
export function RecentFriendActivitySectionSkeleton() {
    return (
        <section
            className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
            role="status"
        >
            <span className="sr-only">Загружаем активность друзей...</span>

            <div className="motion-safe:animate-pulse" aria-hidden="true">
                {/* Иконка, заголовок и описание секции. */}
                <div className="flex items-start gap-3">
                    <div className="size-11 shrink-0 rounded-2xl bg-secondary" />
                    <div className="flex-1 pt-0.5">
                        <div className="h-4 w-40 rounded-full bg-muted" />
                        <div className="mt-3 h-3 w-full max-w-80 rounded-full bg-muted" />
                    </div>
                </div>

                {/* Карточки повторяют адаптивную сетку готовых событий. */}
                <div className="mt-6 grid items-stretch gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="@container h-full min-w-0 rounded-2xl border border-border bg-background/55 p-3"
                        >
                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-b border-border pb-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="size-8 shrink-0 rounded-full bg-muted" />
                                    <div className="min-w-0 flex-1">
                                        <div className="h-3.5 w-full max-w-28 rounded-full bg-muted" />
                                        <div className="mt-2 h-3 w-full max-w-24 rounded-full bg-muted" />
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    <div className="h-3 w-16 rounded-full bg-muted" />
                                    {index % 3 !== 0 ? (
                                        <div className="mt-1 ml-auto h-5 w-10 rounded-full bg-muted" />
                                    ) : null}
                                </div>
                            </div>

                            <div className="mt-3 flow-root min-w-0">
                                <div className="float-left mr-3 mb-1 aspect-2/3 w-12 rounded-lg bg-secondary/70" />
                                <div className="h-3.5 w-4/5 rounded-full bg-muted @max-[300px]:mx-auto" />

                                <div className="mt-3 space-y-2">
                                    <div className="h-3 w-full rounded-full bg-muted" />
                                    <div className="h-3 w-4/5 rounded-full bg-muted" />

                                    {index % 2 === 1 ? (
                                        <div className="h-3 w-3/5 rounded-full bg-muted" />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

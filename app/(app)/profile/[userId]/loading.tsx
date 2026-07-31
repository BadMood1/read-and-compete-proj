export default function ProfileLoading() {
    return (
        <main
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8"
            role="status"
        >
            <span className="sr-only">Загружаем профиль...</span>

            <div className="animate-pulse space-y-6" aria-hidden="true">
                {/* Повторяет крупный верхний блок с аватаром, именем и кнопкой. */}
                <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
                    <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                        <div className="size-24 shrink-0 rounded-full bg-secondary/70 sm:size-28" />

                        <div className="flex min-w-0 flex-1 flex-col items-center sm:items-start">
                            <div className="h-3 w-32 rounded-full bg-muted" />
                            <div className="mt-3 h-9 w-48 max-w-full rounded-xl bg-muted sm:h-10 sm:w-64" />
                            <div className="mt-3 h-4 w-full max-w-80 rounded-full bg-muted" />
                        </div>

                        <div className="h-11 w-44 rounded-xl bg-muted" />
                    </div>
                </section>

                {/* Повторяет четыре карточки статистики: две в ряд на узком экране. */}
                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
                        >
                            <div className="flex items-center gap-2">
                                <div className="size-10 shrink-0 rounded-xl bg-secondary/60" />
                                <div className="h-4 w-20 rounded-full bg-muted" />
                            </div>
                            <div className="mt-5 h-8 w-24 rounded-lg bg-muted sm:h-9" />
                            {index === 3 ? (
                                <div className="mt-2 h-3 w-28 rounded-full bg-muted" />
                            ) : null}
                        </div>
                    ))}
                </section>

                {/* Повторяет секцию последних книг и пропорции их обложек. */}
                <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                    <div className="h-3 w-32 rounded-full bg-muted" />
                    <div className="mt-3 h-7 w-60 max-w-full rounded-lg bg-muted" />

                    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-border bg-background p-3"
                            >
                                <div className="aspect-2/3 rounded-xl bg-secondary/65" />
                                <div className="px-0.5 pb-1 pt-3">
                                    <div className="h-5 w-full rounded-md bg-muted" />
                                    <div className="mt-2 h-4 w-3/4 rounded-full bg-muted" />
                                    <div className="mt-3 h-3 w-4/5 rounded-full bg-muted" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

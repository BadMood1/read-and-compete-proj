const READING_STATUS_SKELETON_WIDTHS = [
    "w-12",
    "w-32",
    "w-20",
    "w-24",
    "w-20",
    "w-20",
] as const;

type LibraryPageSkeletonProps = {
    variant: "current-user" | "profile";
};

// Повторяет пропорции книжной карточки, пока записи библиотеки загружаются с сервера.
function LibraryBookCardSkeleton() {
    return (
        <article className="grid min-h-48 grid-cols-[88px_1fr] gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[104px_1fr] sm:gap-5">
            <div className="aspect-2/3 rounded-lg bg-secondary/70" />

            <div className="flex min-w-0 flex-col">
                <div className="h-5 w-4/5 rounded-md bg-muted" />
                <div className="mt-2 h-5 w-2/3 rounded-md bg-muted" />
                <div className="mt-3 h-4 w-1/2 rounded-full bg-muted" />
                <div className="mt-2 h-3 w-24 rounded-full bg-muted" />

                <div className="mt-auto h-8 w-32 rounded-full border border-border bg-background" />
            </div>
        </article>
    );
}

// Общий каркас используется личной библиотекой и библиотекой из чужого профиля.
export function LibraryPageSkeleton({ variant }: LibraryPageSkeletonProps) {
    const isProfileLibrary = variant === "profile";

    return (
        <main
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8"
            role="status"
        >
            <span className="sr-only">
                {isProfileLibrary
                    ? "Загружаем библиотеку пользователя..."
                    : "Загружаем вашу библиотеку..."}
            </span>

            <div className="motion-safe:animate-pulse" aria-hidden="true">
                <div className={isProfileLibrary ? "space-y-6" : undefined}>
                    {/* В чужой библиотеке перед заголовком находится ссылка назад к профилю. */}
                    {isProfileLibrary ? (
                        <div className="h-4 w-36 rounded-full bg-muted" />
                    ) : null}

                    {/* Компактный заголовок и счётчик совпадают с готовой страницей. */}
                    <div className="flex items-end justify-between gap-4">
                        <div
                            className={`h-4 max-w-[70%] rounded-full bg-primary/20 ${
                                isProfileLibrary ? "w-40" : "w-14"
                            }`}
                        />
                        <div className="h-4 w-16 rounded-full bg-muted" />
                    </div>

                    {/* Поиск складывается вертикально только на узком экране. */}
                    <div className="space-y-4">
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            {/* На мобильном flex-none сохраняет точную высоту; в строке поле занимает остаток ширины. */}
                            <div className="relative h-12 w-full flex-none rounded-xl border border-input bg-card sm:min-w-0 sm:flex-1">
                                <div className="absolute top-1/2 left-4 size-5 -translate-y-1/2 rounded-md bg-muted" />
                                <div className="absolute top-1/2 left-12 h-4 w-40 max-w-[55%] -translate-y-1/2 rounded-full bg-muted" />
                            </div>
                            <div className="h-12 w-full rounded-xl bg-primary/25 sm:w-28" />
                        </div>

                        {/* Ширина элементов приблизительно повторяет подписи реальных статусов. */}
                        <div className="flex flex-wrap gap-2">
                            {READING_STATUS_SKELETON_WIDTHS.map((widthClassName, index) => (
                                <div
                                    key={`${widthClassName}-${index}`}
                                    className={`h-9 rounded-full border ${widthClassName} ${
                                        index === 0
                                            ? "border-primary/30 bg-primary/20"
                                            : "border-border bg-card"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Сетка использует те же размеры и breakpoint, что и карточки библиотеки. */}
                <div className="mt-10 grid gap-4 lg:grid-cols-2">
                    <LibraryBookCardSkeleton />
                    <LibraryBookCardSkeleton />
                </div>
            </div>
        </main>
    );
}

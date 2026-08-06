// Повторяет сетку карточек и резервирует место до завершения запроса к БД.
export function FriendsListContentSkeleton() {
    return (
        <div className="mt-6" role="status" aria-label="Загружаем список друзей">
            <div
                className="grid gap-3 motion-safe:animate-pulse sm:grid-cols-2"
                aria-hidden="true"
            >
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex h-16 items-center gap-3 rounded-2xl border border-border bg-background p-3"
                    >
                        <span className="size-10 shrink-0 rounded-full bg-secondary/65" />
                        <div className="min-w-0 flex-1">
                            <div className="h-4 w-28 max-w-full rounded-md bg-muted" />
                            <div className="mt-2 h-3 w-20 max-w-full rounded-md bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

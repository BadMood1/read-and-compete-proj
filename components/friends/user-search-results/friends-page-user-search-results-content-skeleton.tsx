// Повторяет сетку результатов, пока сервер ищет пользователей в БД.
export function FriendsPageUserSearchResultsContentSkeleton() {
    return (
        <div
            className="mt-6 grid gap-3 motion-safe:animate-pulse sm:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Ищем других читателей"
        >
            {Array.from({ length: 3 }).map((_, index) => (
                <div
                    key={index}
                    className="flex h-20 items-center gap-3 rounded-2xl border border-border bg-background p-4"
                    aria-hidden="true"
                >
                    <span className="size-10 shrink-0 rounded-full bg-secondary/65" />
                    <div className="min-w-0 flex-1">
                        <div className="h-4 w-28 max-w-full rounded-md bg-muted" />
                        <div className="mt-2 h-3 w-32 max-w-full rounded-md bg-muted" />
                    </div>
                    <span className="size-4 shrink-0 rounded bg-muted" />
                </div>
            ))}
        </div>
    );
}

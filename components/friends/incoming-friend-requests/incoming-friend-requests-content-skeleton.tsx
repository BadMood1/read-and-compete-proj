// Повторяет карточки с двумя кнопками и сохраняет высоту секции до ответа БД.
export function IncomingFriendRequestsContentSkeleton() {
    return (
        <div
            className="mt-6 space-y-3 motion-safe:animate-pulse"
            role="status"
            aria-label="Загружаем входящие заявки"
        >
            {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border bg-background p-3">
                    <div className="flex items-center gap-3" aria-hidden="true">
                        <div className="size-10 shrink-0 rounded-full bg-secondary/65" />
                        <div className="min-w-0 flex-1">
                            <div className="h-4 w-28 max-w-full rounded-md bg-muted" />
                            <div className="mt-2 h-3 w-36 max-w-full rounded-md bg-muted" />
                        </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2" aria-hidden="true">
                        <div className="h-10 rounded-xl bg-primary/25" />
                        <div className="h-10 rounded-xl bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}

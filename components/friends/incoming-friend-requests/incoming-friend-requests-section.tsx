import { UserRoundCheck } from "lucide-react";
import { Suspense } from "react";

import { IncomingFriendRequestCard } from "@/components/friends/incoming-friend-requests/incoming-friend-request-card";
import { IncomingFriendRequestsContentSkeleton } from "@/components/friends/incoming-friend-requests/incoming-friend-requests-content-skeleton";
import { getCurrentUserIncomingFriendRequests } from "@/lib/friends/friends-page/current-user-incoming-friend-requests-queries";

type IncomingFriendRequestsSectionProps = {
    searchQueryPromise: Promise<string>;
};

type IncomingFriendRequestsContentProps = {
    searchQuery: string;
};

// Загружает только актуальные входящие заявки, подходящие под строку поиска.
async function IncomingFriendRequestsContent({ searchQuery }: IncomingFriendRequestsContentProps) {
    const incomingFriendRequests = await getCurrentUserIncomingFriendRequests(searchQuery);

    if (incomingFriendRequests.length === 0) {
        return (
            <div className="mt-6 flex min-h-52 flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-background/55 px-5 text-center">
                <div>
                    <p className="font-medium">
                        {searchQuery
                            ? "Среди заявок ничего не найдено"
                            : "Входящих заявок пока нет"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {searchQuery
                            ? "Попробуйте изменить запрос или очистить строку поиска."
                            : "Новые запросы на добавление в друзья появятся здесь."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ul className="mt-6 space-y-3">
            {incomingFriendRequests.map((friendRequest) => (
                <IncomingFriendRequestCard
                    key={`${friendRequest.id}-${friendRequest.createdAt.toISOString()}`}
                    sender={friendRequest.sender}
                />
            ))}
        </ul>
    );
}

// Меняет ключ внутреннего Suspense при новом q, чтобы старые заявки не зависали в UI.
async function IncomingFriendRequestsSearchResults({
    searchQueryPromise,
}: IncomingFriendRequestsSectionProps) {
    const searchQuery = await searchQueryPromise;

    return (
        <Suspense key={searchQuery} fallback={<IncomingFriendRequestsContentSkeleton />}>
            <IncomingFriendRequestsContent searchQuery={searchQuery} />
        </Suspense>
    );
}

// Внешний каркас и заголовок видны независимо от скорости сессии и запроса к БД.
export function IncomingFriendRequestsSection({
    searchQueryPromise,
}: IncomingFriendRequestsSectionProps) {
    return (
        <section
            aria-labelledby="incoming-friend-requests-heading"
            className="flex h-full flex-col rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                    <UserRoundCheck className="size-5 text-primary" aria-hidden="true" />
                </span>

                <div>
                    <h2
                        id="incoming-friend-requests-heading"
                        tabIndex={-1}
                        className="font-semibold outline-none"
                    >
                        Входящие заявки
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Здесь можно принять или отклонить заявки от других читателей.
                    </p>
                </div>
            </div>

            <Suspense fallback={<IncomingFriendRequestsContentSkeleton />}>
                <IncomingFriendRequestsSearchResults searchQueryPromise={searchQueryPromise} />
            </Suspense>
        </section>
    );
}

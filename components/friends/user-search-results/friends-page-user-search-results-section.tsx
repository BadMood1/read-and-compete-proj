import { SearchX, UserSearch } from "lucide-react";
import { Suspense } from "react";

import { FriendUserSearchResultCard } from "@/components/friends/user-search-results/friend-user-search-result-card";
import { FriendsPageUserSearchResultsContentSkeleton } from "@/components/friends/user-search-results/friends-page-user-search-results-content-skeleton";
import { searchUsersForFriendsPage } from "@/lib/friends/friends-page/friends-page-user-search-query";

type FriendsPageUserSearchResultsSectionProps = {
    searchQueryPromise: Promise<string>;
};

type FriendsPageUserSearchResultsContentProps = {
    searchQuery: string;
};

// Выполняет общий поиск и превращает каждый результат в отдельную карточку.
async function FriendsPageUserSearchResultsContent({
    searchQuery,
}: FriendsPageUserSearchResultsContentProps) {
    const users = await searchUsersForFriendsPage(searchQuery);

    if (users.length === 0) {
        return (
            <div className="mt-6 flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/55 px-5 text-center">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary">
                    <SearchX className="size-5 text-primary" aria-hidden="true" />
                </span>
                <p className="mt-3 font-medium">Других читателей не найдено</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Попробуйте изменить запрос. Друзья и входящие заявки уже показаны выше.
                </p>
            </div>
        );
    }

    return (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
                <li key={user.id} className="min-w-0">
                    <FriendUserSearchResultCard user={user} />
                </li>
            ))}
        </ul>
    );
}

// После изменения q новая граница сразу заменяет прошлые результаты скелетоном.
async function FriendsPageUserSearchResultsForQuery({
    searchQueryPromise,
}: FriendsPageUserSearchResultsSectionProps) {
    const searchQuery = await searchQueryPromise;

    // На странице без поиска этот третий блок не занимает место.
    if (searchQuery.length < 2) {
        return null;
    }

    return (
        <section
            aria-labelledby="friends-page-user-search-results-heading"
            className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                    <UserSearch className="size-5 text-primary" aria-hidden="true" />
                </span>

                <div>
                    <h2
                        id="friends-page-user-search-results-heading"
                        className="text-lg font-semibold tracking-tight"
                    >
                        Другие читатели
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Пользователи, которых ещё нет среди ваших друзей и входящих заявок.
                    </p>
                </div>
            </div>

            <Suspense
                key={searchQuery}
                fallback={<FriendsPageUserSearchResultsContentSkeleton />}
            >
                <FriendsPageUserSearchResultsContent searchQuery={searchQuery} />
            </Suspense>
        </section>
    );
}

// Внешний Suspense ждёт только q из URL; без активного поиска fallback намеренно пустой.
export function FriendsPageUserSearchResultsSection({
    searchQueryPromise,
}: FriendsPageUserSearchResultsSectionProps) {
    return (
        <Suspense fallback={null}>
            <FriendsPageUserSearchResultsForQuery
                searchQueryPromise={searchQueryPromise}
            />
        </Suspense>
    );
}

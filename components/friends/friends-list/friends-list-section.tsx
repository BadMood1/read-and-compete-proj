import { UsersRound } from "lucide-react";
import { Suspense } from "react";

import { FriendsListContentSkeleton } from "@/components/friends/friends-list/friends-list-content-skeleton";
import { FriendsListUserCard } from "@/components/friends/friends-list/friends-list-user-card";
import { getCurrentUserFriends } from "@/lib/friends/friends-page/current-user-friends-queries";

type FriendsListSectionProps = {
    searchQueryPromise: Promise<string>;
};

type FriendsListContentProps = {
    searchQuery: string;
};

// Загружает из БД только друзей, подходящих под текущий поисковый запрос.
async function FriendsListContent({ searchQuery }: FriendsListContentProps) {
    const friends = await getCurrentUserFriends(searchQuery);

    if (friends.length === 0) {
        if (searchQuery) {
            return (
                <div className="mt-6 flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-border bg-background/55 px-5 text-center">
                    <div>
                        <p className="font-medium">Среди друзей ничего не найдено</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Попробуйте изменить запрос или очистить строку поиска.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-6 flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-border bg-background/55 px-5 text-center">
                <div>
                    <p className="font-medium">Друзей пока нет</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        После принятия заявки новый друг появится в этом списке.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {friends.map((friend) => (
                <li key={friend.id} className="min-w-0">
                    <FriendsListUserCard friend={friend} />
                </li>
            ))}
        </ul>
    );
}

// Сначала получает q из URL, затем создаёт новую Suspense-границу именно для этого запроса.
async function FriendsListSearchResults({ searchQueryPromise }: FriendsListSectionProps) {
    const searchQuery = await searchQueryPromise;

    return (
        <Suspense key={searchQuery} fallback={<FriendsListContentSkeleton />}>
            <FriendsListContent searchQuery={searchQuery} />
        </Suspense>
    );
}

// Внешняя секция остаётся синхронной частью каркаса страницы.
export function FriendsListSection({ searchQueryPromise }: FriendsListSectionProps) {
    return (
        <section
            aria-labelledby="friends-list-heading"
            className="flex h-full flex-col rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                    <UsersRound className="size-5 text-primary" aria-hidden="true" />
                </span>

                <div>
                    <h2 id="friends-list-heading" className="text-lg font-semibold tracking-tight">
                        Ваши друзья
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Здесь собраны читатели, с которыми вы уже подружились.
                    </p>
                </div>
            </div>

            <Suspense fallback={<FriendsListContentSkeleton />}>
                <FriendsListSearchResults searchQueryPromise={searchQueryPromise} />
            </Suspense>
        </section>
    );
}

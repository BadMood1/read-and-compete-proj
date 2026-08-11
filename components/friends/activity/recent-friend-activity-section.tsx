import { BookOpen } from "lucide-react";
import { Suspense } from "react";

import { RecentFriendActivityListItem } from "@/components/friends/activity/recent-friend-activity-list-item";
import { RecentFriendActivitySectionSkeleton } from "@/components/friends/activity/recent-friend-activity-section-skeleton";
import { getCurrentUserRecentFriendActivity } from "@/lib/friends/activity/current-user-recent-friend-activity-query";

const FRIENDS_PAGE_PATH = "/friends";

type RecentFriendActivitySectionProps = {
    searchQueryPromise: Promise<string>;
};

// Получает готовые события и передаёт каждое отдельной строке.
async function RecentFriendActivityContent() {
    const recentFriendActivity = await getCurrentUserRecentFriendActivity();

    return (
        <section
            aria-labelledby="recent-friend-activity-heading"
            className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                    <BookOpen className="size-5 text-primary" aria-hidden="true" />
                </span>

                <div>
                    <h2 id="recent-friend-activity-heading" className="font-semibold">
                        Последние события
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Последние прочитанные книги, оценки и рецензии ваших друзей.
                    </p>
                </div>
            </div>

            {recentFriendActivity.length === 0 ? (
                <div className="mt-6 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-background/55 px-5 text-center">
                    <div>
                        <p className="font-medium">Книжной активности пока нет</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Здесь появятся прочитанные книги, оценки и рецензии друзей.
                        </p>
                    </div>
                </div>
            ) : (
                <ul className="mt-6 grid items-stretch gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {recentFriendActivity.map((activity) => (
                        <RecentFriendActivityListItem
                            key={activity.id}
                            activity={activity}
                            bookDetailsReturnPath={FRIENDS_PAGE_PATH}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}

// Сначала проверяет строку поиска, чтобы во время поиска людей вообще не запускать запрос ленты.
async function RecentFriendActivityForCurrentSearch({
    searchQueryPromise,
}: RecentFriendActivitySectionProps) {
    const searchQuery = await searchQueryPromise;

    if (searchQuery) {
        return null;
    }

    return (
        <Suspense fallback={<RecentFriendActivitySectionSkeleton />}>
            <RecentFriendActivityContent />
        </Suspense>
    );
}

// Внешний Suspense ждёт только q из URL и не показывает ложный skeleton во время поиска.
export function RecentFriendActivitySection({ searchQueryPromise }: RecentFriendActivitySectionProps) {
    return (
        <Suspense fallback={null}>
            <RecentFriendActivityForCurrentSearch searchQueryPromise={searchQueryPromise} />
        </Suspense>
    );
}

import { BookCheck, BookOpen, MessageSquareText, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { UserAvatar } from "@/components/users/user-avatar";
import { createBookDetailsPath } from "@/lib/books/book-details-navigation";
import type { CurrentUserRecentFriendActivityItem } from "@/lib/friends/activity/current-user-recent-friend-activity-query";
import { createProfilePath } from "@/lib/profile/profile-navigation";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type RecentFriendActivityListItemProps = {
    activity: CurrentUserRecentFriendActivityItem;
    bookDetailsReturnPath: string;
};

const recentFriendActivityDateFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
});

// Возвращает подпись и иконку конкретного вида события.
// Нейтральные формулировки не требуют угадывать пол пользователя по имени.
function getRecentFriendActivityPresentation(
    activity: CurrentUserRecentFriendActivityItem,
) {
    switch (activity.type) {
        case "FINISHED_BOOK":
            return {
                label: "Новая прочитанная книга",
                Icon: BookCheck,
            };
        case "RATED_BOOK":
            return {
                label: "Новая оценка",
                Icon: Star,
            };
        case "REVIEWED_BOOK":
            return {
                label: "Новая рецензия",
                Icon: MessageSquareText,
            };
    }
}

// Показывает одно событие. Запросы выполняет будущая родительская секция,
// поэтому этот компонент отвечает только за представление полученных данных.
export function RecentFriendActivityListItem({
    activity,
    bookDetailsReturnPath,
}: RecentFriendActivityListItemProps) {
    const friendDisplayName = getUserDisplayName(activity.friend.name);
    const friendProfilePath = createProfilePath(activity.friend.id);
    const bookDetailsPath = createBookDetailsPath({
        googleBooksId: activity.book.googleBooksId,
        returnPath: bookDetailsReturnPath,
    });
    const { label, Icon } = getRecentFriendActivityPresentation(activity);
    const activityRating = activity.type === "FINISHED_BOOK" ? null : activity.rating;

    return (
        <li>
            <article className="grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] items-start gap-3 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_3.5rem] sm:gap-4">
                {/* Аватар и имя ведут в профиль, но не превращают всю строку в одну ссылку. */}
                <Link
                    href={friendProfilePath}
                    aria-label={`Открыть профиль пользователя ${friendDisplayName}`}
                    className="shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <UserAvatar
                        displayName={friendDisplayName}
                        imageUrl={activity.friend.image}
                        size="lg"
                    />
                </Link>

                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <Link
                            href={friendProfilePath}
                            className="block min-w-0 max-w-full truncate rounded-sm text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                            {friendDisplayName}
                        </Link>

                        <time
                            dateTime={activity.occurredAt.toISOString()}
                            className="shrink-0 text-xs text-muted-foreground"
                        >
                            {recentFriendActivityDateFormatter.format(activity.occurredAt)}
                        </time>
                    </div>

                    <div className="mt-1.5 flex min-w-0 items-start gap-2">
                        <Icon
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-hidden="true"
                        />

                        <p className="min-w-0 wrap-break-word text-sm leading-6 text-muted-foreground">
                            <span>{label}</span>{" "}
                            <Link
                                href={bookDetailsPath}
                                className="font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                «{activity.book.title}»
                            </Link>

                            {activityRating !== null ? (
                                <span className="ml-2 inline-flex rounded-full border border-primary/45 px-2 py-0.5 text-xs font-semibold leading-4 text-primary">
                                    {activityRating} / 10
                                </span>
                            ) : null}
                        </p>
                    </div>

                    {/* Текст нужен только полноценной рецензии; две строки сохраняют компактность. */}
                    {activity.type === "REVIEWED_BOOK" ? (
                        <p className="mt-2 line-clamp-2 wrap-break-word whitespace-pre-line text-sm leading-6 text-foreground/80">
                            {activity.reviewText}
                        </p>
                    ) : null}
                </div>

                {/* Обложка — отдельная ссылка на книгу с возвратом в ленту друзей. */}
                <Link
                    href={bookDetailsPath}
                    aria-label={`Открыть книгу «${activity.book.title}»`}
                    className="group relative aspect-2/3 w-12 overflow-hidden rounded-lg bg-secondary/65 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-14"
                >
                    {activity.book.coverUrl ? (
                        <Image
                            src={activity.book.coverUrl}
                            alt={`Обложка книги «${activity.book.title}»`}
                            fill
                            sizes="(max-width: 639px) 48px, 56px"
                            className="object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <span className="flex h-full items-center justify-center">
                            <BookOpen
                                className="size-5 text-foreground/45"
                                aria-hidden="true"
                            />
                        </span>
                    )}
                </Link>
            </article>
        </li>
    );
}

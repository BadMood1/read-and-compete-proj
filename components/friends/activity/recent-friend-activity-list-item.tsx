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

const averageRatingFormatter = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const integerNumberFormatter = new Intl.NumberFormat("ru-RU");

// Подбирает окончание для подписи: «1 книга», «2 книги», «5 книг».
function formatFinishedBooksCount(finishedBooksCount: number) {
    const lastTwoDigits = finishedBooksCount % 100;
    const lastDigit = finishedBooksCount % 10;
    let bookWord = "книг";

    if (lastTwoDigits < 11 || lastTwoDigits > 14) {
        if (lastDigit === 1) {
            bookWord = "книга";
        } else if (lastDigit >= 2 && lastDigit <= 4) {
            bookWord = "книги";
        }
    }

    return `${integerNumberFormatter.format(finishedBooksCount)} ${bookWord}`;
}

// Возвращает подпись и иконку конкретного вида события.
// Нейтральные формулировки не требуют угадывать пол пользователя по имени.
function getRecentFriendActivityPresentation(activity: CurrentUserRecentFriendActivityItem) {
    switch (activity.type) {
        case "FINISHED_BOOK":
            return {
                label: "Прочитано",
                Icon: BookCheck,
            };
        case "RATED_BOOK":
            return {
                label: "Оценка",
                Icon: Star,
            };
        case "REVIEWED_BOOK":
            return {
                label: "Рецензия",
                Icon: MessageSquareText,
            };
    }
}

// Заполняет нижнюю часть компактной карточки полезными данными,
// когда у события нет собственного текста рецензии.
function getRecentFriendActivityDetailsText(activity: CurrentUserRecentFriendActivityItem) {
    switch (activity.type) {
        case "FINISHED_BOOK": {
            const pageCountText =
                activity.book.pageCount === null
                    ? "Количество страниц не указано"
                    : `Объём: ${integerNumberFormatter.format(activity.book.pageCount)} стр.`;

            return [
                pageCountText,
                `На тот момент прочитано: ${formatFinishedBooksCount(activity.finishedBooksCount)}`,
            ].join("\n");
        }
        case "RATED_BOOK":
            return [
                "Средняя оценка читателей:",
                `${averageRatingFormatter.format(activity.bookRatingSummary.averageRating)} / 10`,
                `Оценок: ${integerNumberFormatter.format(activity.bookRatingSummary.ratingsCount)}`,
            ].join("\n");
        case "REVIEWED_BOOK":
            return null;
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
    const activityDetailsText = getRecentFriendActivityDetailsText(activity);

    return (
        <li className="h-full min-w-0">
            <div className="@container h-full min-w-0 rounded-2xl border border-border bg-background/55 p-3 transition hover:border-primary/30">
                {/* Слева находится друг, справа — вид события и его оценка. */}
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-b border-border pb-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <Link
                            href={friendProfilePath}
                            aria-label={`Открыть профиль пользователя ${friendDisplayName}`}
                            className="shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                            <UserAvatar displayName={friendDisplayName} imageUrl={activity.friend.image} />
                        </Link>

                        <div className="min-w-0 flex-1">
                            <Link
                                href={friendProfilePath}
                                className="block truncate rounded-sm text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                {friendDisplayName}
                            </Link>

                            <time
                                dateTime={activity.occurredAt.toISOString()}
                                className="mt-0.5 block truncate text-xs text-muted-foreground"
                            >
                                {recentFriendActivityDateFormatter.format(activity.occurredAt)}
                            </time>
                        </div>
                    </div>

                    <div className="shrink-0 text-right">
                        <span className="flex items-center justify-end gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                            <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                            <span>{label}</span>
                        </span>

                        {/* Оценка специально стоит на своей строке и прижата вправо. */}
                        {activityRating !== null ? (
                            <div className="mt-1 flex justify-end">
                                <span
                                    aria-label={`Оценка ${activityRating} из 10`}
                                    className="inline-flex rounded-full border border-primary/45 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-primary"
                                >
                                    {activityRating} / 10
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Текст идёт рядом с обложкой, а ниже неё использует всю ширину карточки. */}
                <div className="mt-3 flow-root min-w-0">
                    <Link
                        href={bookDetailsPath}
                        aria-label={`Открыть книгу «${activity.book.title}»`}
                        className="group relative float-left mr-2.5 mb-1 block aspect-2/3 w-12 overflow-hidden rounded-lg bg-secondary/65 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                        {activity.book.coverUrl ? (
                            <Image
                                src={activity.book.coverUrl}
                                alt={`Обложка книги «${activity.book.title}»`}
                                fill
                                sizes="48px"
                                className="object-cover transition duration-300 group-hover:scale-[1.03]"
                            />
                        ) : (
                            <span className="flex h-full items-center justify-center">
                                <BookOpen className="size-5 text-foreground/45" aria-hidden="true" />
                            </span>
                        )}
                    </Link>

                    <h3 className="line-clamp-2 wrap-break-word text-left text-sm font-semibold leading-snug @max-[300px]:text-center">
                        <Link
                            href={bookDetailsPath}
                            className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                            {activity.book.title}
                        </Link>
                    </h3>

                    {/* Ограничение по высоте оставляет больше текста и не ломает обтекание обложки. */}
                    {activity.type === "REVIEWED_BOOK" ? (
                        <p className="mt-2 max-h-20 overflow-clip wrap-break-word hyphens-auto whitespace-pre-line text-justify text-xs leading-5 text-foreground/75">
                            {activity.reviewText}
                        </p>
                    ) : activityDetailsText ? (
                        <p className="mt-2 wrap-break-word whitespace-pre-line text-xs leading-5 text-foreground/75">
                            {activityDetailsText}
                        </p>
                    ) : null}
                </div>
            </div>
        </li>
    );
}

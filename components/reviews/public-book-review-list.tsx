import { MessageSquareText } from "lucide-react";
import Link from "next/link";

import { BookReviewInteractionControls } from "@/components/reviews/book-review-interaction-controls";
import { UserAvatar } from "@/components/users/user-avatar";
import { createProfilePathWithReturnPath } from "@/lib/profile/profile-navigation";
import type { PublicBookReviewData } from "@/lib/reviews/public-book-review-queries";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type PublicBookReviewListProps = {
    reviews: PublicBookReviewData[];
    bookPagePath: string;
};

const reviewDateFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
});

// Серверный компонент: ему не нужны состояние, обработчики событий и клиентский JavaScript.
export function PublicBookReviewList({ reviews, bookPagePath }: PublicBookReviewListProps) {
    return (
        <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <MessageSquareText className="size-5 text-primary" aria-hidden="true" />
                </span>

                <div>
                    <p className="text-sm font-semibold text-primary">Мнения читателей</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                        Рецензии на эту книгу
                    </h2>
                </div>
            </div>

            {reviews.length === 0 ? (
                <p className="mt-6 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">
                    Пока никто не поделился впечатлением об этой книге.
                </p>
            ) : (
                <div className="mt-6 divide-y divide-border border-t border-border">
                    {reviews.map((review) => {
                        // Профиль запоминает эту книгу и сможет показать ссылку возврата.
                        const userProfilePath = createProfilePathWithReturnPath({
                            // Новые ссылки сразу используют username; ID остаётся fallback
                            // для старой записи пользователя, который ещё не завершил welcome.
                            profileIdentifier: review.author.username ?? review.author.id,
                            returnPath: bookPagePath,
                        });
                        const authorDisplayName = getUserDisplayName(review.author.name);

                        return (
                            <article key={review.id} className="py-6 first:pt-5 last:pb-0">
                                <div className="flex items-start gap-3">
                                    <Link
                                        href={userProfilePath}
                                        aria-label={`Открыть профиль пользователя ${authorDisplayName}`}
                                        className="shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                    >
                                        <UserAvatar
                                            displayName={authorDisplayName}
                                            imageUrl={review.author.image}
                                            size="lg"
                                        />
                                    </Link>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                                            <div className="min-w-0">
                                                <Link
                                                    href={userProfilePath}
                                                    className="block max-w-full truncate rounded-sm text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                                >
                                                    {authorDisplayName}
                                                </Link>
                                                <time
                                                    dateTime={review.createdAt.toISOString()}
                                                    className="mt-0.5 block text-xs text-muted-foreground"
                                                >
                                                    {reviewDateFormatter.format(review.createdAt)}
                                                </time>
                                            </div>

                                            <span className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary">
                                                Оценка: {review.rating} / 10
                                            </span>
                                        </div>

                                        {/*
                                          Реакции и комментарии доступны только у текстовой рецензии.
                                          Этот клиентский блок загружается внутри серверного списка точечно.
                                        */}
                                        {review.text ? (
                                            <>
                                                <p className="mt-3 wrap-break-word whitespace-pre-line text-sm leading-7">
                                                    {review.text}
                                                </p>

                                                <BookReviewInteractionControls
                                                    reviewId={review.id}
                                                    initialLikesCount={review.likesCount}
                                                    initialDislikesCount={review.dislikesCount}
                                                    initialCommentsCount={review.commentsCount}
                                                    initialCurrentUserReaction={review.currentUserReaction}
                                                    bookPagePath={bookPagePath}
                                                />
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

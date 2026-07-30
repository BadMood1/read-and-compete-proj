import { MessageSquareText } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicBookReviewData } from "@/lib/reviews/public-book-review-queries";

type PublicBookReviewListProps = {
    reviews: PublicBookReviewData[];
};

const reviewDateFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
});

function getReviewAuthorDisplayName(authorName: string | null) {
    return authorName?.trim() || "Читатель";
}

function getReviewAuthorInitials(authorName: string) {
    return (
        authorName
            .split(/\s+/) // разбивка на слова(по пробелам)
            .map((namePart) => namePart[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "RC"
    );
}

// Серверный компонент: ему не нужны состояние, обработчики событий и клиентский JavaScript.
export function PublicBookReviewList({ reviews }: PublicBookReviewListProps) {
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
                        const authorDisplayName = getReviewAuthorDisplayName(review.author.name);

                        return (
                            <article key={review.id} className="py-6 first:pt-5 last:pb-0">
                                <div className="flex items-start gap-3">
                                    <Avatar size="lg">
                                        {review.author.image ? (
                                            <AvatarImage src={review.author.image} alt={authorDisplayName} />
                                        ) : null}
                                        <AvatarFallback>
                                            {getReviewAuthorInitials(authorDisplayName)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold">
                                                    {authorDisplayName}
                                                </p>
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

                                        {/* Запись без текста остаётся компактной: автора и оценки уже достаточно. */}
                                        {review.text ? (
                                            <p className="mt-4 break-words whitespace-pre-line text-sm leading-7">
                                                {review.text}
                                            </p>
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

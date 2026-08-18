"use client";

import Link from "next/link";

import { ReviewCommentDeleteButton } from "@/components/reviews/comments/review-comment-delete-button";
import { UserAvatar } from "@/components/users/user-avatar";
import { createProfilePathWithReturnPath } from "@/lib/profile/profile-navigation";
import type { PublicReviewCommentData } from "@/lib/reviews/comments/review-comment-types";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type ReviewCommentListItemProps = {
    comment: PublicReviewCommentData;
    bookPagePath: string;
    onCommentDeleted: (deletedCommentId: string, commentsCount: number) => void;
};

// Форматтер создаётся один раз для всех элементов списка.
const reviewCommentDateFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
});

// Показывает автора, дату и текст одного комментария внутри панели.
export function ReviewCommentListItem({
    comment,
    bookPagePath,
    onCommentDeleted,
}: ReviewCommentListItemProps) {
    const authorDisplayName = getUserDisplayName(comment.author.name);

    // При переходе в профиль сохраняем путь книги, чтобы оттуда можно было вернуться назад.
    const authorProfilePath = createProfilePathWithReturnPath({
        // Для настроенного профиля сразу строим красивый URL; ID нужен как fallback
        // для пользователя, который ещё не сохранил username на welcome-странице.
        profileIdentifier: comment.author.username ?? comment.author.id,
        returnPath: bookPagePath,
    });

    return (
        <li className="flex min-w-0 items-start gap-3 py-4 first:pt-0 last:pb-0">
            <Link
                href={authorProfilePath}
                aria-label={`Открыть профиль пользователя ${authorDisplayName}`}
                className="shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
                <UserAvatar displayName={authorDisplayName} imageUrl={comment.author.image} />
            </Link>

            <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <Link
                            href={authorProfilePath}
                            className="max-w-full truncate rounded-sm text-sm font-semibold transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            {authorDisplayName}
                        </Link>

                        {comment.isAuthoredByCurrentUser ? (
                            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                Вы
                            </span>
                        ) : null}

                        <time
                            dateTime={comment.createdAt}
                            className="text-xs text-muted-foreground"
                        >
                            {reviewCommentDateFormatter.format(new Date(comment.createdAt))}
                        </time>
                    </div>

                    {/* Кнопку показываем только автору; сервер всё равно повторно проверит владельца. */}
                    {comment.isAuthoredByCurrentUser ? (
                        <ReviewCommentDeleteButton
                            commentId={comment.id}
                            onCommentDeleted={onCommentDeleted}
                        />
                    ) : null}
                </div>

                {/* Сохраняем переносы автора и разрываем очень длинные слова, не ломая ширину панели. */}
                <p className="mt-1.5 wrap-break-word whitespace-pre-line text-sm leading-6">
                    {comment.text}
                </p>
            </div>
        </li>
    );
}

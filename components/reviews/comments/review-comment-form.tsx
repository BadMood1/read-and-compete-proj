"use client";

import { LoaderCircle, SendHorizontal } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import { createCurrentUserReviewComment } from "@/lib/reviews/comments/current-user-review-comment-actions";
import {
    REVIEW_COMMENT_MAX_LENGTH,
    type PublicReviewCommentData,
} from "@/lib/reviews/comments/review-comment-types";
import { cn } from "@/lib/utils";

type ReviewCommentFormProps = {
    reviewId: string;
    onCommentCreated: (comment: PublicReviewCommentData, commentsCount: number) => void;
};

// Отправляет новый комментарий и передаёт подтверждённые сервером данные панели.
export function ReviewCommentForm({ reviewId, onCommentCreated }: ReviewCommentFormProps) {
    const [commentText, setCommentText] = useState("");
    const [isCreatingComment, setIsCreatingComment] = useState(false);
    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    // Обрезанную строку используем для проверки, чтобы комментарий из пробелов нельзя было отправить.
    const normalizedCommentText = commentText.trim();

    async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
        // Не даём браузеру перезагрузить страницу при обычной отправке формы.
        event.preventDefault();

        if (isCreatingComment || !normalizedCommentText) {
            return;
        }

        setErrorMessage(null);
        setIsCreatingComment(true);

        try {
            const result = await createCurrentUserReviewComment(reviewId, commentText);

            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }

            // Родительская панель добавит созданный комментарий в список и обновит общий счётчик.
            onCommentCreated(result.comment, result.commentsCount);
            setCommentText("");
        } catch {
            setErrorMessage("Не удалось отправить комментарий. Попробуйте ещё раз.");
        } finally {
            setIsCreatingComment(false);
        }
    }

    // shrink-0 не позволяет прокручиваемому списку сжать форму по высоте.
    return (
        <form
            onSubmit={handleCommentSubmit}
            className="shrink-0 border-t border-border bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-4 sm:pb-4"
        >
            <label htmlFor={`review-comment-${reviewId}`} className="sr-only">
                Написать комментарий
            </label>

            <div className="rounded-2xl border border-input bg-background px-3 py-2 shadow-sm transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
                <textarea
                    id={`review-comment-${reviewId}`}
                    value={commentText}
                    rows={2}
                    maxLength={REVIEW_COMMENT_MAX_LENGTH}
                    disabled={isCreatingComment}
                    placeholder="Напишите комментарий..."
                    className="max-h-32 min-h-12 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-wait disabled:opacity-60"
                    onChange={(event) => setCommentText(event.target.value)}
                />

                {/* На месте счётчика временно показываем ошибку, не увеличивая высоту формы. */}
                <div className="mt-1 flex min-h-7 items-end justify-between gap-3">
                    {errorMessage ? (
                        <p
                            role="alert"
                            className={cn(
                                "text-xs leading-5 text-destructive",
                                "transition-opacity duration-200 motion-reduce:transition-none",
                                isErrorMessageVisible ? "opacity-100" : "opacity-0",
                            )}
                        >
                            {errorMessage}
                        </p>
                    ) : (
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {commentText.length} / {REVIEW_COMMENT_MAX_LENGTH}
                        </span>
                    )}

                    <Button
                        type="submit"
                        size="sm"
                        disabled={isCreatingComment || !normalizedCommentText}
                        aria-busy={isCreatingComment}
                        className="shrink-0 rounded-xl"
                    >
                        {isCreatingComment ? (
                            <LoaderCircle className="animate-spin" aria-hidden="true" />
                        ) : (
                            <SendHorizontal aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">
                            {isCreatingComment ? "Отправляем..." : "Отправить"}
                        </span>
                        <span className="sr-only sm:hidden">
                            {isCreatingComment ? "Отправляем комментарий" : "Отправить комментарий"}
                        </span>
                    </Button>
                </div>
            </div>
        </form>
    );
}

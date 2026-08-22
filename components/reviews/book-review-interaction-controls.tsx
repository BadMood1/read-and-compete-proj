"use client";

import {
    ReviewReactionType,
    type ReviewReactionType as ReviewReactionTypeValue,
} from "@/app/generated/prisma/enums";
import { LoaderCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { ReviewCommentsSheet } from "@/components/reviews/comments/review-comments-sheet";
import { Button } from "@/components/ui/button";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import { setCurrentUserReviewReaction } from "@/lib/reviews/current-user-review-reaction-actions";
import { cn } from "@/lib/utils";

export type BookReviewReactionState = {
    currentUserReaction: ReviewReactionTypeValue | null;
    likesCount: number;
    dislikesCount: number;
};

type BookReviewInteractionControlsProps = {
    reviewId: string;
    initialLikesCount: number;
    initialDislikesCount: number;
    initialCommentsCount: number;
    initialCurrentUserReaction: ReviewReactionTypeValue | null;
    bookPagePath: string;
    className?: string;
    commentsTriggerClassName?: string;
    onCommentsCountChange?: (commentsCount: number) => void;
    onReactionChange?: (reactionState: BookReviewReactionState) => void;
};

// Объединяет реакции и комментарии как для своей, так и для чужой рецензии.
export function BookReviewInteractionControls({
    reviewId,
    initialLikesCount,
    initialDislikesCount,
    initialCommentsCount,
    initialCurrentUserReaction,
    bookPagePath,
    className,
    commentsTriggerClassName,
    onCommentsCountChange,
    onReactionChange,
}: BookReviewInteractionControlsProps) {
    // Начальные значения приходят из серверного запроса страницы книги.
    // После клика компонент хранит подтверждённые сервером значения локально.
    const [likesCount, setLikesCount] = useState(initialLikesCount);
    const [dislikesCount, setDislikesCount] = useState(initialDislikesCount);
    const [currentUserReaction, setCurrentUserReaction] = useState(initialCurrentUserReaction);

    // Общий флаг блокирует обе кнопки, а тип реакции определяет, на какой показать loader.
    const [isUpdatingReaction, setIsUpdatingReaction] = useState(false);
    const [pendingReactionType, setPendingReactionType] = useState<ReviewReactionTypeValue | null>(null);
    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    // Одна функция обслуживает и лайк, и дизлайк: отличается только переданный тип реакции.
    async function handleReactionButtonClick(clickedReactionType: ReviewReactionTypeValue) {
        if (isUpdatingReaction) {
            return;
        }

        // Повторный клик снимает выбранную реакцию, а другая кнопка переключает её тип.
        const desiredReaction = currentUserReaction === clickedReactionType ? null : clickedReactionType;

        setErrorMessage(null);
        setIsUpdatingReaction(true);
        setPendingReactionType(clickedReactionType);

        try {
            const result = await setCurrentUserReviewReaction(reviewId, desiredReaction);

            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }

            // Используем подтверждённые сервером значения, а не считаем их на клиенте вручную.
            setCurrentUserReaction(result.currentUserReaction);
            setLikesCount(result.likesCount);
            setDislikesCount(result.dislikesCount);
            onReactionChange?.({
                currentUserReaction: result.currentUserReaction,
                likesCount: result.likesCount,
                dislikesCount: result.dislikesCount,
            });
        } catch {
            setErrorMessage("Не удалось изменить реакцию. Попробуйте ещё раз.");
        } finally {
            setIsUpdatingReaction(false);
            setPendingReactionType(null);
        }
    }

    const isLikeSelected = currentUserReaction === ReviewReactionType.LIKE;
    const isDislikeSelected = currentUserReaction === ReviewReactionType.DISLIKE;

    // Эти два флага не управляют запросом — они только выбирают кнопку для loader.
    const isLikeRequestPending = isUpdatingReaction && pendingReactionType === ReviewReactionType.LIKE;
    const isDislikeRequestPending = isUpdatingReaction && pendingReactionType === ReviewReactionType.DISLIKE;

    return (
        <div className={cn("mt-3 w-full max-w-full sm:w-fit", className)}>
            {/* На телефоне действия делят строку на три колонки, начиная с sm занимают свою ширину. */}
            <div
                role="group"
                aria-label="Реакции и комментарии к рецензии"
                aria-busy={isUpdatingReaction}
                className="grid w-full grid-cols-3 items-center gap-2 sm:flex sm:w-auto"
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    aria-label={isLikeSelected ? "Убрать лайк" : "Поставить лайк"}
                    aria-pressed={isLikeSelected}
                    disabled={isUpdatingReaction}
                    onClick={() => handleReactionButtonClick(ReviewReactionType.LIKE)}
                    className={cn(
                        "w-full min-w-0 rounded-full border px-2.5 tabular-nums disabled:opacity-70 sm:w-auto sm:min-w-16 sm:px-3",
                        isLikeSelected
                            ? "border-primary/25 bg-secondary text-primary hover:bg-secondary/80"
                            : "border-border bg-background text-muted-foreground hover:border-primary/25 hover:bg-secondary/55 hover:text-primary",
                    )}
                >
                    {isLikeRequestPending ? (
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                        // У ThumbsUp рисунок внутри SVG визуально ниже цифры, поэтому слегка поднимаем его.
                        <ThumbsUp className="-translate-y-0.5" aria-hidden="true" />
                    )}
                    <span className="leading-none" aria-live="polite">
                        {likesCount}
                    </span>
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    aria-label={isDislikeSelected ? "Убрать дизлайк" : "Поставить дизлайк"}
                    aria-pressed={isDislikeSelected}
                    disabled={isUpdatingReaction}
                    onClick={() => handleReactionButtonClick(ReviewReactionType.DISLIKE)}
                    className={cn(
                        "w-full min-w-0 rounded-full border px-2.5 tabular-nums disabled:opacity-70 sm:w-auto sm:min-w-16 sm:px-3",
                        isDislikeSelected
                            ? "border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/20"
                            : "border-border bg-background text-muted-foreground hover:border-destructive/25 hover:bg-destructive/10 hover:text-destructive",
                    )}
                >
                    {isDislikeRequestPending ? (
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                        <ThumbsDown aria-hidden="true" />
                    )}
                    <span className="leading-none" aria-live="polite">
                        {dislikesCount}
                    </span>
                </Button>

                <ReviewCommentsSheet
                    reviewId={reviewId}
                    initialCommentsCount={initialCommentsCount}
                    bookPagePath={bookPagePath}
                    triggerClassName={commentsTriggerClassName}
                    onCommentsCountChange={onCommentsCountChange}
                />
            </div>

            {/* Хук сначала плавно скрывает сообщение, а затем удаляет его из разметки. */}
            {errorMessage ? (
                <p
                    role="alert"
                    className={cn(
                        "mt-2 max-w-64 text-xs leading-5 text-destructive",
                        "transition-opacity duration-200 motion-reduce:transition-none",
                        isErrorMessageVisible ? "opacity-100" : "opacity-0",
                    )}
                >
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}

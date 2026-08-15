import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { type MouseEvent, useState } from "react";

import { ReviewCommentsSheet } from "@/components/reviews/comments/review-comments-sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    deleteCurrentUserReview,
    type CurrentUserReviewData,
} from "@/lib/reviews/current-user-review-actions";

type SavedCurrentUserReviewProps = {
    googleBooksId: string;
    bookPagePath: string;
    review: CurrentUserReviewData;
    onStartReviewEditing: () => void;
    onReviewDeleted: () => void;
    onCommentsCountChange: (commentsCount: number) => void;
};

// Показывает сохранённую рецензию и самостоятельно управляет её удалением.
export function SavedCurrentUserReview({
    googleBooksId,
    bookPagePath,
    review,
    onStartReviewEditing,
    onReviewDeleted,
    onCommentsCountChange,
}: SavedCurrentUserReviewProps) {
    const [isDeletingReview, setIsDeletingReview] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

    function handleDeleteDialogOpenChange(shouldOpen: boolean) {
        // Не закрываем окно посреди запроса и не оставляем в нём старую ошибку.
        if (isDeletingReview) {
            return;
        }

        setDeleteErrorMessage(null);
        setIsDeleteDialogOpen(shouldOpen);
    }

    async function handleReviewDelete(event: MouseEvent<HTMLButtonElement>) {
        // AlertDialogAction обычно закрывает окно сразу, а нам нужно дождаться ответа сервера.
        event.preventDefault();

        if (isDeletingReview) {
            return;
        }

        setDeleteErrorMessage(null);
        setIsDeletingReview(true);

        try {
            const result = await deleteCurrentUserReview(googleBooksId);

            if (!result.success) {
                setDeleteErrorMessage(result.error);
                return;
            }

            setIsDeleteDialogOpen(false);
            onReviewDeleted();
        } catch {
            setDeleteErrorMessage("Не удалось удалить рецензию. Попробуйте ещё раз.");
        } finally {
            setIsDeletingReview(false);
        }
    }

    return (
        // В сохранённом состоянии оставляем текст прямо в секции, без лишней вложенной карточки.
        <div className="mt-6 border-t border-border pt-5">
            {review.text ? (
                <p className="wrap-break-word whitespace-pre-line text-sm leading-7">{review.text}</p>
            ) : (
                <p className="text-sm text-muted-foreground">Текст рецензии не добавлен.</p>
            )}

            {/* Комментарии и управление рецензией остаются одной компактной нижней строкой. */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                {review.text ? (
                    <ReviewCommentsSheet
                        reviewId={review.id}
                        initialCommentsCount={review.commentsCount}
                        bookPagePath={bookPagePath}
                        triggerClassName="w-auto sm:min-w-36"
                        onCommentsCountChange={onCommentsCountChange}
                    />
                ) : null}

                <div className="ml-auto flex flex-wrap justify-end gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary"
                        onClick={onStartReviewEditing}
                    >
                        <Pencil aria-hidden="true" />
                        Изменить
                    </Button>

                    <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={handleDeleteDialogOpenChange}
                    >
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 aria-hidden="true" />
                                Удалить
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Удалить рецензию?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Вместе с оценкой и текстом удалятся все комментарии к этой
                                    рецензии.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            {deleteErrorMessage ? (
                                <p role="alert" className="text-sm text-destructive">
                                    {deleteErrorMessage}
                                </p>
                            ) : null}

                            {/* Короткие действия помещаются в одну строку даже на мобильном. */}
                            <AlertDialogFooter className="grid grid-cols-2 sm:flex">
                                <AlertDialogCancel disabled={isDeletingReview}>
                                    Отмена
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={isDeletingReview}
                                    aria-busy={isDeletingReview}
                                    onClick={handleReviewDelete}
                                >
                                    {isDeletingReview ? (
                                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Trash2 aria-hidden="true" />
                                    )}
                                    {isDeletingReview ? "Удаляем..." : "Удалить"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
}

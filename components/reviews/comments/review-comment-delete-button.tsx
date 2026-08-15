"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { type MouseEvent, useState } from "react";

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
import { deleteCurrentUserReviewComment } from "@/lib/reviews/comments/current-user-review-comment-actions";

type ReviewCommentDeleteButtonProps = {
    commentId: string;
    onCommentDeleted: (deletedCommentId: string, commentsCount: number) => void;
};

// Подтверждает удаление, вызывает серверный action и сообщает панели результат.
export function ReviewCommentDeleteButton({ commentId, onCommentDeleted }: ReviewCommentDeleteButtonProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeletingComment, setIsDeletingComment] = useState(false);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

    function handleDeleteDialogOpenChange(shouldOpen: boolean) {
        // Не закрываем диалог посреди запроса и очищаем ошибку перед следующим открытием.
        if (isDeletingComment) {
            return;
        }

        setDeleteErrorMessage(null);
        setIsDeleteDialogOpen(shouldOpen);
    }

    async function handleCommentDelete(event: MouseEvent<HTMLButtonElement>) {
        // Radix обычно сразу закрывает AlertDialogAction, но сначала нам нужен ответ сервера.
        event.preventDefault();

        if (isDeletingComment) {
            return;
        }

        setDeleteErrorMessage(null);
        setIsDeletingComment(true);

        try {
            const result = await deleteCurrentUserReviewComment(commentId);

            if (!result.success) {
                setDeleteErrorMessage(result.error);
                return;
            }

            setIsDeleteDialogOpen(false);
            // Родитель уберёт запись из локального списка и обновит общий счётчик.
            onCommentDeleted(result.deletedCommentId, result.commentsCount);
        } catch {
            setDeleteErrorMessage("Не удалось удалить комментарий. Попробуйте ещё раз.");
        } finally {
            setIsDeletingComment(false);
        }
    }

    return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Удалить комментарий"
                    className="shrink-0 rounded-full text-muted-foreground transition-transform hover:scale-105 hover:bg-destructive/10 hover:text-destructive"
                >
                    <Trash2 aria-hidden="true" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Удалить комментарий?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Комментарий исчезнет из обсуждения. Восстановить его не получится.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {deleteErrorMessage ? (
                    <p role="alert" className="text-sm text-destructive">
                        {deleteErrorMessage}
                    </p>
                ) : null}

                {/* Короткие действия помещаются в одну строку и на мобильном экране. */}
                <AlertDialogFooter className="grid grid-cols-2 sm:flex">
                    <AlertDialogCancel disabled={isDeletingComment}>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isDeletingComment}
                        aria-busy={isDeletingComment}
                        onClick={handleCommentDelete}
                    >
                        {isDeletingComment ? (
                            <LoaderCircle className="animate-spin" aria-hidden="true" />
                        ) : (
                            <Trash2 aria-hidden="true" />
                        )}
                        {isDeletingComment ? "Удаляем..." : "Удалить"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

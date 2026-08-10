"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { useState, type MouseEvent } from "react";

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
import { removeBookFromCurrentUserLibrary } from "@/lib/books/user-library-actions";

type RemoveBookFromCurrentUserLibraryCardButtonProps = {
    googleBooksId: string;
    bookTitle: string;
};

// Даёт удалить книгу прямо из карточки, не открывая её отдельную страницу.
export function RemoveBookFromCurrentUserLibraryCardButton({
    googleBooksId,
    bookTitle,
}: RemoveBookFromCurrentUserLibraryCardButtonProps) {
    const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
    const [isRemovingBook, setIsRemovingBook] = useState(false);
    const [removeBookErrorMessage, setRemoveBookErrorMessage] = useState<string | null>(null);

    function handleConfirmationDialogOpenChange(shouldOpen: boolean) {
        // Во время удаления окно остаётся открытым, чтобы не скрывать состояние операции.
        if (isRemovingBook) {
            return;
        }

        setRemoveBookErrorMessage(null);
        setIsConfirmationDialogOpen(shouldOpen);
    }

    async function handleRemoveBook(event: MouseEvent<HTMLButtonElement>) {
        // AlertDialogAction закрывает окно сам, а нам сначала нужен результат Server Action.
        event.preventDefault();

        if (isRemovingBook) {
            return;
        }

        setRemoveBookErrorMessage(null);
        setIsRemovingBook(true);

        try {
            const result = await removeBookFromCurrentUserLibrary(googleBooksId);

            if (!result.success) {
                setRemoveBookErrorMessage(result.error);
                return;
            }

            // Server Action ревалидирует /library, поэтому удалённая карточка исчезнет из списка.
            setIsConfirmationDialogOpen(false);
        } catch {
            setRemoveBookErrorMessage("Не удалось удалить книгу. Попробуйте ещё раз.");
        } finally {
            setIsRemovingBook(false);
        }
    }

    return (
        <AlertDialog open={isConfirmationDialogOpen} onOpenChange={handleConfirmationDialogOpenChange}>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Удалить книгу «${bookTitle}» из библиотеки`}
                    className="group/remove-book absolute top-3 right-3 z-20 size-8 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-destructive aria-expanded:bg-transparent aria-expanded:text-destructive dark:hover:bg-transparent"
                >
                    <X
                        className="size-6 sm:size-7 transition-transform duration-150 ease-out group-hover/remove-book:scale-110 group-focus-visible/remove-book:scale-110 motion-reduce:transition-none"
                        aria-hidden="true"
                    />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Удалить книгу из библиотеки?</AlertDialogTitle>
                    <AlertDialogDescription>
                        «{bookTitle}» исчезнет из вашей личной библиотеки. Книгу всегда можно будет добавить
                        снова.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {removeBookErrorMessage ? (
                    <p role="alert" className="text-sm text-destructive">
                        {removeBookErrorMessage}
                    </p>
                ) : null}

                {/* Короткие действия остаются в одной строке и на мобильном экране. */}
                <AlertDialogFooter className="grid grid-cols-2 sm:flex">
                    <AlertDialogCancel className="min-w-0" disabled={isRemovingBook}>
                        Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="min-w-0"
                        disabled={isRemovingBook}
                        aria-busy={isRemovingBook}
                        onClick={handleRemoveBook}
                    >
                        {isRemovingBook ? (
                            <LoaderCircle className="animate-spin" aria-hidden="true" />
                        ) : (
                            <Trash2 aria-hidden="true" />
                        )}
                        {isRemovingBook ? "Удаляем..." : "Удалить"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

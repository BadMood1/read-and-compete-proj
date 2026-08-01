"use client";

import { Check, LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";

import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import {
    addBookToCurrentUserLibrary,
    removeBookFromCurrentUserLibrary,
} from "@/lib/books/user-library-actions";
import { cn } from "@/lib/utils";

type BookLibraryBookmarkState = "not-added" | "adding" | "added" | "removing";

type BookLibraryBookmarkButtonProps = {
    googleBooksId: string;
    isBookInitiallyInLibrary: boolean;
};

const BOOKMARK_STATE_STYLES: Record<BookLibraryBookmarkState, string> = {
    "not-added": "bg-primary",
    adding: "bg-muted-foreground",
    added: "bg-destructive",
    removing: "bg-muted-foreground",
};

const BOOKMARK_STATE_LABELS: Record<BookLibraryBookmarkState, string> = {
    "not-added": "Добавить книгу в библиотеку",
    adding: "Книга добавляется в библиотеку",
    added: "Удалить книгу из библиотеки",
    removing: "Книга удаляется из библиотеки",
};

export function BookLibraryBookmarkButton({
    googleBooksId,
    isBookInitiallyInLibrary,
}: BookLibraryBookmarkButtonProps) {
    const initialState = isBookInitiallyInLibrary ? "added" : "not-added";
    const [bookmarkButtonState, setBookmarkButtonState] = useState<BookLibraryBookmarkState>(initialState);

    // Ошибка не меняет высоту карточки и сама исчезает через несколько секунд.
    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    async function handleBookLibraryBookmarkClick() {
        // Не отправляем повторную мутацию, пока добавление или удаление ещё выполняется.
        if (bookmarkButtonState === "adding" || bookmarkButtonState === "removing") {
            return;
        }

        // Определяем remove / add
        const previousBookmarkState = bookmarkButtonState;
        const isRemovingBook = previousBookmarkState === "added";
        const mutateUserLibrary = isRemovingBook
            ? removeBookFromCurrentUserLibrary
            : addBookToCurrentUserLibrary;

        setErrorMessage(null);
        setBookmarkButtonState(isRemovingBook ? "removing" : "adding");

        try {
            const result = await mutateUserLibrary(googleBooksId);

            if (!result.success) {
                setErrorMessage(result.error);
                setBookmarkButtonState(previousBookmarkState);
                return;
            }

            // Итог берём из ответа сервера, а не предполагаем его на клиенте.
            setBookmarkButtonState(result.isBookInUserLibrary ? "added" : "not-added");
        } catch {
            setErrorMessage(
                isRemovingBook
                    ? "Не удалось удалить книгу. Попробуйте ещё раз."
                    : "Не удалось добавить книгу. Попробуйте ещё раз.",
            );
            setBookmarkButtonState(previousBookmarkState);
        }
    }

    const isBookLibraryMutationPending =
        bookmarkButtonState === "adding" || bookmarkButtonState === "removing";

    return (
        <>
            <button
                type="button"
                onClick={handleBookLibraryBookmarkClick}
                aria-label={BOOKMARK_STATE_LABELS[bookmarkButtonState]}
                aria-busy={isBookLibraryMutationPending}
                disabled={isBookLibraryMutationPending}
                className={cn(
                    "group/bookmark-button absolute right-4 top-0 z-10 flex h-24 w-12 items-center justify-center text-white shadow-md",
                    "transition-[height,background-color] duration-200 ease-out motion-reduce:transition-none",
                    // На touch-устройствах ленточка всегда раскрыта. Если hover доступен,
                    // она становится короче и удлиняется при наведении на карточку.
                    "[@media(hover:hover)]:h-16 group-hover/book-card:h-24 focus-visible:h-24",
                    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    "[clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]",
                    "disabled:cursor-default disabled:opacity-100",
                    BOOKMARK_STATE_STYLES[bookmarkButtonState],
                )}
            >
                {isBookLibraryMutationPending ? (
                    // Обёртка двигается и увеличивается, а LoaderCircle независимо вращается внутри.
                    <span
                        className={cn(
                            "flex size-7 transition-transform duration-200",
                            "group-hover/book-card:translate-y-1 group-hover/book-card:scale-[1.15]",
                            "group-focus-visible/bookmark-button:translate-y-1 group-focus-visible/bookmark-button:scale-[1.15]",
                            "group-hover/bookmark-button:scale-120 motion-reduce:transition-none",
                        )}
                    >
                        <LoaderCircle className="size-7 animate-spin" aria-hidden="true" />
                    </span>
                ) : bookmarkButtonState === "added" ? (
                    <Check
                        className={cn(
                            "size-7 transition-transform duration-200",
                            // Изначально галочка не смещена, а затем двигается вместе с ленточкой.
                            "group-hover/book-card:translate-y-1 group-hover/book-card:scale-[1.15]",
                            "group-focus-visible/bookmark-button:translate-y-1 group-focus-visible/bookmark-button:scale-[1.15]",
                            "group-hover/bookmark-button:scale-140 motion-reduce:transition-none",
                        )}
                        strokeWidth={2.5}
                        aria-hidden="true"
                    />
                ) : (
                    <Plus
                        className={cn(
                            "size-7 translate-y-1 scale-[1.15] transition-transform duration-200",
                            // На устройствах с мышью плюс начинает движение вместе с ленточкой.
                            "[@media(hover:hover)]:translate-y-0 [@media(hover:hover)]:scale-100",
                            "group-hover/book-card:translate-y-1 group-hover/book-card:scale-[1.15]",
                            "group-focus-visible/bookmark-button:translate-y-1 group-focus-visible/bookmark-button:scale-[1.15]",
                            "motion-reduce:transition-none group-hover/bookmark-button:scale-140",
                        )}
                        strokeWidth={2.5}
                        aria-hidden="true"
                    />
                )}
            </button>

            {errorMessage ? (
                <p
                    role="alert"
                    className={cn(
                        "pointer-events-none absolute right-3 top-26 z-30 max-w-56 rounded-lg border border-destructive/25 bg-card px-2.5 py-1.5 text-xs text-destructive shadow-md",
                        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                        isErrorMessageVisible ? "opacity-100" : "opacity-0",
                    )}
                >
                    {errorMessage}
                </p>
            ) : null}
        </>
    );
}

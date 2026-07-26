import { Check, LoaderCircle, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export type AddBookToLibraryBookmarkButtonState = "not-added" | "adding" | "added";

type AddBookToLibraryBookmarkButtonProps = {
    state?: AddBookToLibraryBookmarkButtonState;
};

const BOOKMARK_STATE_STYLES: Record<AddBookToLibraryBookmarkButtonState, string> = {
    "not-added": "bg-primary",
    adding: "bg-muted-foreground",
    added: "bg-destructive",
};

const BOOKMARK_STATE_LABELS: Record<AddBookToLibraryBookmarkButtonState, string> = {
    "not-added": "Добавить книгу в библиотеку",
    adding: "Книга добавляется в библиотеку",
    added: "Книга уже добавлена в библиотеку",
};

// Пока это только внешний вид: позже state будет меняться после Server Action.
export function AddBookToLibraryBookmarkButton({ state = "not-added" }: AddBookToLibraryBookmarkButtonProps) {
    return (
        <button
            type="button"
            aria-label={BOOKMARK_STATE_LABELS[state]}
            aria-busy={state === "adding"}
            disabled={state !== "not-added"}
            className={cn(
                "group/bookmark-button absolute right-4 top-0 z-10 flex h-24 w-12 items-center justify-center text-white shadow-md",
                "transition-[height,background-color] duration-200 ease-out motion-reduce:transition-none",
                // На touch-устройствах ленточка всегда раскрыта. Если hover доступен,
                // она становится короче и удлиняется при наведении на карточку.
                "[@media(hover:hover)]:h-16 group-hover/book-card:h-24 focus-visible:h-24",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                "[clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]",
                "disabled:cursor-default disabled:opacity-100",
                BOOKMARK_STATE_STYLES[state],
            )}
        >
            {state === "adding" ? (
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
            ) : state === "added" ? (
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
    );
}

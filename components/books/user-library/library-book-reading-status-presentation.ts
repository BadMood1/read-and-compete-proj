import type { ReadingStatus } from "@/app/generated/prisma/enums";
import {
    BookOpen,
    BookmarkPlus,
    CircleCheck,
    CircleX,
    Pause,
    type LucideIcon,
} from "lucide-react";

type LibraryBookReadingStatusPresentation = {
    icon: LucideIcon;
    badgeClassName: string;
    readOnlyBorderClassName: string;
    interactiveClassName: string;
    menuIconClassName: string;
};

// Dropdown и read-only badge берут цвета и иконки из одного источника.
export const LIBRARY_BOOK_READING_STATUS_PRESENTATION: Record<
    ReadingStatus,
    LibraryBookReadingStatusPresentation
> = {
    WANT_TO_READ: {
        icon: BookmarkPlus,
        badgeClassName: "border-secondary bg-secondary text-primary",
        readOnlyBorderClassName: "border-rose-300 dark:border-rose-800",
        interactiveClassName: "hover:bg-secondary/80",
        menuIconClassName: "text-rose-400",
    },
    READING: {
        icon: BookOpen,
        badgeClassName: "border-primary bg-primary text-primary-foreground",
        readOnlyBorderClassName: "border-primary/50",
        interactiveClassName: "hover:bg-primary/90",
        menuIconClassName: "text-primary",
    },
    FINISHED: {
        icon: CircleCheck,
        badgeClassName: "border-foreground bg-foreground text-background",
        readOnlyBorderClassName: "border-foreground/45",
        interactiveClassName: "hover:bg-foreground/90",
        menuIconClassName: "text-foreground",
    },
    PAUSED: {
        icon: Pause,
        badgeClassName:
            "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
        readOnlyBorderClassName: "border-amber-400/70 dark:border-amber-600",
        interactiveClassName: "hover:bg-amber-200",
        menuIconClassName: "text-amber-600 dark:text-amber-400",
    },
    DROPPED: {
        icon: CircleX,
        badgeClassName: "border-destructive/25 bg-destructive/10 text-destructive",
        readOnlyBorderClassName: "border-destructive/45",
        interactiveClassName: "hover:bg-destructive/20",
        menuIconClassName: "text-destructive",
    },
};

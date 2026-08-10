import type { ReadingStatus } from "@/app/generated/prisma/enums";
import { LIBRARY_BOOK_READING_STATUS_PRESENTATION } from "@/components/books/user-library/library-book-reading-status-presentation";
import { READING_STATUS_LABELS } from "@/lib/books/reading-status-labels";
import { cn } from "@/lib/utils";

type LibraryBookReadingStatusBadgeProps = {
    readingStatus: ReadingStatus;
};

// Показывает статус книги без возможности изменить библиотеку другого пользователя.
export function LibraryBookReadingStatusBadge({ readingStatus }: LibraryBookReadingStatusBadgeProps) {
    const statusPresentation = LIBRARY_BOOK_READING_STATUS_PRESENTATION[readingStatus];
    const StatusIcon = statusPresentation.icon;

    return (
        <span
            // Прозрачный outline отличает read-only статус от залитой кнопки личной библиотеки.
            className={cn(
                "inline-flex max-w-full items-center justify-center gap-2 rounded-full border bg-transparent px-3 py-1.5 text-sm font-semibold text-foreground",
                statusPresentation.readOnlyBorderClassName,
            )}
        >
            <StatusIcon
                className={cn("size-4 shrink-0", statusPresentation.menuIconClassName)}
                aria-hidden="true"
            />
            <span className="truncate">{READING_STATUS_LABELS[readingStatus]}</span>
        </span>
    );
}

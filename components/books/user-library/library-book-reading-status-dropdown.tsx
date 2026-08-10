"use client";

import type { ReadingStatus } from "@/app/generated/prisma/enums";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { LIBRARY_BOOK_READING_STATUS_PRESENTATION } from "@/components/books/user-library/library-book-reading-status-presentation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import {
    READING_STATUS_LABELS,
    READING_STATUS_ORDER,
} from "@/lib/books/reading-status-labels";
import { updateCurrentUserBookReadingStatus } from "@/lib/books/user-library-actions";
import { cn } from "@/lib/utils";

type LibraryBookReadingStatusDropdownProps = {
    googleBooksId: string;
    readingStatus: ReadingStatus;
};

// Даёт менять статус прямо в библиотеке, не открывая отдельную страницу книги.
export function LibraryBookReadingStatusDropdown({
    googleBooksId,
    readingStatus,
}: LibraryBookReadingStatusDropdownProps) {
    const [currentReadingStatus, setCurrentReadingStatus] = useState(readingStatus);
    const [isSavingReadingStatus, setIsSavingReadingStatus] = useState(false);

    // Ошибка показывается рядом с кнопкой и сама исчезает через несколько секунд.
    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    const currentStatusPresentation =
        LIBRARY_BOOK_READING_STATUS_PRESENTATION[currentReadingStatus];
    const CurrentStatusIcon = currentStatusPresentation.icon;
    const currentStatusTriggerClassName = isSavingReadingStatus
        ? "border-border bg-muted text-muted-foreground"
        : cn(
              currentStatusPresentation.badgeClassName,
              currentStatusPresentation.interactiveClassName,
          );

    async function handleReadingStatusChange(nextReadingStatus: string) {
        if (isSavingReadingStatus || nextReadingStatus === currentReadingStatus) {
            return;
        }

        setErrorMessage(null);
        setIsSavingReadingStatus(true);

        try {
            const result = await updateCurrentUserBookReadingStatus(googleBooksId, nextReadingStatus);

            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }

            // Сервер возвращает реально сохранённый статус.
            setCurrentReadingStatus(result.readingStatus);
        } catch {
            setErrorMessage("Не удалось изменить статус. Попробуйте ещё раз.");
        } finally {
            setIsSavingReadingStatus(false);
        }
    }

    return (
        <div className="relative z-20 inline-flex max-w-full flex-col items-start">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        aria-label={`Изменить статус «${READING_STATUS_LABELS[currentReadingStatus]}»`}
                        aria-busy={isSavingReadingStatus}
                        disabled={isSavingReadingStatus}
                        className={cn(
                            "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-wait",
                            currentStatusTriggerClassName,
                        )}
                    >
                        {isSavingReadingStatus ? (
                            <>
                                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                                <span>Сохраняем...</span>
                            </>
                        ) : (
                            <>
                                <CurrentStatusIcon className="size-4" aria-hidden="true" />
                                <span className="truncate">
                                    {READING_STATUS_LABELS[currentReadingStatus]}
                                </span>
                                <ChevronDown className="size-4 opacity-70" aria-hidden="true" />
                            </>
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="min-w-56">
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                        Статус чтения
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuRadioGroup
                        value={currentReadingStatus}
                        onValueChange={handleReadingStatusChange}
                        className="flex flex-col gap-0.5"
                    >
                        {READING_STATUS_ORDER.map((status) => {
                            const statusPresentation =
                                LIBRARY_BOOK_READING_STATUS_PRESENTATION[status];
                            const StatusIcon = statusPresentation.icon;

                            return (
                                <DropdownMenuRadioItem key={status} value={status}>
                                    <StatusIcon
                                        className={statusPresentation.menuIconClassName}
                                        aria-hidden="true"
                                    />
                                    {READING_STATUS_LABELS[status]}
                                </DropdownMenuRadioItem>
                            );
                        })}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {errorMessage ? (
                <p
                    role="alert"
                    className={cn(
                        "absolute bottom-[calc(100%+0.35rem)] left-0 z-30 w-56 rounded-lg border border-destructive/25 bg-card px-2.5 py-1.5 text-xs text-destructive shadow-md",
                        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                        isErrorMessageVisible ? "opacity-100" : "opacity-0",
                    )}
                >
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}

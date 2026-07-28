"use client";

import type { ReadingStatus } from "@/app/generated/prisma/enums";
import {
    BookOpen,
    BookmarkPlus,
    ChevronDown,
    CircleCheck,
    CircleX,
    LoaderCircle,
    Pause,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";

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
import { READING_STATUS_LABELS } from "@/lib/books/reading-status-labels";
import { updateCurrentUserBookReadingStatus } from "@/lib/books/user-library-actions";
import { cn } from "@/lib/utils";

type LibraryBookReadingStatusDropdownProps = {
    googleBooksId: string;
    readingStatus: ReadingStatus;
};

type ReadingStatusPresentation = {
    icon: LucideIcon;
    triggerClassName: string;
    menuIconClassName: string;
};

const READING_STATUS_ORDER: ReadingStatus[] = ["WANT_TO_READ", "READING", "FINISHED", "PAUSED", "DROPPED"];

// Все цвета и иконки статусов находятся рядом с компонентом, а не разбросаны по карточкам.
const READING_STATUS_PRESENTATION: Record<ReadingStatus, ReadingStatusPresentation> = {
    WANT_TO_READ: {
        icon: BookmarkPlus,
        triggerClassName: "border-secondary bg-secondary text-primary hover:bg-secondary/80",
        menuIconClassName: "text-rose-400",
    },
    READING: {
        icon: BookOpen,
        triggerClassName: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        menuIconClassName: "text-primary",
    },
    FINISHED: {
        icon: CircleCheck,
        triggerClassName: "border-foreground bg-foreground text-background hover:bg-foreground/90",
        menuIconClassName: "text-foreground",
    },
    PAUSED: {
        icon: Pause,
        triggerClassName:
            "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
        menuIconClassName: "text-amber-600 dark:text-amber-400",
    },
    DROPPED: {
        icon: CircleX,
        triggerClassName: "border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/20",
        menuIconClassName: "text-destructive",
    },
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

    const currentStatusPresentation = READING_STATUS_PRESENTATION[currentReadingStatus];
    const CurrentStatusIcon = currentStatusPresentation.icon;

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
                            isSavingReadingStatus
                                ? "border-border bg-muted text-muted-foreground"
                                : currentStatusPresentation.triggerClassName,
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
                            const statusPresentation = READING_STATUS_PRESENTATION[status];
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

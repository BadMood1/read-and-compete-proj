"use client";

import { MessageCircle, RotateCw } from "lucide-react";
import { useRef, useState } from "react";

import { ReviewCommentForm } from "@/components/reviews/comments/review-comment-form";
import { ReviewCommentListItem } from "@/components/reviews/comments/review-comment-list-item";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import type {
    PublicReviewCommentData,
    PublicReviewCommentsData,
} from "@/lib/reviews/comments/review-comment-types";
import { cn } from "@/lib/utils";

type ReviewCommentsSheetProps = {
    reviewId: string;
    initialCommentsCount: number;
    bookPagePath: string;
    triggerClassName?: string;
    onCommentsCountChange?: (commentsCount: number) => void;
};

// Создаём форматтеры один раз для всего модуля, а не заново при каждом рендере панели.
const commentCountFormatter = new Intl.NumberFormat("ru-RU");
const commentPluralRules = new Intl.PluralRules("ru-RU");

// Формирует правильную русскую подпись: «1 комментарий», «2 комментария», «5 комментариев».
function formatCommentsCount(commentsCount: number) {
    const formattedCount = commentCountFormatter.format(commentsCount);

    switch (commentPluralRules.select(commentsCount)) {
        case "one":
            return `${formattedCount} комментарий`;
        case "few":
            return `${formattedCount} комментария`;
        default:
            return `${formattedCount} комментариев`;
    }
}

// API по возможности возвращает понятный текст ошибки в JSON. Если JSON прочитать нельзя,
// показываем пользователю безопасное сообщение по умолчанию.
async function getErrorMessageFromResponse(response: Response) {
    try {
        const errorData = (await response.json()) as { error?: string };
        return errorData.error ?? "Не удалось загрузить комментарии.";
    } catch {
        return "Не удалось загрузить комментарии.";
    }
}

// Открывает панель и загружает комментарии только при первом открытии.
export function ReviewCommentsSheet({
    reviewId,
    initialCommentsCount,
    bookPagePath,
    triggerClassName,
    onCommentsCountChange,
}: ReviewCommentsSheetProps) {
    // Панель и данные хранятся отдельно: закрытие панели не удаляет уже загруженные комментарии.
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [commentsData, setCommentsData] = useState<PublicReviewCommentsData | null>(null);
    const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

    // Эти состояния относятся только к первичной загрузке списка комментариев.
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);

    // Ссылка на прокручиваемую область нужна, чтобы после добавления показать свежий комментарий.
    const commentsScrollContainerRef = useRef<HTMLDivElement>(null);

    // Обновляет кнопку и при необходимости сообщает новый счётчик родительскому компоненту.
    function updateLocalCommentsCount(updatedCommentsCount: number) {
        setCommentsCount(updatedCommentsCount);
        onCommentsCountChange?.(updatedCommentsCount);
    }

    // Ждём следующий кадр: за это время React успевает добавить новый комментарий в DOM,
    // и scrollHeight уже содержит его высоту.
    function scrollCommentsToBottom(behavior: ScrollBehavior) {
        window.requestAnimationFrame(() => {
            const scrollContainer = commentsScrollContainerRef.current;

            if (scrollContainer) {
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior,
                });
            }
        });
    }

    // Обычно загружает список только один раз. shouldForceReload позволяет сверить его с БД,
    // если серверный счётчик показал, что параллельно комментарии изменил другой пользователь.
    async function loadComments(shouldForceReload = false) {
        if (isLoadingComments || (commentsData && !shouldForceReload)) {
            return;
        }

        const isInitialCommentsLoad = commentsData === null;

        setLoadErrorMessage(null);
        setIsLoadingComments(true);

        try {
            // Кодируем id перед вставкой в URL, чтобы специальные символы не изменили путь запроса.
            const response = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments`, {
                // Обсуждение должно быть свежим при первом открытии, поэтому ответ браузером не кэшируем.
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(await getErrorMessageFromResponse(response));
            }

            const loadedCommentsData = (await response.json()) as PublicReviewCommentsData;

            setCommentsData(loadedCommentsData);
            updateLocalCommentsCount(loadedCommentsData.commentsCount);
            // Открываем обсуждение на самых свежих комментариях.
            scrollCommentsToBottom("auto");
        } catch (error) {
            // Ошибка первой загрузки заменяет пустую панель. При фоновом обновлении
            // уже показанные комментарии оставляем на месте.
            if (isInitialCommentsLoad) {
                setLoadErrorMessage(
                    error instanceof Error ? error.message : "Не удалось загрузить комментарии.",
                );
            }
        } finally {
            setIsLoadingComments(false);
        }
    }

    // Sheet сообщает сюда и открытие, и закрытие. Запрос запускаем только при первом открытии.
    function handleSheetOpenChange(shouldOpen: boolean) {
        setIsSheetOpen(shouldOpen);

        if (shouldOpen && !commentsData) {
            // Обработчик не обязан ждать Promise: результат запроса сам попадёт в React-состояние.
            void loadComments();
        }
    }

    // Форма возвращает созданный сервером комментарий: обычно сразу добавляем его локально.
    // Повторный запрос понадобится только при обнаруженном расхождении со счётчиком БД.
    function handleCommentCreated(createdComment: PublicReviewCommentData, updatedCommentsCount: number) {
        const expectedCommentsCount = (commentsData?.commentsCount ?? 0) + 1;
        const didCommentsChangeWhileSubmitting = updatedCommentsCount !== expectedCommentsCount;

        // В памяти, как и на сервере, оставляем только последние 20 элементов.
        setCommentsData((currentCommentsData) => {
            const currentComments = currentCommentsData?.comments ?? [];

            return {
                comments: [...currentComments, createdComment].slice(-20),
                commentsCount: updatedCommentsCount,
            };
        });
        updateLocalCommentsCount(updatedCommentsCount);
        scrollCommentsToBottom("smooth");

        // Например, пока мы писали свой комментарий, другой пользователь успел добавить ещё один.
        // Серверный count это заметит, а повторный запрос принесёт сам отсутствующий комментарий.
        if (didCommentsChangeWhileSubmitting) {
            void loadComments(true);
        }
    }

    // После подтверждённого удаления сразу синхронизируем список и оба локальных счётчика.
    function handleCommentDeleted(deletedCommentId: string, updatedCommentsCount: number) {
        setCommentsData((currentCommentsData) => {
            if (!currentCommentsData) {
                return null;
            }

            return {
                comments: currentCommentsData.comments.filter(
                    (comment) => comment.id !== deletedCommentId,
                ),
                commentsCount: updatedCommentsCount,
            };
        });
        updateLocalCommentsCount(updatedCommentsCount);
    }

    return (
        <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
            {/* Компактная кнопка открывает панель и всегда показывает актуальный локальный счётчик. */}
            {/* asChild делает сам Button триггером и не создаёт вторую вложенную кнопку. */}
            <SheetTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    aria-label={`Открыть комментарии: ${formatCommentsCount(commentsCount)}`}
                    className={cn(
                        "w-full min-w-0 rounded-xl border border-border bg-background px-2.5 text-muted-foreground tabular-nums hover:border-primary/25 hover:bg-secondary/55 hover:text-primary data-[state=open]:border-primary/25 data-[state=open]:bg-secondary/55 data-[state=open]:text-primary sm:w-auto sm:min-w-36 sm:px-4",
                        triggerClassName,
                    )}
                >
                    <MessageCircle className="-translate-y-px sm:-translate-y-0.5" aria-hidden="true" />
                    <span className="hidden h-4 items-center leading-none sm:inline-flex">Комментарии</span>
                    <span
                        className="inline-flex h-4 min-w-[1ch] items-center justify-center leading-none"
                        aria-live="polite"
                    >
                        {commentsCount}
                    </span>
                </Button>
            </SheetTrigger>

            <SheetContent className="h-[85dvh]">
                {/* Неподвижная верхняя часть панели. */}
                <SheetHeader className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
                    <SheetTitle>Комментарии</SheetTitle>
                    <SheetDescription>{formatCommentsCount(commentsCount)}</SheetDescription>
                </SheetHeader>

                {/* Прокручивается только список: заголовок и форма остаются на месте. */}
                <div
                    ref={commentsScrollContainerRef}
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"
                >
                    {/* У списка четыре состояния: загрузка, ошибка, готовые комментарии и пустой список. */}
                    {isLoadingComments && !commentsData ? (
                        <div role="status" className="space-y-5 motion-safe:animate-pulse">
                            <span className="sr-only">Загружаем комментарии...</span>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} aria-hidden="true" className="flex gap-3">
                                    <div className="size-8 shrink-0 rounded-full bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 rounded-full bg-muted" />
                                        <div className="h-3 w-full rounded-full bg-muted" />
                                        <div className="h-3 w-4/5 rounded-full bg-muted" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : loadErrorMessage ? (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                            <p role="alert" className="max-w-xs text-sm leading-6 text-destructive">
                                {loadErrorMessage}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => void loadComments()}
                            >
                                <RotateCw aria-hidden="true" />
                                Повторить
                            </Button>
                        </div>
                    ) : commentsData?.comments.length ? (
                        <>
                            {/* API отдаёт только последние 20 записей, но счётчик содержит их полное число. */}
                            {commentsData.commentsCount > commentsData.comments.length ? (
                                <p className="mb-4 text-xs leading-5 text-muted-foreground">
                                    Показаны последние {commentsData.comments.length} из{" "}
                                    {commentsData.commentsCount}.
                                </p>
                            ) : null}

                            <ul className="divide-y divide-border">
                                {commentsData.comments.map((comment) => (
                                    <ReviewCommentListItem
                                        key={comment.id}
                                        comment={comment}
                                        bookPagePath={bookPagePath}
                                        onCommentDeleted={handleCommentDeleted}
                                    />
                                ))}
                            </ul>
                        </>
                    ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                            <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                                <MessageCircle className="size-5" aria-hidden="true" />
                            </span>
                            <p className="mt-3 text-sm font-semibold">Комментариев пока нет</p>
                            <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">
                                Здесь появится обсуждение этой рецензии.
                            </p>
                        </div>
                    )}
                </div>

                {/* Форму показываем только после успешной загрузки данных рецензии. */}
                {commentsData ? (
                    <ReviewCommentForm reviewId={reviewId} onCommentCreated={handleCommentCreated} />
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

"use client";

import { LoaderCircle, Pencil, Star, Trash2 } from "lucide-react";

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
    saveCurrentUserReview,
    type CurrentUserReviewData,
} from "@/lib/reviews/current-user-review-actions";
import { type FormEvent, type MouseEvent, useState } from "react";

const REVIEW_RATING_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

type CurrentUserBookReviewEditorProps = {
    googleBooksId: string;
    initialReview: CurrentUserReviewData | null;
};

// Сервер передаёт существующую рецензию через initialReview при первом открытии страницы.
export function CurrentUserBookReviewEditor({
    googleBooksId,
    initialReview,
}: CurrentUserBookReviewEditorProps) {
    const [isSavingReview, setIsSavingReview] = useState(false);
    const [isDeletingReview, setIsDeletingReview] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // После сохранения здесь лежит актуальная рецензия, поэтому интерфейс обновляется без перезагрузки.
    const [currentReview, setCurrentReview] = useState(initialReview);
    // развернута форма при true:
    const [isEditingReview, setIsEditingReview] = useState<boolean>(initialReview === null);
    // Компактный вид показываем, когда рецензия уже сохранена и сейчас не редактируется.
    const isShowingSavedReview = currentReview !== null && !isEditingReview;

    async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSavingReview) {
            return;
        }

        const formData = new FormData(event.currentTarget);

        const rating = Number(formData.get("rating"));
        const reviewText = String(formData.get("reviewText") ?? "");

        setErrorMessage(null);
        setIsSavingReview(true);

        try {
            const result = await saveCurrentUserReview(googleBooksId, rating, reviewText);

            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }

            setCurrentReview(result.review);
            setIsEditingReview(false);
        } catch {
            setErrorMessage("Не удалось сохранить рецензию. Попробуйте ещё раз.");
        } finally {
            setIsSavingReview(false);
        }
    }

    function handleStartReviewEditing() {
        setErrorMessage(null);
        setIsEditingReview(true);
    }

    function handleCancelReviewEditing() {
        setErrorMessage(null);
        setIsEditingReview(false);
    }

    function handleDeleteDialogOpenChange(shouldOpen: boolean) {
        // Не закрываем окно посреди запроса и не оставляем в нём старую ошибку.
        if (isDeletingReview) {
            return;
        }

        setErrorMessage(null);
        setIsDeleteDialogOpen(shouldOpen);
    }

    async function handleReviewDelete(event: MouseEvent<HTMLButtonElement>) {
        // AlertDialogAction обычно закрывает окно сразу, а нам нужно дождаться ответа сервера.
        event.preventDefault();

        if (isDeletingReview) {
            return;
        }

        setErrorMessage(null);
        setIsDeletingReview(true);

        try {
            const result = await deleteCurrentUserReview(googleBooksId);

            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }

            // После удаления снова показываем пустую форму для новой рецензии.
            setCurrentReview(null);
            setIsEditingReview(true);
            setIsDeleteDialogOpen(false);
        } catch {
            setErrorMessage("Не удалось удалить рецензию. Попробуйте ещё раз.");
        } finally {
            setIsDeletingReview(false);
        }
    }

    return (
        <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <div className={isShowingSavedReview ? "flex items-center gap-3" : "flex items-start gap-3"}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <Star className="size-5 text-primary" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-primary">Ваша рецензия</p>

                        {isShowingSavedReview ? (
                            <span className="rounded-full border border-primary/15 bg-secondary/70 px-3 py-1 text-sm font-semibold text-primary">
                                Оценка: {currentReview.rating} / 10
                            </span>
                        ) : null}
                    </div>

                    {isShowingSavedReview ? null : (
                        <>
                            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                                {currentReview ? "Измените свою рецензию" : "Поделитесь впечатлением"}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Поставьте оценку и при желании напишите несколько слов о книге.
                            </p>
                        </>
                    )}
                </div>
            </div>

            {isShowingSavedReview ? (
                // В сохранённом состоянии оставляем текст прямо в секции, без лишней вложенной карточки.
                <div className="mt-6 border-t border-border pt-5">
                    {currentReview.text ? (
                        <p className="wrap-break-word whitespace-pre-line text-sm leading-7">
                            {currentReview.text}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">Текст рецензии не добавлен.</p>
                    )}

                    <div className="mt-4 flex flex-wrap justify-end gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary"
                            onClick={handleStartReviewEditing}
                        >
                            <Pencil aria-hidden="true" />
                            Изменить
                        </Button>

                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
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
                                        Оценка и текст рецензии будут удалены. Сама книга останется в вашей
                                        библиотеке.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                {errorMessage ? (
                                    <p role="alert" className="text-sm text-destructive">
                                        {errorMessage}
                                    </p>
                                ) : null}

                                {/* Короткие действия помещаются в одну строку даже на мобильном. */}
                                <AlertDialogFooter className="grid grid-cols-2 sm:flex">
                                    <AlertDialogCancel disabled={isDeletingReview}>Отмена</AlertDialogCancel>
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
            ) : (
                <form onSubmit={handleReviewSubmit} className="mt-7 space-y-6">
                    {/* Блокируем поля на время запроса, чтобы отправленные данные не менялись визуально. */}
                    <fieldset disabled={isSavingReview}>
                        <legend className="text-sm font-semibold">Оценка от 1 до 10</legend>

                        {/* Нативные radio сохраняют доступность и позволяют выбрать только одну оценку. */}
                        <div className="mt-3 grid max-w-xl grid-cols-5 gap-2 sm:grid-cols-10">
                            {REVIEW_RATING_OPTIONS.map((rating) => (
                                <label key={rating} className="cursor-pointer">
                                    <input
                                        type="radio"
                                        name="rating"
                                        value={rating}
                                        defaultChecked={currentReview?.rating === rating}
                                        className="peer sr-only"
                                        required
                                    />
                                    <span
                                        className="flex h-10 items-center justify-center rounded-xl border border-border bg-background text-sm font-semibold transition-colors
                                        hover:border-primary/45 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground
                                        peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary/35"
                                    >
                                        {rating}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <label htmlFor="current-user-review-text" className="text-sm font-semibold">
                                Текст рецензии
                            </label>
                            <span className="text-xs text-muted-foreground">
                                Необязательно · до 5000 символов
                            </span>
                        </div>

                        <textarea
                            id="current-user-review-text"
                            name="reviewText"
                            rows={6}
                            maxLength={5000}
                            defaultValue={currentReview?.text ?? ""}
                            disabled={isSavingReview}
                            placeholder="Что вам понравилось или не понравилось в этой книге?"
                            className="mt-3 w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 shadow-sm outline-none transition
                            placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-wait disabled:opacity-60"
                        />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {errorMessage ? (
                            <p role="alert" className="text-sm text-destructive">
                                {errorMessage}
                            </p>
                        ) : (
                            <span />
                        )}

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            {currentReview ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    disabled={isSavingReview}
                                    className="w-full sm:w-auto"
                                    onClick={handleCancelReviewEditing}
                                >
                                    Отмена
                                </Button>
                            ) : null}

                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSavingReview}
                                aria-busy={isSavingReview}
                                className="w-full sm:w-auto"
                            >
                                {isSavingReview
                                    ? "Сохраняем..."
                                    : currentReview
                                      ? "Сохранить изменения"
                                      : "Сохранить рецензию"}
                            </Button>
                        </div>
                    </div>
                </form>
            )}
        </section>
    );
}

"use client";

import { Star } from "lucide-react";
import { type FormEvent, useState } from "react";

import { CurrentUserReviewForm } from "./current-user-review-form";
import { SavedCurrentUserReview } from "./saved-current-user-review";
import {
    saveCurrentUserReview,
    type CurrentUserReviewData,
} from "@/lib/reviews/current-user-review-actions";

type CurrentUserBookReviewEditorProps = {
    googleBooksId: string;
    initialReview: CurrentUserReviewData | null;
    isBookInCurrentUserLibrary: boolean;
};

// Сервер передаёт существующую рецензию через initialReview при первом открытии страницы.
export function CurrentUserBookReviewEditor({
    googleBooksId,
    initialReview,
    isBookInCurrentUserLibrary,
}: CurrentUserBookReviewEditorProps) {
    const [isSavingReview, setIsSavingReview] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // После сохранения здесь лежит актуальная рецензия, поэтому интерфейс обновляется без перезагрузки.
    const [currentReview, setCurrentReview] = useState(initialReview);
    // развернута форма при true:
    const [isEditingReview, setIsEditingReview] = useState<boolean>(initialReview === null);
    // Компактный вид показываем, когда рецензия уже сохранена и сейчас не редактируется.
    const isShowingSavedReview = currentReview !== null && !isEditingReview;
    // Новую рецензию можно создать только после добавления книги в личную библиотеку.
    // Уже существующую оставляем доступной, даже если пользователь позже удалил UserBook.
    const isReviewCreationLocked = currentReview === null && !isBookInCurrentUserLibrary;

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

    function handleReviewDeleted() {
        // После удаления снова показываем пустую форму для новой рецензии.
        setErrorMessage(null);
        setCurrentReview(null);
        setIsEditingReview(true);
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

                    {isShowingSavedReview ? null : isReviewCreationLocked ? (
                        <>
                            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                                Рецензия пока недоступна
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Добавьте книгу в библиотеку, чтобы поставить оценку или написать
                                рецензию.
                            </p>
                        </>
                    ) : (
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

            {isReviewCreationLocked ? null : isShowingSavedReview ? (
                <SavedCurrentUserReview
                    googleBooksId={googleBooksId}
                    review={currentReview}
                    onStartReviewEditing={handleStartReviewEditing}
                    onReviewDeleted={handleReviewDeleted}
                />
            ) : (
                <CurrentUserReviewForm
                    currentReview={currentReview}
                    isSavingReview={isSavingReview}
                    errorMessage={errorMessage}
                    onReviewSubmit={handleReviewSubmit}
                    onCancelReviewEditing={
                        currentReview ? handleCancelReviewEditing : undefined
                    }
                />
            )}
        </section>
    );
}

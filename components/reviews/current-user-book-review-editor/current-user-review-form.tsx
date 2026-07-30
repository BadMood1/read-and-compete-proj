import type { FormEventHandler } from "react";

import { Button } from "@/components/ui/button";
import type { CurrentUserReviewData } from "@/lib/reviews/current-user-review-actions";

const REVIEW_RATING_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

type CurrentUserReviewFormProps = {
    currentReview: CurrentUserReviewData | null;
    isSavingReview: boolean;
    errorMessage: string | null;
    onReviewSubmit: FormEventHandler<HTMLFormElement>;
    onCancelReviewEditing?: () => void;
};

// Отдельно держим всю разметку создания и редактирования рецензии.
export function CurrentUserReviewForm({
    currentReview,
    isSavingReview,
    errorMessage,
    onReviewSubmit,
    onCancelReviewEditing,
}: CurrentUserReviewFormProps) {
    return (
        <form onSubmit={onReviewSubmit} className="mt-7 space-y-6">
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
                    {currentReview && onCancelReviewEditing ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            disabled={isSavingReview}
                            className="w-full sm:w-auto"
                            onClick={onCancelReviewEditing}
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
    );
}

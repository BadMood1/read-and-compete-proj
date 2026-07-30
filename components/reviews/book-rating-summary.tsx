import { Star } from "lucide-react";

type BookRatingSummaryProps = {
    averageRating: number | null;
    ratingsCount: number;
};

// Подбирает правильное окончание: «1 оценка», «2 оценки», «5 оценок».
function formatRatingsCount(ratingsCount: number) {
    const lastTwoDigits = ratingsCount % 100;
    const lastDigit = ratingsCount % 10;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return `${ratingsCount} оценок`;
    }

    if (lastDigit === 1) {
        return `${ratingsCount} оценка`;
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
        return `${ratingsCount} оценки`;
    }

    return `${ratingsCount} оценок`;
}

// Компактно показывает среднюю оценку всех пользователей сайта.
export function BookRatingSummary({
    averageRating,
    ratingsCount,
}: BookRatingSummaryProps) {
    const hasRatings = averageRating !== null && ratingsCount > 0;

    // Оставляем один знак после запятой, чтобы рейтинг не выглядел перегруженным.
    const formattedAverageRating = averageRating?.toFixed(1).replace(".", ",");

    return (
        <div className="mt-5 flex w-fit items-center gap-3 rounded-2xl border border-primary/15 bg-secondary/55 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                <Star className="size-4 fill-current" aria-hidden="true" />
            </span>

            <div>
                <p className="text-xs font-medium text-muted-foreground">Рейтинг читателей</p>

                {hasRatings ? (
                    <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold">
                            {formattedAverageRating} / 10
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {formatRatingsCount(ratingsCount)}
                        </span>
                    </p>
                ) : (
                    <p className="mt-0.5 text-sm font-medium">Пока нет оценок</p>
                )}
            </div>
        </div>
    );
}

import {
    BookCheck,
    BookOpenText,
    MessageSquareText,
    Star,
    type LucideIcon,
} from "lucide-react";

type ProfileStatisticsProps = {
    statistics: {
        finishedBooksCount: number;
        totalFinishedPages: number;
        reviewsCount: number;
        averageReviewRating: number | null;
    };
};

type ProfileStatisticCard = {
    label: string;
    value: string;
    icon: LucideIcon;
};

// Делит большие числа на разряды: 12345 → «12 345».
const integerNumberFormatter = new Intl.NumberFormat("ru-RU");

// Использует русскую запятую и оставляет максимум один знак: 8.25 → «8,3».
const ratingNumberFormatter = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
});

// Собирает статистику в одном месте, чтобы разметка всех четырёх карточек была одинаковой.
function createProfileStatisticCards(
    statistics: ProfileStatisticsProps["statistics"],
): ProfileStatisticCard[] {
    const formattedAverageRating =
        statistics.averageReviewRating === null
            ? "—"
            : `${ratingNumberFormatter.format(statistics.averageReviewRating)} / 10`;

    return [
        {
            label: "Прочитано",
            value: integerNumberFormatter.format(statistics.finishedBooksCount),
            icon: BookCheck,
        },
        {
            label: "Страниц",
            value: integerNumberFormatter.format(statistics.totalFinishedPages),
            icon: BookOpenText,
        },
        {
            // Review без текста всё равно содержит оценку и тоже входит в этот счётчик.
            label: "Оценок",
            value: integerNumberFormatter.format(statistics.reviewsCount),
            icon: MessageSquareText,
        },
        {
            label: "Средняя оценка",
            value: formattedAverageRating,
            icon: Star,
        },
    ];
}

export function ProfileStatistics({ statistics }: ProfileStatisticsProps) {
    const statisticCards = createProfileStatisticCards(statistics);

    return (
        <section aria-labelledby="profile-statistics-heading">
            <h2 id="profile-statistics-heading" className="sr-only">
                Статистика читателя
            </h2>

            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {statisticCards.map(({ label, value, icon: Icon }) => (
                    <div
                        key={label}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
                    >
                        <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-primary">
                                <Icon className="size-5" aria-hidden="true" />
                            </span>
                            {label}
                        </dt>
                        <dd className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

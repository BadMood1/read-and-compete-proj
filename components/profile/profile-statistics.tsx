import {
    Angry,
    BadgeMinus,
    BookCheck,
    BookOpenText,
    Heart,
    MessageSquareText,
    Scale,
    Star,
    type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

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
    description?: string;
    cardClassName?: string;
    iconClassName?: string;
    descriptionClassName?: string;
};

type AverageRatingPresentation = Pick<
    ProfileStatisticCard,
    "icon" | "description" | "cardClassName" | "iconClassName" | "descriptionClassName"
>;

// Делит большие числа на разряды: 12345 → «12 345».
const integerNumberFormatter = new Intl.NumberFormat("ru-RU");

// Использует русскую запятую и оставляет максимум один знак: 8.25 → «8,3».
const ratingNumberFormatter = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
});

// Определяет стиль читателя по средней оценке, которую он ставит книгам.
function getAverageRatingPresentation(averageReviewRating: number | null): AverageRatingPresentation {
    if (averageReviewRating === null) {
        return {
            description: "Пока без оценок",
            icon: Star,
        };
    }

    if (averageReviewRating < 4) {
        return {
            description: "Яростный критик",
            icon: Angry,
            cardClassName: "border-red-300 bg-red-100",
            iconClassName: "bg-red-200/80 text-red-700",
            descriptionClassName: "text-red-700",
        };
    }

    if (averageReviewRating < 6) {
        return {
            description: "Строгий критик",
            icon: BadgeMinus,
            cardClassName: "border-rose-200 bg-rose-50/70",
            iconClassName: "bg-rose-200/75 text-rose-700",
            descriptionClassName: "text-rose-700",
        };
    }

    if (averageReviewRating < 8) {
        return {
            description: "Взвешенный читатель",
            icon: Scale,
            cardClassName: "border-amber-200 bg-amber-50/75",
            iconClassName: "bg-amber-200/80 text-amber-700",
            descriptionClassName: "text-amber-700",
        };
    }

    return {
        description: "Щедрый оценщик",
        icon: Heart,
        cardClassName: "border-emerald-200 bg-emerald-50/75",
        iconClassName: "bg-emerald-200/75 text-emerald-700",
        descriptionClassName: "text-emerald-700",
    };
}

// Собирает статистику в одном месте, чтобы разметка всех четырёх карточек была одинаковой.
function createProfileStatisticCards(
    statistics: ProfileStatisticsProps["statistics"],
): ProfileStatisticCard[] {
    const averageRatingPresentation = getAverageRatingPresentation(statistics.averageReviewRating);
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
            ...averageRatingPresentation,
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
                {statisticCards.map(
                    ({
                        label,
                        value,
                        icon: Icon,
                        description,
                        cardClassName,
                        iconClassName,
                        descriptionClassName,
                    }) => (
                        <div
                            key={label}
                            className={cn(
                                "rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors sm:p-5",
                                cardClassName,
                            )}
                        >
                            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span
                                    className={cn(
                                        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-primary",
                                        iconClassName,
                                    )}
                                >
                                    <Icon className="size-5" aria-hidden="true" />
                                </span>
                                {label}
                            </dt>
                            <dd className="mt-5">
                                <span className="block text-2xl font-bold tracking-tight sm:text-3xl">
                                    {value}
                                </span>
                                {description ? (
                                    <span
                                        className={cn(
                                            "mt-1 block text-xs font-semibold text-muted-foreground",
                                            descriptionClassName,
                                        )}
                                    >
                                        {description}
                                    </span>
                                ) : null}
                            </dd>
                        </div>
                    ),
                )}
            </dl>
        </section>
    );
}

import Link from "next/link";

import {
    LEADERBOARD_METRICS,
    LEADERBOARD_PERIODS,
    type LeaderboardMetric,
    type LeaderboardPageFilters,
    type LeaderboardPeriod,
} from "@/lib/leaderboard/leaderboard-page-filters";
import { createLeaderboardPagePath } from "@/lib/leaderboard/leaderboard-navigation";
import { cn } from "@/lib/utils";

const LEADERBOARD_METRIC_LABELS: Record<LeaderboardMetric, string> = {
    books: "Книги",
    pages: "Страницы",
};

const LEADERBOARD_PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
    week: "Неделя",
    month: "Месяц",
    year: "Год",
    all: "Всё время",
};

export function LeaderboardFilters({
    selectedMetric,
    selectedPeriod,
    selectedScope,
}: LeaderboardPageFilters) {
    return (
        <section
            aria-label="Настройки рейтинга"
            className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5"
        >
            <div className="grid gap-5 md:flex md:items-end md:justify-between">
                {/* Метрика определяет, по какому значению расставляются места. */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Считать по
                    </p>
                    <nav
                        aria-label="Метрика рейтинга"
                        className="grid grid-cols-2 rounded-xl bg-muted p-1 sm:w-fit"
                    >
                        {LEADERBOARD_METRICS.map((metric) => {
                            const isCurrentMetric = metric === selectedMetric;

                            return (
                                // page.tsx заново выполнится на сервере после клика с новым searchParams
                                <Link
                                    key={metric}
                                    href={createLeaderboardPagePath({
                                        selectedMetric: metric,
                                        selectedPeriod,
                                        selectedScope,
                                    })}
                                    aria-current={isCurrentMetric ? "page" : undefined}
                                    className={cn(
                                        "rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors",
                                        isCurrentMetric
                                            ? "bg-card text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {LEADERBOARD_METRIC_LABELS[metric]}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Выбранный период ограничивает даты завершения книг. */}
                <div className="min-w-0 md:ml-auto md:w-md">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-right">
                        Период
                    </p>
                    <nav
                        aria-label="Период рейтинга"
                        className="grid w-full grid-cols-4 rounded-xl bg-muted p-1"
                    >
                        {LEADERBOARD_PERIODS.map((period) => {
                            const isCurrentPeriod = period === selectedPeriod;

                            return (
                                <Link
                                    key={period}
                                    href={createLeaderboardPagePath({
                                        selectedMetric,
                                        selectedPeriod: period,
                                        selectedScope,
                                    })}
                                    aria-current={isCurrentPeriod ? "page" : undefined}
                                    className={cn(
                                        "flex min-w-0 items-center justify-center rounded-lg px-1 py-2 text-center text-xs font-medium whitespace-nowrap transition-colors sm:text-sm",
                                        isCurrentPeriod
                                            ? "bg-card text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {period === "all" ? (
                                        <>
                                            <span className="sm:hidden">Всё</span>
                                            <span className="hidden sm:inline">Всё время</span>
                                        </>
                                    ) : (
                                        LEADERBOARD_PERIOD_LABELS[period]
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </section>
    );
}

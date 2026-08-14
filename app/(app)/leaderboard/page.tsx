import { Suspense } from "react";

import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";
import { LeaderboardPageSkeleton } from "@/components/leaderboard/leaderboard-page-skeleton";
import {
    getLeaderboardPageFilters,
    type LeaderboardPageSearchParameters,
} from "@/lib/leaderboard/leaderboard-page-filters";
import { formatLeaderboardPeriodDateRange } from "@/lib/leaderboard/leaderboard-period-date-range";
import { getLeaderboardResults } from "@/lib/leaderboard/leaderboard-queries";

type LeaderboardPageProps = {
    searchParams: Promise<LeaderboardPageSearchParameters>;
};

// Эта часть ждёт параметры URL и данные БД внутри ближайшего Suspense.
async function LeaderboardPageContent({ searchParams }: LeaderboardPageProps) {
    // получаем норм. фильтры (с дефолт. значениями, если не указано)
    const leaderboardFilters = getLeaderboardPageFilters(await searchParams);
    // Одна дата используется и запросом, и подписью — они не разойдутся на границе суток.
    const leaderboardCalculatedAt = new Date();
    const leaderboardResults = await getLeaderboardResults(leaderboardFilters, leaderboardCalculatedAt);
    const periodDateRange = formatLeaderboardPeriodDateRange(
        leaderboardFilters.selectedPeriod,
        leaderboardCalculatedAt,
    );

    return (
        <>
            <LeaderboardFilters {...leaderboardFilters} />
            <LeaderboardList
                leaderboardResults={leaderboardResults}
                leaderboardFilters={leaderboardFilters}
                periodDateRange={periodDateRange}
            />
        </>
    );
}

export default function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
            {/* Заголовок сохраняет смысл страницы, но визуально не занимает отдельный большой блок. */}
            <h1 className="sr-only">Рейтинг читателей</h1>

            <Suspense fallback={<LeaderboardPageSkeleton />}>
                <LeaderboardPageContent searchParams={searchParams} />
            </Suspense>
        </main>
    );
}

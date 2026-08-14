import type { LeaderboardPeriod } from "@/lib/leaderboard/leaderboard-page-filters";
import { getLeaderboardPeriodStart } from "@/lib/leaderboard/leaderboard-period-start";

const leaderboardDateRangeFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
});

// Форматирует реальный диапазон данных: например, «1–13 августа 2026 г.».
// Для all начальная дата не ограничена, поэтому точный диапазон не нужен.
export function formatLeaderboardPeriodDateRange(
    selectedPeriod: LeaderboardPeriod,
    currentDate: Date,
) {
    const periodStart = getLeaderboardPeriodStart(selectedPeriod, currentDate);

    if (periodStart === null) {
        return "За всё время";
    }

    return leaderboardDateRangeFormatter.formatRange(periodStart, currentDate);
}

import type {
    LeaderboardMetric,
    LeaderboardPeriod,
    LeaderboardScope,
} from "@/lib/leaderboard/leaderboard-page-filters";

type CreateLeaderboardPagePathOptions = {
    selectedMetric: LeaderboardMetric;
    selectedPeriod: LeaderboardPeriod;
    selectedScope: LeaderboardScope;
};

// Собирает ссылку и сохраняет все три независимых фильтра рейтинга.
export function createLeaderboardPagePath({
    selectedMetric,
    selectedPeriod,
    selectedScope,
}: CreateLeaderboardPagePathOptions) {
    const searchParameters = new URLSearchParams({
        scope: selectedScope,
        metric: selectedMetric,
        period: selectedPeriod,
    });

    return `/leaderboard?${searchParameters.toString()}`;
}

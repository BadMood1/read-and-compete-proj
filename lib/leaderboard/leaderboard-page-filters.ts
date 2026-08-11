// Эти массивы одновременно нужны TypeScript для типов и JavaScript для проверки URL.
export const LEADERBOARD_METRICS = ["books", "pages"] as const;
export const LEADERBOARD_PERIODS = ["week", "month", "year", "all"] as const;

// [number] - возьми тип любого элемента массива
export type LeaderboardMetric = (typeof LEADERBOARD_METRICS)[number];
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

// По умолчанию
export const DEFAULT_LEADERBOARD_METRIC: LeaderboardMetric = "books";
export const DEFAULT_LEADERBOARD_PERIOD: LeaderboardPeriod = "month";

type LeaderboardPageSearchParameter = string | string[] | undefined;

// Сырой вид параметров, которые Next.js передаёт странице из URL.
export type LeaderboardPageSearchParameters = {
    metric?: LeaderboardPageSearchParameter;
    period?: LeaderboardPageSearchParameter;
};

// После проверки остальной код получает только допустимые значения без undefined.
export type LeaderboardPageFilters = {
    selectedMetric: LeaderboardMetric;
    selectedPeriod: LeaderboardPeriod;
};

// Повторяющийся параметр URL вроде ?metric=books&metric=pages приходит массивом.
function getFirstLeaderboardSearchParameterValue(searchParameter: LeaderboardPageSearchParameter) {
    return Array.isArray(searchParameter) ? searchParameter[0] : searchParameter;
}

// Проверяет параметры URL и независимо подставляет дефолт для неправильного значения.
export function getLeaderboardPageFilters(
    searchParameters: LeaderboardPageSearchParameters,
): LeaderboardPageFilters {
    const rawMetric = getFirstLeaderboardSearchParameterValue(searchParameters.metric);
    const rawPeriod = getFirstLeaderboardSearchParameterValue(searchParameters.period);

    // Выбираем из разрешенных, если нет, то берём по умолчанию
    const selectedMetric =
        LEADERBOARD_METRICS.find((metric) => metric === rawMetric) ?? DEFAULT_LEADERBOARD_METRIC;
    const selectedPeriod =
        LEADERBOARD_PERIODS.find((period) => period === rawPeriod) ?? DEFAULT_LEADERBOARD_PERIOD;

    return {
        selectedMetric,
        selectedPeriod,
    };
}

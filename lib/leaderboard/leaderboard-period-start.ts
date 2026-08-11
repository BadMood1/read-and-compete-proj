import type { LeaderboardPeriod } from "@/lib/leaderboard/leaderboard-page-filters";

const MOSCOW_UTC_OFFSET_IN_HOURS = 3;
const MILLISECONDS_IN_HOUR = 60 * 60 * 1000;

type MoscowCalendarDateParts = {
    year: number;
    monthIndex: number;
    dayOfMonth: number;
};

// Получаем московскую календарную дату независимо от часового пояса сервера.
// Это важно на хостинге: сервер Vercel обычно работает по UTC, а не по Москве.
function getMoscowCalendarDateParts(date: Date): MoscowCalendarDateParts {
    const dateShiftedToMoscowTime = new Date(
        date.getTime() + MOSCOW_UTC_OFFSET_IN_HOURS * MILLISECONDS_IN_HOUR,
    );

    return {
        year: dateShiftedToMoscowTime.getUTCFullYear(),
        monthIndex: dateShiftedToMoscowTime.getUTCMonth(),
        dayOfMonth: dateShiftedToMoscowTime.getUTCDate(),
    };
}

// Создаём момент московской полуночи и возвращаем его как обычный Date в UTC.
// Date.UTC сам корректно переносит дни за границы месяца, например 1 августа - 3 дня.
function createDateAtMoscowMidnight(year: number, monthIndex: number, dayOfMonth: number) {
    return new Date(Date.UTC(year, monthIndex, dayOfMonth, -MOSCOW_UTC_OFFSET_IN_HOURS));
}

// Возвращает начало выбранного календарного периода по московскому времени.
// null для all означает, что ограничивать записи по дате вообще не нужно.
export function getLeaderboardPeriodStart(
    selectedPeriod: LeaderboardPeriod,
    currentDate = new Date(),
): Date | null {
    if (selectedPeriod === "all") {
        return null;
    }

    const { year, monthIndex, dayOfMonth } = getMoscowCalendarDateParts(currentDate);

    if (selectedPeriod === "year") {
        return createDateAtMoscowMidnight(year, 0, 1);
    }

    if (selectedPeriod === "month") {
        return createDateAtMoscowMidnight(year, monthIndex, 1);
    }

    // getUTCDay возвращает 0 для воскресенья, а наша неделя начинается с понедельника.
    const dayOfWeek = new Date(Date.UTC(year, monthIndex, dayOfMonth)).getUTCDay();
    const daysPassedSinceMonday = (dayOfWeek + 6) % 7;

    return createDateAtMoscowMidnight(year, monthIndex, dayOfMonth - daysPassedSinceMonday);
}

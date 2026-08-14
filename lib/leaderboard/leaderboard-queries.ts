import "server-only";

import { FriendRequestStatus, ReadingStatus } from "@/app/generated/prisma/enums";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import type { LeaderboardMetric, LeaderboardPageFilters } from "@/lib/leaderboard/leaderboard-page-filters";
import { getLeaderboardPeriodStart } from "@/lib/leaderboard/leaderboard-period-start";
import prisma from "@/lib/prisma";

const LEADERBOARD_USERS_LIMIT = 100;

type LeaderboardEntryRelationshipToCurrentUser = "CURRENT_USER" | "FRIEND" | "OTHER";

export type LeaderboardEntry = {
    position: number;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
    finishedBooksCount: number;
    finishedPagesCount: number;
    score: number; // кол-во книг или страниц в зависимости от выбранной метрики
    relationshipToCurrentUser: LeaderboardEntryRelationshipToCurrentUser;
};

export type LeaderboardResults = {
    entries: LeaderboardEntry[];
    totalParticipantsCount: number;
    currentUserEntryOutsideLimit: LeaderboardEntry | null;
};

type LeaderboardEntryWithoutPosition = Omit<LeaderboardEntry, "position">;

// ДЛЯ иконок возле друзей
// Возвращает ID принятых друзей независимо от того, кто отправлял исходную заявку.
// Нужны только идентификаторы: остальные данные друга уже получит основной запрос пользователей.
async function getAcceptedFriendUserIds(currentUserId: string): Promise<string[]> {
    const acceptedFriendships = await prisma.friendRequest.findMany({
        where: {
            status: FriendRequestStatus.ACCEPTED,
            OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
        },
        select: {
            senderId: true,
            receiverId: true,
        },
    });

    return acceptedFriendships.map((friendship) =>
        friendship.senderId === currentUserId ? friendship.receiverId : friendship.senderId,
    );
}

// Выбранная метрика определяет, какое число используется для сортировки рейтинга.
function getLeaderboardEntryScore(
    selectedMetric: LeaderboardMetric,
    finishedBooksCount: number,
    finishedPagesCount: number,
) {
    return selectedMetric === "books" ? finishedBooksCount : finishedPagesCount;
}

// Сначала ставим выше больший результат, а при равенстве используем ID.
// Дополнительное сравнение по ID делает порядок одинаковым при каждом запросе.
function compareLeaderboardEntries(
    firstEntry: LeaderboardEntryWithoutPosition,
    secondEntry: LeaderboardEntryWithoutPosition,
) {
    const scoreDifference = secondEntry.score - firstEntry.score;

    if (scoreDifference !== 0) {
        return scoreDifference;
    }

    return firstEntry.user.id.localeCompare(secondEntry.user.id);
}

// Присваиваем одинаковое место пользователям с одинаковым результатом.
// Поэтому после двух первых мест следующим будет третье: 1, 1, 3.
function addLeaderboardPositions(sortedEntries: LeaderboardEntryWithoutPosition[]): LeaderboardEntry[] {
    let previousScore: number | null = null;
    let currentPosition = 0;

    return sortedEntries.map((entry, index) => {
        if (previousScore === null || entry.score !== previousScore) {
            currentPosition = index + 1;
            previousScore = entry.score;
        }

        return {
            ...entry,
            position: currentPosition,
        };
    });
}

// Получает глобальный рейтинг или рейтинг среди друзей за выбранный период.
// После небольшой выборки ID друзей основной запрос забирает только нужные поля пользователей.
// Количество книг и страницы затем считаются ниже в TypeScript.
export async function getLeaderboardResults(
    { selectedMetric, selectedPeriod, selectedScope }: LeaderboardPageFilters,
    currentDate = new Date(),
): Promise<LeaderboardResults> {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;

    // Без вошедшего пользователя невозможно определить его круг друзей.
    // Защищённый layout обычно не допустит этот случай, но запрос остаётся безопасным сам по себе.
    if (selectedScope === "friends" && !currentUserId) {
        return {
            entries: [],
            totalParticipantsCount: 0,
            currentUserEntryOutsideLimit: null,
        };
    }

    const acceptedFriendUserIds = currentUserId ? await getAcceptedFriendUserIds(currentUserId) : [];
    const acceptedFriendUserIdSet = new Set(acceptedFriendUserIds);
    const currentUserAndFriendIds = currentUserId ? [currentUserId, ...acceptedFriendUserIds] : [];
    const periodStart = getLeaderboardPeriodStart(selectedPeriod, currentDate);

    const usersWithFinishedBooks = await prisma.user.findMany({
        // В рейтинге друзей оставляем друзей и самого пользователя для сравнения.
        where:
            selectedScope === "friends"
                ? {
                      id: {
                          in: currentUserAndFriendIds,
                      },
                  }
                : undefined,
        select: {
            id: true,
            name: true,
            image: true,
            library: {
                where: {
                    status: ReadingStatus.FINISHED,
                    // Ограничиваем выборку началом периода и текущим моментом.
                    // Для all начала нет, но будущие даты всё равно не учитываем.
                    finishedAt:
                        periodStart === null
                            ? {
                                  not: null,
                                  lte: currentDate, // дата не в будущем
                              }
                            : {
                                  gte: periodStart,
                                  lte: currentDate,
                              },
                },
                select: {
                    book: {
                        select: {
                            pageCount: true,
                        },
                    },
                },
            },
        },
    });

    // user'ы со всей инфой (без позиции)
    const entriesWithoutPositions = usersWithFinishedBooks.map<LeaderboardEntryWithoutPosition>((user) => {
        const finishedBooksCount = user.library.length;

        // Книга без pageCount учитывается в книгах, но добавляет ноль к страницам.
        const finishedPagesCount = user.library.reduce(
            (totalPages, libraryEntry) => totalPages + (libraryEntry.book.pageCount ?? 0),
            0,
        );

        return {
            user: {
                id: user.id,
                name: user.name,
                image: user.image,
            },
            finishedBooksCount,
            finishedPagesCount,
            score: getLeaderboardEntryScore(selectedMetric, finishedBooksCount, finishedPagesCount),
            relationshipToCurrentUser:
                user.id === currentUserId
                    ? "CURRENT_USER"
                    : acceptedFriendUserIdSet.has(user.id)
                      ? "FRIEND"
                      : "OTHER",
        };
    });

    // Места считаются до ограничения в 100 строк, поэтому позиция пользователя остаётся настоящей.
    const allPositionedEntries = addLeaderboardPositions(
        entriesWithoutPositions.sort(compareLeaderboardEntries),
    );
    const visibleEntries = allPositionedEntries.slice(0, LEADERBOARD_USERS_LIMIT);
    const currentUserEntry = allPositionedEntries.find(
        (entry) => entry.relationshipToCurrentUser === "CURRENT_USER",
    );
    const currentUserIsInsideVisibleLimit = visibleEntries.some(
        (entry) => entry.relationshipToCurrentUser === "CURRENT_USER",
    );

    return {
        entries: visibleEntries,
        totalParticipantsCount: allPositionedEntries.length,
        // Не дублируем пользователя, если его строка уже находится в основном списке.
        currentUserEntryOutsideLimit:
            currentUserEntry && !currentUserIsInsideVisibleLimit ? currentUserEntry : null,
    };
}

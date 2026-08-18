import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { FriendRequestStatus, ReadingStatus } from "@/app/generated/prisma/enums";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import prisma from "@/lib/prisma";

const RECENT_FRIEND_ACTIVITY_LIMIT = 12;

// Общие публичные данные друга, которые понадобятся каждой строке ленты.
type RecentFriendActivityUser = {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
};

// Краткие данные книги: ленте не нужны описание и остальные поля страницы книги.
type RecentFriendActivityBook = {
    googleBooksId: string;
    title: string;
    authors: string[];
    coverUrl: string | null;
    pageCount: number | null;
};

type RecentFriendActivityBase = {
    id: string;
    occurredAt: Date;
    friend: RecentFriendActivityUser;
    book: RecentFriendActivityBook;
};

// Поле type позволяет будущему компоненту понять, какие дополнительные
// данные безопасно доступны: например, rating есть только у оценки и рецензии.
export type CurrentUserRecentFriendActivityItem =
    | (RecentFriendActivityBase & {
          type: "FINISHED_BOOK";
          finishedBooksCount: number;
      })
    | (RecentFriendActivityBase & {
          type: "RATED_BOOK";
          rating: number;
          bookRatingSummary: {
              averageRating: number;
              ratingsCount: number;
          };
      })
    | (RecentFriendActivityBase & {
          type: "REVIEWED_BOOK";
          rating: number;
          reviewText: string;
      });

// Находит пользователей, с которыми у текущего пользователя принята дружба.
// Учитываем оба направления, потому что заявку мог отправить любой участник.
function createAcceptedFriendUserFilter(currentUserId: string): Prisma.UserWhereInput {
    return {
        OR: [
            {
                sentFriendRequests: {
                    some: {
                        receiverId: currentUserId,
                        status: FriendRequestStatus.ACCEPTED,
                    },
                },
            },
            {
                receivedFriendRequests: {
                    some: {
                        senderId: currentUserId,
                        status: FriendRequestStatus.ACCEPTED,
                    },
                },
            },
        ],
    };
}

// Помимо принятой дружбы проверяет, разрешил ли именно владелец библиотеки
// текущему пользователю видеть свои прочитанные книги.
function createLibraryVisibleFriendUserFilter(currentUserId: string): Prisma.UserWhereInput {
    return {
        OR: [
            {
                // Друг был отправителем заявки, поэтому читаем настройку отправителя.
                sentFriendRequests: {
                    some: {
                        receiverId: currentUserId,
                        status: FriendRequestStatus.ACCEPTED,
                        senderLibraryVisibleToReceiver: true,
                    },
                },
            },
            {
                // Друг был получателем заявки, поэтому читаем настройку получателя.
                receivedFriendRequests: {
                    some: {
                        senderId: currentUserId,
                        status: FriendRequestStatus.ACCEPTED,
                        receiverLibraryVisibleToSender: true,
                    },
                },
            },
        ],
    };
}

// Собирает свежие прочитанные книги, оценки и рецензии принятых друзей.
export async function getCurrentUserRecentFriendActivity(): Promise<CurrentUserRecentFriendActivityItem[]> {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;

    // Защищённый layout обычно не допустит этот случай, но запрос безопасен сам по себе.
    if (!currentUserId) {
        return [];
    }

    // Выборки друг от друга не зависят, поэтому выполняем их параллельно.
    // recentFinishedBookEntries — последние записи UserBook, где друг закончил книгу и открыл нам библиотеку.
    // recentReviewEntries — последние оценки и рецензии принятых друзей.
    const [recentFinishedBookEntries, recentReviewEntries] = await Promise.all([
        prisma.userBook.findMany({
            where: {
                status: ReadingStatus.FINISHED,
                finishedAt: {
                    not: null,
                },
                finishedBooksCountAtFinish: {
                    not: null,
                },
                // владелец записи является другом и разрешает нам видеть библиотеку.
                user: createLibraryVisibleFriendUserFilter(currentUserId),
            },
            orderBy: [{ finishedAt: "desc" }, { id: "asc" }],
            take: RECENT_FRIEND_ACTIVITY_LIMIT,
            select: {
                id: true,
                finishedAt: true,
                finishedBooksCountAtFinish: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true,
                    },
                },
                book: {
                    select: {
                        googleBooksId: true,
                        title: true,
                        authors: true,
                        coverUrl: true,
                        pageCount: true,
                    },
                },
            },
        }),
        prisma.review.findMany({
            where: {
                // Рецензии публичные, поэтому здесь достаточно принятой дружбы.
                user: createAcceptedFriendUserFilter(currentUserId),
            },
            orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
            take: RECENT_FRIEND_ACTIVITY_LIMIT,
            select: {
                id: true,
                bookId: true,
                rating: true,
                text: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true,
                    },
                },
                book: {
                    select: {
                        googleBooksId: true,
                        title: true,
                        authors: true,
                        coverUrl: true,
                        pageCount: true,
                    },
                },
            },
        }),
    ]);

    // Средние оценки нужны только карточкам события RATED_BOOK.
    // Все найденные книги считаются одним groupBy, а не отдельным запросом для каждой карточки.
    const recentlyRatedBookIds = [
        ...new Set(
            recentReviewEntries
                .filter((reviewEntry) => reviewEntry.text === null)
                .map((reviewEntry) => reviewEntry.bookId),
        ),
    ];

    const recentBookRatingSummaryEntries =
        recentlyRatedBookIds.length === 0
            ? []
            : await prisma.review.groupBy({
                  by: ["bookId"],
                  where: {
                      bookId: {
                          in: recentlyRatedBookIds,
                      },
                  },
                  _avg: {
                      rating: true,
                  },
                  _count: {
                      _all: true,
                  },
              });

    // Map позволяет быстро найти готовую сводку по локальному ID книги.
    const bookRatingSummaryByBookId = new Map(
        recentBookRatingSummaryEntries.map((ratingSummaryEntry) => [
            ratingSummaryEntry.bookId,
            {
                averageRating: ratingSummaryEntry._avg.rating,
                ratingsCount: ratingSummaryEntry._count._all,
            },
        ]),
    );

    const finishedBookActivities: CurrentUserRecentFriendActivityItem[] = [];

    // преобразуем в события ленты
    for (const finishedBookEntry of recentFinishedBookEntries) {
        // Prisma сохраняет nullable-типы, даже когда запрос уже исключил null.
        if (
            !finishedBookEntry.finishedAt ||
            finishedBookEntry.finishedBooksCountAtFinish === null
        ) {
            continue;
        }

        finishedBookActivities.push({
            id: `finished-book:${finishedBookEntry.id}`,
            type: "FINISHED_BOOK",
            occurredAt: finishedBookEntry.finishedAt,
            friend: finishedBookEntry.user,
            book: finishedBookEntry.book,
            // Каждая карточка получает число, сохранённое именно в момент завершения книги.
            finishedBooksCount: finishedBookEntry.finishedBooksCountAtFinish,
        });
    }

    const reviewActivities = recentReviewEntries.map<CurrentUserRecentFriendActivityItem>((reviewEntry) => {
        const sharedActivityData = {
            id: `review:${reviewEntry.id}`,
            occurredAt: reviewEntry.updatedAt,
            rating: reviewEntry.rating,
            friend: reviewEntry.user,
            book: reviewEntry.book,
        };

        // Одна Review становится либо оценкой, либо рецензией — дубля не будет.
        if (reviewEntry.text !== null) {
            return {
                ...sharedActivityData,
                type: "REVIEWED_BOOK",
                reviewText: reviewEntry.text,
            };
        }

        const bookRatingSummary = bookRatingSummaryByBookId.get(reviewEntry.bookId);

        return {
            ...sharedActivityData,
            type: "RATED_BOOK", // только оценку поставил, text === null
            bookRatingSummary: {
                // В выбранной Review уже есть оценка, поэтому используем её как безопасный fallback.
                averageRating: bookRatingSummary?.averageRating ?? reviewEntry.rating,
                ratingsCount: bookRatingSummary?.ratingsCount ?? 1,
            },
        };
    });

    // Две независимые хронологии превращаем в одну общую ленту.
    return [...finishedBookActivities, ...reviewActivities]
        .sort((firstActivity, secondActivity) => {
            // сортируем по дате
            const dateDifference = secondActivity.occurredAt.getTime() - firstActivity.occurredAt.getTime();

            // если разница равна 0, через || выполняется сравнение id, чтобы порядок оставался стабильным.
            return dateDifference || firstActivity.id.localeCompare(secondActivity.id);
        })
        .slice(0, RECENT_FRIEND_ACTIVITY_LIMIT); // обрезаем до лимита
}

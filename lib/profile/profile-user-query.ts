import "server-only";

import { ReadingStatus } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";

// Получает публичные данные пользователя и краткую статистику для страницы профиля.
export async function getUserProfileById(userId: string) {
    const normalizedUserId = userId.trim();

    // Пустой ID не может соответствовать пользователю и не требует запроса в БД.
    if (!normalizedUserId) {
        return null;
    }

    // Все данные профиля друг от друга не зависят, поэтому получаем их одновременно.
    const [profileUser, finishedPagesSummary, ratingSummary, recentFinishedBookEntries] =
        await Promise.all([
            prisma.user.findUnique({
                where: {
                    id: normalizedUserId,
                },
                // Email и данные OAuth не должны попадать на публичную страницу профиля.
                select: {
                    id: true,
                    name: true,
                    image: true,
                    _count: {
                        select: {
                            library: {
                                // записи UserBook[], берём только finished и их кол-во через _count
                                where: {
                                    status: ReadingStatus.FINISHED,
                                },
                            },
                        },
                    },
                },
            }),
            // aggregate - посчитать итоговые показатели
            prisma.book.aggregate({
                where: {
                    readers: {
                        some: {
                            userId: normalizedUserId,
                            status: ReadingStatus.FINISHED,
                        },
                    },
                },
                // PostgreSQL складывает только известные pageCount; null в сумму не входит.
                _sum: {
                    pageCount: true,
                },
            }),
            // считаем кол-во отзывов и средний рейтинг всех поставленных оценок
            prisma.review.aggregate({
                where: {
                    userId: normalizedUserId,
                },
                _count: {
                    _all: true,
                },
                _avg: {
                    rating: true,
                },
            }),
            // Получаем не всю историю, а только пять последних завершённых книг.
            prisma.userBook.findMany({
                where: {
                    userId: normalizedUserId,
                    status: ReadingStatus.FINISHED,
                    finishedAt: {
                        not: null,
                    },
                },
                orderBy: {
                    finishedAt: "desc",
                },
                take: 5,
                select: {
                    finishedAt: true,
                    book: {
                        select: {
                            googleBooksId: true,
                            title: true,
                            authors: true,
                            coverUrl: true,
                        },
                    },
                },
            }),
        ]);

    if (!profileUser) {
        return null;
    }

    return {
        id: profileUser.id,
        name: profileUser.name,
        image: profileUser.image,
        statistics: {
            finishedBooksCount: profileUser._count.library,
            // Если прочитанных книг с известным числом страниц нет, показываем ноль.
            totalFinishedPages: finishedPagesSummary._sum.pageCount ?? 0,
            ratingsCount: ratingSummary._count._all,
            averageReviewRating: ratingSummary._avg.rating,
        },
        // Убираем служебную вложенность UserBook.book, чтобы карточкам было проще читать данные.
        recentFinishedBooks: recentFinishedBookEntries.map((userLibraryEntry) => ({
            ...userLibraryEntry.book,
            finishedAt: userLibraryEntry.finishedAt,
        })),
    };
}

import "server-only";

import { ReadingStatus } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";

// Получает профиль по новому username и временно понимает старый user ID из сохранённых ссылок.
export async function getUserProfileByIdentifier(profileIdentifier: string) {
    const normalizedProfileIdentifier = profileIdentifier.trim().toLowerCase();

    if (!normalizedProfileIdentifier) {
        return null;
    }

    const profileUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username: normalizedProfileIdentifier },
                // Временный fallback позволяет старым ссылкам по CUID продолжить работать.
                { id: normalizedProfileIdentifier },
            ],
        },
        // Email и данные OAuth не должны попадать на публичную страницу профиля.
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            _count: {
                select: {
                    library: {
                        where: {
                            status: ReadingStatus.FINISHED,
                        },
                    },
                },
            },
        },
    });

    if (!profileUser) {
        return null;
    }

    // После определения локального ID независимые части статистики можно получить одновременно.
    const [finishedPagesSummary, ratingSummary, recentFinishedBookEntries] = await Promise.all([
        // aggregate - посчитать итоговые показатели
        prisma.book.aggregate({
            where: {
                readers: {
                    some: {
                        userId: profileUser.id,
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
                userId: profileUser.id,
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
                userId: profileUser.id,
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

    return {
        id: profileUser.id,
        name: profileUser.name,
        username: profileUser.username,
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

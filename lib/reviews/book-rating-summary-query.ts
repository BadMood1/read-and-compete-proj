import "server-only";

import prisma from "@/lib/prisma";

type BookRatingSummary = {
    averageRating: number | null;
    ratingsCount: number;
};

// Считает среднюю оценку книги и количество поставленных ей оценок.
export async function getBookRatingSummary(
    googleBooksId: string,
): Promise<BookRatingSummary> {
    const normalizedGoogleBooksId = googleBooksId.trim();

    // Не отправляем бессмысленный запрос в БД, если ID книги оказался пустым.
    if (!normalizedGoogleBooksId) {
        return {
            averageRating: null,
            ratingsCount: 0,
        };
    }

    // PostgreSQL сам считает AVG и COUNT, поэтому все Review не загружаются в JavaScript.
    const ratingSummary = await prisma.review.aggregate({
        where: {
            book: {
                googleBooksId: normalizedGoogleBooksId,
            },
        },
        _avg: {
            rating: true,
        },
        _count: {
            _all: true,
        },
    });

    return {
        // Если рецензий нет, Prisma возвращает null для среднего значения.
        averageRating: ratingSummary._avg.rating,
        // Считаем все рецензии, включая оценки без текста.
        ratingsCount: ratingSummary._count._all,
    };
}

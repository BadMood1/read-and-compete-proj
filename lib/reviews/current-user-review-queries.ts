import "server-only";

import prisma from "@/lib/prisma";

// Получает начальные значения для формы рецензии на странице книги.
export async function getCurrentUserReviewForGoogleBook(userId: string, googleBooksId: string) {
    const normalizedGoogleBooksId = googleBooksId.trim();

    if (!userId || !normalizedGoogleBooksId) {
        return null;
    }

    return prisma.review.findFirst({
        where: {
            userId,
            book: {
                googleBooksId: normalizedGoogleBooksId,
            },
        },
        // Форме пока нужны только оценка и текст, поэтому остальные поля не загружаем.
        select: {
            rating: true,
            text: true,
        },
    });
}

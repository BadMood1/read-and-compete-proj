import "server-only";

import prisma from "@/lib/prisma";
import type { CurrentUserReviewData } from "@/lib/reviews/current-user-review-actions";

// Получает начальные значения для формы рецензии на странице книги.
export async function getCurrentUserReviewForGoogleBook(
    userId: string,
    googleBooksId: string,
): Promise<CurrentUserReviewData | null> {
    const normalizedGoogleBooksId = googleBooksId.trim();

    if (!userId || !normalizedGoogleBooksId) {
        return null;
    }

    const review = await prisma.review.findFirst({
        where: {
            userId,
            book: {
                googleBooksId: normalizedGoogleBooksId,
            },
        },
        // Кроме содержимого рецензии подготавливаем данные для будущей кнопки комментариев.
        select: {
            id: true,
            rating: true,
            text: true,
            _count: {
                select: {
                    comments: true,
                },
            },
        },
    });

    if (!review) {
        return null;
    }

    // Скрываем внутреннюю структуру Prisma `_count` за понятным полем для интерфейса.
    return {
        id: review.id,
        rating: review.rating,
        text: review.text,
        commentsCount: review._count.comments,
    };
}

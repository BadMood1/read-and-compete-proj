import "server-only";

import prisma from "@/lib/prisma";
import type { CurrentUserReviewData } from "@/lib/reviews/current-user-review-actions";
import { getReviewReactionCounts } from "@/lib/reviews/review-reaction-counts";

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
            // Автор тоже может поставить реакцию своей рецензии.
            reactions: {
                where: {
                    userId,
                },
                select: {
                    type: true,
                },
                take: 1,
            },
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

    // Один запрос считает LIKE и DISLIKE только для найденной рецензии.
    const reactionCountGroups = await prisma.reviewReaction.groupBy({
        by: ["type"],
        where: {
            reviewId: review.id,
        },
        _count: {
            _all: true,
        },
    });
    const reactionCounts = getReviewReactionCounts(reactionCountGroups);

    // Скрываем внутреннюю структуру Prisma `_count` за понятным полем для интерфейса.
    return {
        id: review.id,
        rating: review.rating,
        text: review.text,
        commentsCount: review._count.comments,
        likesCount: reactionCounts.likesCount,
        dislikesCount: reactionCounts.dislikesCount,
        currentUserReaction: review.reactions[0]?.type ?? null,
    };
}

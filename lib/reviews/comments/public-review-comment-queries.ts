import "server-only";

import prisma from "@/lib/prisma";
import type { PublicReviewCommentsData } from "@/lib/reviews/comments/review-comment-types";

const PUBLIC_REVIEW_COMMENTS_LIMIT = 20;

// Получает последние комментарии одной текстовой рецензии для открытой панели.
export async function getPublicReviewComments(
    reviewId: string,
    currentUserId: string,
): Promise<PublicReviewCommentsData | null> {
    const normalizedReviewId = reviewId.trim();

    if (!normalizedReviewId || !currentUserId) {
        return null;
    }

    const reviewWithComments = await prisma.review.findUnique({
        where: {
            id: normalizedReviewId,
        },
        select: {
            // У оценок без текста обсуждения нет.
            text: true,
            _count: {
                select: {
                    comments: true,
                },
            },
            comments: {
                // Сначала выбираем именно последние 20 комментариев.
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: PUBLIC_REVIEW_COMMENTS_LIMIT,
                select: {
                    id: true,
                    userId: true,
                    text: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
        },
    });

    // Защитно считаем отсутствующим и текст, состоящий только из пробелов.
    if (!reviewWithComments?.text?.trim()) {
        return null;
    }

    // В панели старые комментарии идут сверху, а самые новые — снизу.
    const commentsInReadingOrder = [...reviewWithComments.comments].reverse();

    return {
        commentsCount: reviewWithComments._count.comments,
        comments: commentsInReadingOrder.map(({ user, userId, createdAt, ...comment }) => ({
            ...comment,
            author: user,
            createdAt: createdAt.toISOString(),
            isAuthoredByCurrentUser: userId === currentUserId,
        })),
    };
}

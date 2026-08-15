import "server-only";

import {
    ReviewReactionType,
    type ReviewReactionType as ReviewReactionTypeValue,
} from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";

const PUBLIC_BOOK_REVIEWS_LIMIT = 20;

export type PublicBookReviewData = {
    id: string;
    rating: number;
    text: string | null;
    createdAt: Date;
    likesCount: number;
    dislikesCount: number;
    currentUserReaction: ReviewReactionTypeValue | null;
    author: {
        id: string;
        name: string | null;
        image: string | null;
    };
};

// Получает последние рецензии и оценки других читателей для страницы книги.
export async function getPublicReviewsForGoogleBook(
    googleBooksId: string,
    currentUserId: string,
): Promise<PublicBookReviewData[]> {
    const normalizedGoogleBooksId = googleBooksId.trim();

    if (!normalizedGoogleBooksId) {
        return [];
    }

    const reviewRecords = await prisma.review.findMany({
        where: {
            book: {
                googleBooksId: normalizedGoogleBooksId,
            },
            // Своя рецензия уже показывается отдельным блоком выше на странице.
            userId: {
                not: currentUserId,
            },
        },
        select: {
            id: true,
            rating: true,
            text: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            // Для каждой рецензии нужна только реакция вошедшего пользователя.
            // Составной unique-ключ гарантирует максимум один элемент в массиве.
            reactions: {
                where: {
                    userId: currentUserId,
                },
                select: {
                    type: true,
                },
                take: 1,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: PUBLIC_BOOK_REVIEWS_LIMIT,
    });

    if (reviewRecords.length === 0) {
        return [];
    }

    const reviewIds = reviewRecords.map((review) => review.id);

    // Один общий запрос считает обе реакции для всех загруженных рецензий.
    // Это не создаёт отдельный запрос для каждой карточки.
    const reactionCountGroups = await prisma.reviewReaction.groupBy({
        by: ["reviewId", "type"], // Группируем по ID рецензии и типу реакции
        where: {
            reviewId: {
                in: reviewIds, // только интересующие нас рецензии
            },
        },
        _count: {
            _all: true, // считаем кол-во лайков/дизлайков для конкретной рецензии
        },
    });

    type ReviewReactionCounts = {
        likesCount: number;
        dislikesCount: number;
    };

    // Map связывает локальный ID рецензии с уже подсчитанными реакциями.
    const reactionCountsByReviewId = new Map<string, ReviewReactionCounts>();

    for (const reactionGroup of reactionCountGroups) {
        // задаём начальное значение, если для рецензии ещё не было реакций
        const reactionCounts = reactionCountsByReviewId.get(reactionGroup.reviewId) ?? {
            likesCount: 0,
            dislikesCount: 0,
        };

        if (reactionGroup.type === ReviewReactionType.LIKE) {
            reactionCounts.likesCount = reactionGroup._count._all;
        } else {
            reactionCounts.dislikesCount = reactionGroup._count._all;
        }

        reactionCountsByReviewId.set(reactionGroup.reviewId, reactionCounts);
    }

    // Переименовываем Prisma-связь user в понятный UI объект author.
    const reviewsWithAuthorsAndReactions = reviewRecords.map(
        ({ user, reactions, ...review }): PublicBookReviewData => {
            const reactionCounts = reactionCountsByReviewId.get(review.id);

            return {
                ...review,
                author: user,
                likesCount: reactionCounts?.likesCount ?? 0,
                dislikesCount: reactionCounts?.dislikesCount ?? 0,
                currentUserReaction: reactions[0]?.type ?? null,
            };
        },
    );

    // Сначала показываем рецензии с текстом, а оставленные без текста оценки — после них.
    const reviewsWithText = reviewsWithAuthorsAndReactions.filter((review) => review.text !== null);
    const ratingOnlyReviews = reviewsWithAuthorsAndReactions.filter((review) => review.text === null);

    return [...reviewsWithText, ...ratingOnlyReviews];
}

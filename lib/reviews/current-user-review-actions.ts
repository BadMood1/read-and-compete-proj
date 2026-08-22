"use server";

import type { ReviewReactionType as ReviewReactionTypeValue } from "@/app/generated/prisma/enums";
import { auth } from "@/auth";
import { revalidateBookDetailsAndUserProfilePages } from "@/lib/books/book-related-page-revalidation";
import { runSerializableTransactionWithRetry } from "@/lib/database/run-serializable-transaction-with-retry";
import prisma from "@/lib/prisma";
import { getReviewReactionCounts } from "@/lib/reviews/review-reaction-counts";
import { normalizeServerActionStringInput } from "@/lib/validation/normalize-server-action-string-input";

const MIN_REVIEW_RATING = 1;
const MAX_REVIEW_RATING = 10;
const MAX_REVIEW_TEXT_LENGTH = 5000;

export type CurrentUserReviewData = {
    id: string;
    rating: number;
    text: string | null;
    commentsCount: number;
    likesCount: number;
    dislikesCount: number;
    currentUserReaction: ReviewReactionTypeValue | null;
};

// Один тип ответа подходит и сохранению, и удалению рецензии.
type CurrentUserReviewMutationResult =
    | {
          success: true;
          review: CurrentUserReviewData | null;
      }
    | {
          success: false;
          error: string;
      };

function isValidReviewRating(rating: number) {
    return Number.isInteger(rating) && rating >= MIN_REVIEW_RATING && rating <= MAX_REVIEW_RATING;
}

// Создаёт новую рецензию или обновляет уже существующую.
export async function saveCurrentUserReview(
    googleBooksId: string,
    rating: number,
    reviewText: string,
): Promise<CurrentUserReviewMutationResult> {
    // Server Action можно вызвать отдельным POST-запросом, поэтому пользователя проверяем на сервере.
    const session = await auth();
    const normalizedGoogleBooksId = normalizeServerActionStringInput(googleBooksId);
    const normalizedReviewText = normalizeServerActionStringInput(reviewText);

    if (!session?.user?.id) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedGoogleBooksId) {
        return { success: false, error: "Не удалось определить книгу." };
    }

    if (normalizedReviewText === null) {
        return { success: false, error: "Некорректный текст рецензии." };
    }

    if (!isValidReviewRating(rating)) {
        return { success: false, error: "Оценка должна быть целым числом от 1 до 10." };
    }

    if (normalizedReviewText.length > MAX_REVIEW_TEXT_LENGTH) {
        return {
            success: false,
            error: `Текст рецензии не должен превышать ${MAX_REVIEW_TEXT_LENGTH} символов.`,
        };
    }

    const mutationResult = await runSerializableTransactionWithRetry(async (transaction) => {
        // Проверки и сохранение находятся в одной транзакции: параллельный комментарий
        // или реакция не смогут появиться одновременно с удалением текста рецензии.
        const book = await transaction.book.findUnique({
            where: {
                googleBooksId: normalizedGoogleBooksId,
            },
            select: {
                id: true, // берём Book.id
                _count: {
                    select: {
                        readers: {
                            // Сколько UserBook текущего пользователя связано с этой книгой.
                            where: {
                                userId: session.user.id,
                            },
                        },
                    },
                },
                // Unique-ключ гарантирует максимум одну такую рецензию.
                // Вместе с ней узнаём, появились ли комментарии или реакции.
                reviews: {
                    where: {
                        userId: session.user.id,
                    },
                    take: 1,
                    select: {
                        _count: {
                            select: {
                                comments: true,
                                reactions: true,
                            },
                        },
                    },
                },
            },
        });

        if (!book) {
            // Книга из Google Books ещё не сохранена локально, то есть пользователь её не добавлял.
            return { success: false, error: "Сначала добавьте книгу в библиотеку." } as const;
        }

        // есть ли у пользователя наша книга в библиотеке
        const isBookInCurrentUserLibrary = book._count.readers > 0;
        const currentUserReview = book.reviews[0];
        const doesCurrentUserAlreadyHaveReview = currentUserReview !== undefined;

        // Новую рецензию разрешаем только для своей библиотеки.
        // Существующую можно редактировать даже после удаления UserBook.
        if (!isBookInCurrentUserLibrary && !doesCurrentUserAlreadyHaveReview) {
            return {
                success: false,
                error: "Сначала добавьте книгу в библиотеку.",
            } as const;
        }

        const reviewHasInteractions =
            currentUserReview !== undefined &&
            (currentUserReview._count.comments > 0 || currentUserReview._count.reactions > 0);

        // Не оставляем скрытые комментарии, лайки и дизлайки под оценкой без текста.
        // Удаление рецензии целиком по-прежнему удалит их каскадно.
        if (!normalizedReviewText && reviewHasInteractions) {
            return {
                success: false,
                error: "Под рецензией уже есть реакции или комментарии. Оставьте текст или удалите рецензию целиком.",
            } as const;
        }

        // Составной unique-ключ гарантирует одну рецензию пользователя на книгу.
        const savedReview = await transaction.review.upsert({
            where: {
                userId_bookId: {
                    userId: session.user.id,
                    bookId: book.id,
                },
            },
            update: {
                rating,
                text: normalizedReviewText || null,
            },
            create: {
                userId: session.user.id,
                bookId: book.id,
                rating,
                text: normalizedReviewText || null,
            },
            select: {
                id: true,
                rating: true,
                text: true,
                // Собственная реакция нужна, чтобы после сохранения не сбросить выбранную кнопку.
                reactions: {
                    where: {
                        userId: session.user.id,
                    },
                    select: {
                        type: true,
                    },
                    take: 1,
                },
                // После сохранения кнопка комментариев сразу получает актуальный счётчик.
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });

        // Считаем реакции после upsert, чтобы ответ содержал актуальное состояние рецензии.
        const reactionCountGroups = await transaction.reviewReaction.groupBy({
            by: ["type"],
            where: {
                reviewId: savedReview.id,
            },
            _count: {
                _all: true,
            },
        });
        const reactionCounts = getReviewReactionCounts(reactionCountGroups);

        return {
            success: true,
            review: {
                id: savedReview.id,
                rating: savedReview.rating,
                text: savedReview.text,
                commentsCount: savedReview._count.comments,
                likesCount: reactionCounts.likesCount,
                dislikesCount: reactionCounts.dislikesCount,
                currentUserReaction: savedReview.reactions[0]?.type ?? null,
            },
        } as const;
    });

    if (!mutationResult.success) {
        return mutationResult;
    }

    revalidateBookDetailsAndUserProfilePages(normalizedGoogleBooksId, session.user.id);

    return mutationResult;
}

// Удаляет только рецензию текущего пользователя.
export async function deleteCurrentUserReview(
    googleBooksId: string,
): Promise<CurrentUserReviewMutationResult> {
    const session = await auth();
    const normalizedGoogleBooksId = normalizeServerActionStringInput(googleBooksId);

    if (!session?.user?.id) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedGoogleBooksId) {
        return { success: false, error: "Не удалось определить книгу." };
    }

    // deleteMany не выбрасывает ошибку, если рецензию уже удалили.
    // userId из серверной сессии не даёт удалить чужую запись.
    await prisma.review.deleteMany({
        where: {
            userId: session.user.id,
            book: {
                googleBooksId: normalizedGoogleBooksId,
            },
        },
    });

    revalidateBookDetailsAndUserProfilePages(normalizedGoogleBooksId, session.user.id);

    return { success: true, review: null };
}

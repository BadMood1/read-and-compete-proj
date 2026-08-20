"use server";

import {
    ReviewReactionType,
    type ReviewReactionType as ReviewReactionTypeValue,
} from "@/app/generated/prisma/enums";
import { auth } from "@/auth";
import { createBookDetailsBasePath } from "@/lib/books/book-details-navigation";
import { runSerializableTransactionWithRetry } from "@/lib/database/run-serializable-transaction-with-retry";
import { normalizeServerActionStringInput } from "@/lib/validation/normalize-server-action-string-input";
import { revalidatePath } from "next/cache";

export type CurrentUserReviewReactionMutationResult =
    | {
          success: true;
          currentUserReaction: ReviewReactionTypeValue | null;
          likesCount: number;
          dislikesCount: number;
      }
    | {
          success: false;
          error: string;
      };

const ALLOWED_REVIEW_REACTION_TYPES = Object.values(ReviewReactionType);

// TypeScript проверяет наш интерфейс, а эта функция защищает Server Action
// от произвольного значения, отправленного отдельным POST-запросом.
function isReviewReactionType(value: unknown): value is ReviewReactionTypeValue {
    return ALLOWED_REVIEW_REACTION_TYPES.some((reactionType) => reactionType === value);
}

// Устанавливает желаемую реакцию, переключает её вид или полностью удаляет.
export async function setCurrentUserReviewReaction(
    reviewId: string,
    desiredReaction: ReviewReactionTypeValue | null,
): Promise<CurrentUserReviewReactionMutationResult> {
    const session = await auth();
    const normalizedReviewId = normalizeServerActionStringInput(reviewId);

    if (!session?.user?.id) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedReviewId) {
        return { success: false, error: "Не удалось определить рецензию." };
    }

    if (desiredReaction !== null && !isReviewReactionType(desiredReaction)) {
        return { success: false, error: "Неизвестный вид реакции." };
    }

    const currentUserId = session.user.id;

    // Все запросы выполняются как одна операция, а serializable-режим не позволяет
    // одновременно удалить текст рецензии и сохранить под ней реакцию.
    const mutationResult = await runSerializableTransactionWithRetry(async (transaction) => {
        // Проверяем рецензию на сервере: клиенту нельзя доверять автора и наличие текста.
        const review = await transaction.review.findUnique({
            where: {
                id: normalizedReviewId,
            },
            select: {
                userId: true,
                text: true,
                book: {
                    select: {
                        googleBooksId: true,
                    },
                },
            },
        });

        if (!review) {
            return { success: false, error: "Рецензия не найдена." } as const;
        }

        if (review.userId === currentUserId) {
            return { success: false, error: "Нельзя оценивать собственную рецензию." } as const;
        }

        if (!review.text?.trim()) {
            return {
                success: false,
                error: "Реакции доступны только для рецензий с текстом.",
            } as const;
        }

        if (desiredReaction === null) {
            // Повторное удаление безопасно: deleteMany не падает, если реакции уже нет.
            await transaction.reviewReaction.deleteMany({
                where: {
                    userId: currentUserId,
                    reviewId: normalizedReviewId,
                },
            });
        } else {
            // Unique-ключ userId_reviewId оставляет одну запись:
            // upsert создаёт первую реакцию или переключает существующую.
            await transaction.reviewReaction.upsert({
                where: {
                    userId_reviewId: {
                        userId: currentUserId,
                        reviewId: normalizedReviewId,
                    },
                },
                update: {
                    type: desiredReaction,
                },
                create: {
                    userId: currentUserId,
                    reviewId: normalizedReviewId,
                    type: desiredReaction,
                },
            });
        }

        // Считаем обе группы после изменения, чтобы UI получил подтверждённые числа из БД.
        const reactionCountGroups = await transaction.reviewReaction.groupBy({
            by: ["type"],
            where: {
                reviewId: normalizedReviewId,
            },
            _count: {
                _all: true,
            },
        });

        let likesCount = 0;
        let dislikesCount = 0;

        for (const reactionGroup of reactionCountGroups) {
            if (reactionGroup.type === ReviewReactionType.LIKE) {
                likesCount = reactionGroup._count._all;
            } else {
                dislikesCount = reactionGroup._count._all;
            }
        }

        return {
            success: true,
            googleBooksId: review.book.googleBooksId,
            currentUserReaction: desiredReaction,
            likesCount,
            dislikesCount,
        } as const;
    });

    if (!mutationResult.success) {
        return mutationResult;
    }

    // Страница книги должна заново получить актуальные реакции после следующего рендера.
    revalidatePath(createBookDetailsBasePath(mutationResult.googleBooksId));

    return {
        success: true,
        currentUserReaction: mutationResult.currentUserReaction,
        likesCount: mutationResult.likesCount,
        dislikesCount: mutationResult.dislikesCount,
    };
}

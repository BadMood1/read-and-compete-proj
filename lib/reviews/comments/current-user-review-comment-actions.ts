"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { createBookDetailsBasePath } from "@/lib/books/book-details-navigation";
import { runSerializableTransactionWithRetry } from "@/lib/database/run-serializable-transaction-with-retry";
import { createReviewCommentNotificationForReviewAuthor } from "@/lib/notifications/notification-creation";
import prisma from "@/lib/prisma";
import {
    REVIEW_COMMENT_MAX_LENGTH,
    type PublicReviewCommentData,
} from "@/lib/reviews/comments/review-comment-types";
import { normalizeServerActionStringInput } from "@/lib/validation/normalize-server-action-string-input";

type CreateCurrentUserReviewCommentResult =
    | {
          success: true;
          comment: PublicReviewCommentData;
          commentsCount: number;
      }
    | {
          success: false;
          error: string;
      };

type DeleteCurrentUserReviewCommentResult =
    | {
          success: true;
          deletedCommentId: string;
          commentsCount: number;
      }
    | {
          success: false;
          error: string;
      };

// Добавляет комментарий текущего пользователя под текстовой рецензией.
export async function createCurrentUserReviewComment(
    reviewId: string,
    commentText: string,
): Promise<CreateCurrentUserReviewCommentResult> {
    const session = await auth();
    const normalizedReviewId = normalizeServerActionStringInput(reviewId);
    const normalizedCommentText = normalizeServerActionStringInput(commentText);

    if (!session?.user?.id) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedReviewId) {
        return { success: false, error: "Не удалось определить рецензию." };
    }

    if (!normalizedCommentText) {
        return { success: false, error: "Напишите текст комментария." };
    }

    if (normalizedCommentText.length > REVIEW_COMMENT_MAX_LENGTH) {
        return {
            success: false,
            error: `Комментарий не должен превышать ${REVIEW_COMMENT_MAX_LENGTH} символов.`,
        };
    }

    const currentUserId = session.user.id;

    // Создание и последующий подсчёт выполняются вместе: при ошибке комментарий не сохранится наполовину.
    // Serializable-режим также не позволяет одновременно удалить текст рецензии и добавить комментарий.
    const mutationResult = await runSerializableTransactionWithRetry(async (transaction) => {
        // Сервер повторно проверяет, что рецензия существует и действительно содержит текст.
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

        if (!review.text?.trim()) {
            return {
                success: false,
                error: "Комментарии доступны только для рецензий с текстом.",
            } as const;
        }

        const createdComment = await transaction.reviewComment.create({
            data: {
                userId: currentUserId,
                reviewId: normalizedReviewId,
                text: normalizedCommentText,
            },
            select: {
                id: true,
                text: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        // Комментарий и уведомление сохраняются атомарно внутри одной транзакции.
        await createReviewCommentNotificationForReviewAuthor({
            transaction,
            reviewAuthorUserId: review.userId,
            commentAuthorUserId: currentUserId,
            reviewCommentId: createdComment.id,
        });

        const commentsCount = await transaction.reviewComment.count({
            where: {
                reviewId: normalizedReviewId,
            },
        });

        const comment: PublicReviewCommentData = {
            id: createdComment.id,
            text: createdComment.text,
            createdAt: createdComment.createdAt.toISOString(),
            isAuthoredByCurrentUser: true,
            author: createdComment.user,
        };

        return {
            success: true,
            googleBooksId: review.book.googleBooksId,
            comment,
            commentsCount,
        } as const;
    });

    if (!mutationResult.success) {
        return mutationResult;
    }

    revalidatePath(createBookDetailsBasePath(mutationResult.googleBooksId));

    return {
        success: true,
        comment: mutationResult.comment,
        commentsCount: mutationResult.commentsCount,
    };
}

// Удаляет только собственный комментарий текущего пользователя.
export async function deleteCurrentUserReviewComment(
    commentId: string,
): Promise<DeleteCurrentUserReviewCommentResult> {
    const session = await auth();
    const normalizedCommentId = normalizeServerActionStringInput(commentId);

    if (!session?.user?.id) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedCommentId) {
        return { success: false, error: "Не удалось определить комментарий." };
    }

    const currentUserId = session.user.id;

    const mutationResult = await prisma.$transaction(async (transaction) => {
        // Автор и книга берутся из БД: клиент не может подменить владельца комментария.
        const comment = await transaction.reviewComment.findUnique({
            where: {
                id: normalizedCommentId,
            },
            select: {
                userId: true,
                reviewId: true,
                review: {
                    select: {
                        book: {
                            select: {
                                googleBooksId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!comment) {
            return { success: false, error: "Комментарий не найден." } as const;
        }

        if (comment.userId !== currentUserId) {
            return { success: false, error: "Можно удалить только свой комментарий." } as const;
        }

        await transaction.reviewComment.delete({
            where: {
                id: normalizedCommentId,
            },
        });

        const commentsCount = await transaction.reviewComment.count({
            where: {
                reviewId: comment.reviewId,
            },
        });

        return {
            success: true,
            googleBooksId: comment.review.book.googleBooksId,
            deletedCommentId: normalizedCommentId,
            commentsCount,
        } as const;
    });

    if (!mutationResult.success) {
        return mutationResult;
    }

    revalidatePath(createBookDetailsBasePath(mutationResult.googleBooksId));

    return {
        success: true,
        deletedCommentId: mutationResult.deletedCommentId,
        commentsCount: mutationResult.commentsCount,
    };
}

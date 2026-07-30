import "server-only";

import prisma from "@/lib/prisma";

const PUBLIC_BOOK_REVIEWS_LIMIT = 20;

export type PublicBookReviewData = {
    id: string;
    rating: number;
    text: string | null;
    createdAt: Date;
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
        },
        orderBy: {
            createdAt: "desc",
        },
        take: PUBLIC_BOOK_REVIEWS_LIMIT,
    });

    // В Prisma связь называется user, а компоненту понятнее получать автора рецензии.
    const reviewsWithAuthors = reviewRecords.map(({ user, ...review }) => ({
        ...review,
        author: user,
    }));

    // Сначала показываем рецензии с текстом, а оставленные без текста оценки — после них.
    const reviewsWithText = reviewsWithAuthors.filter((review) => review.text !== null);
    const ratingOnlyReviews = reviewsWithAuthors.filter((review) => review.text === null);

    return [...reviewsWithText, ...ratingOnlyReviews];
}

import { getCurrentSession } from "@/lib/auth/get-current-session";
import { getPublicReviewComments } from "@/lib/reviews/comments/public-review-comment-queries";

type ReviewCommentsRouteContext = {
    params: Promise<{
        reviewId: string;
    }>;
};

const PRIVATE_NO_STORE_HEADERS = {
    "Cache-Control": "private, no-store",
};

// Отдаёт комментарии только после открытия панели, а не вместе со всей страницей книги.
export async function GET(_request: Request, { params }: ReviewCommentsRouteContext) {
    try {
        const session = await getCurrentSession();

        if (!session?.user?.id) {
            return Response.json(
                { error: "Сначала войдите в аккаунт." },
                { status: 401, headers: PRIVATE_NO_STORE_HEADERS },
            );
        }

        const { reviewId } = await params;
        const normalizedReviewId = reviewId.trim();

        if (!normalizedReviewId) {
            return Response.json(
                { error: "Не удалось определить рецензию." },
                { status: 400, headers: PRIVATE_NO_STORE_HEADERS },
            );
        }

        const reviewComments = await getPublicReviewComments(
            normalizedReviewId,
            session.user.id,
        );

        if (!reviewComments) {
            return Response.json(
                { error: "Рецензия с комментариями не найдена." },
                { status: 404, headers: PRIVATE_NO_STORE_HEADERS },
            );
        }

        return Response.json(reviewComments, {
            headers: PRIVATE_NO_STORE_HEADERS,
        });
    } catch (error) {
        console.error("Review comments request failed:", error);

        return Response.json(
            { error: "Не удалось загрузить комментарии." },
            { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
        );
    }
}

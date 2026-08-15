// Один лимит используется и нативным textarea, и обязательной серверной проверкой.
export const REVIEW_COMMENT_MAX_LENGTH = 1000;

// JSON-формат одного комментария, который Route Handler отдаёт клиентскому компоненту.
export type PublicReviewCommentData = {
    id: string;
    text: string;
    createdAt: string;
    isAuthoredByCurrentUser: boolean;
    author: {
        id: string;
        name: string | null;
        image: string | null;
    };
};

// Вместе со списком возвращаем полный счётчик: позднее он покажет, есть ли ещё комментарии.
export type PublicReviewCommentsData = {
    comments: PublicReviewCommentData[];
    commentsCount: number;
};

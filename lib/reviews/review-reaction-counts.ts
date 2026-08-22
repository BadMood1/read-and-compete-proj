import {
    ReviewReactionType,
    type ReviewReactionType as ReviewReactionTypeValue,
} from "@/app/generated/prisma/enums";

type ReviewReactionCountGroup = {
    type: ReviewReactionTypeValue;
    _count: {
        _all: number;
    };
};

export type ReviewReactionCounts = {
    likesCount: number;
    dislikesCount: number;
};

// Prisma groupBy возвращает отдельную группу для LIKE и DISLIKE.
// Превращаем эти группы в два обычных счётчика, удобных для интерфейса.
export function getReviewReactionCounts(
    reactionCountGroups: ReviewReactionCountGroup[],
): ReviewReactionCounts {
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
        likesCount,
        dislikesCount,
    };
}

import "server-only";

import { ReadingStatus } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";

const PROFILE_RECENT_FINISHED_BOOKS_LIMIT = 5;

// Запрашивается только после серверной проверки доступа к истории чтения.
export async function getProfileRecentFinishedBooks(profileUserId: string) {
    const normalizedProfileUserId = profileUserId.trim();

    if (!normalizedProfileUserId) {
        return [];
    }

    const recentFinishedBookEntries = await prisma.userBook.findMany({
        where: {
            userId: normalizedProfileUserId,
            status: ReadingStatus.FINISHED,
            finishedAt: {
                not: null,
            },
        },
        orderBy: {
            finishedAt: "desc",
        },
        take: PROFILE_RECENT_FINISHED_BOOKS_LIMIT,
        select: {
            finishedAt: true,
            book: {
                select: {
                    googleBooksId: true,
                    title: true,
                    authors: true,
                    coverUrl: true,
                },
            },
        },
    });

    // Убираем служебную вложенность UserBook.book перед передачей данных компоненту.
    return recentFinishedBookEntries.map((userLibraryEntry) => ({
        ...userLibraryEntry.book,
        finishedAt: userLibraryEntry.finishedAt,
    }));
}

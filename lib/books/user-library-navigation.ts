import type { ReadingStatus } from "@/app/generated/prisma/enums";

// Собирает путь библиотеки, сохраняя непустой поиск и выбранный статус.
export function createLibrarySearchAndStatusPath(
    searchQuery: string,
    readingStatus: ReadingStatus | null,
): string {
    const searchParams = new URLSearchParams();

    if (searchQuery) {
        searchParams.set("q", searchQuery);
    }

    if (readingStatus) {
        searchParams.set("status", readingStatus);
    }

    const queryString = searchParams.toString();

    return queryString ? `/library?${queryString}` : "/library";
}

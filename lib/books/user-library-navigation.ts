import type { ReadingStatus } from "@/app/generated/prisma/enums";

type CreateLibrarySearchAndStatusPathOptions = {
    libraryPagePath: string;
    searchQuery: string;
    readingStatus: ReadingStatus | null;
};

// Собирает путь библиотеки, сохраняя непустой поиск и выбранный статус.
export function createLibrarySearchAndStatusPath({
    libraryPagePath,
    searchQuery,
    readingStatus,
}: CreateLibrarySearchAndStatusPathOptions): string {
    const searchParams = new URLSearchParams();

    if (searchQuery) {
        searchParams.set("q", searchQuery);
    }

    if (readingStatus) {
        searchParams.set("status", readingStatus);
    }

    const queryString = searchParams.toString();

    return queryString ? `${libraryPagePath}?${queryString}` : libraryPagePath;
}

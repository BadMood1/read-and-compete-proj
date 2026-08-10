import type { ReadingStatus } from "@/app/generated/prisma/enums";
import { READING_STATUS_ORDER } from "@/lib/books/reading-status-labels";

type LibraryPageSearchParameter = string | string[] | undefined;

export type LibraryPageSearchParameters = {
    q?: LibraryPageSearchParameter;
    status?: LibraryPageSearchParameter;
};

export type LibraryPageFilters = {
    searchQuery: string;
    selectedReadingStatus: ReadingStatus | null;
};

type FilterableLibraryBookEntry = {
    status: ReadingStatus;
    book: {
        title: string;
        authors: string[];
    };
};

// Next.js может передать массив для повторяющегося параметра вроде ?q=one&q=two.
function getFirstLibrarySearchParameterValue(searchParameter: LibraryPageSearchParameter) {
    return Array.isArray(searchParameter) ? searchParameter[0] : searchParameter;
}

// Преобразует сырые searchParams страницы в проверенные значения для UI и фильтрации.
export function getLibraryPageFilters(
    searchParameters: LibraryPageSearchParameters,
): LibraryPageFilters {
    const searchQuery = getFirstLibrarySearchParameterValue(searchParameters.q)?.trim() || "";
    const rawReadingStatus = getFirstLibrarySearchParameterValue(searchParameters.status);
    const selectedReadingStatus =
        READING_STATUS_ORDER.find((readingStatus) => readingStatus === rawReadingStatus) ?? null;

    return {
        searchQuery,
        selectedReadingStatus,
    };
}

// LibraryBookEntry — временное имя точного типа элементов переданного массива.
// extends требует, чтобы у каждого элемента точно были status, book.title и book.authors.
// При этом дополнительные поля вроде id, coverUrl и pageCount не теряются из возвращаемого типа.
// readonly запрещает функции изменять исходный массив; filter создаёт и возвращает новый массив.
export function filterLibraryBooksBySearchAndReadingStatus<
    LibraryBookEntry extends FilterableLibraryBookEntry,
>(libraryBooks: readonly LibraryBookEntry[], filters: LibraryPageFilters): LibraryBookEntry[] {
    const normalizedSearchQuery = filters.searchQuery.toLowerCase();

    return libraryBooks.filter((userLibraryEntry) => {
        const matchesSelectedReadingStatus =
            filters.selectedReadingStatus === null ||
            userLibraryEntry.status === filters.selectedReadingStatus;

        const normalizedBookTitle = userLibraryEntry.book.title.toLowerCase();
        const doesBookMatchSearchQuery =
            normalizedSearchQuery === "" ||
            normalizedBookTitle.includes(normalizedSearchQuery) ||
            // some() вернёт true, если запрос содержится хотя бы в одном имени автора.
            userLibraryEntry.book.authors.some((author) =>
                author.toLowerCase().includes(normalizedSearchQuery),
            );

        return matchesSelectedReadingStatus && doesBookMatchSearchQuery;
    });
}

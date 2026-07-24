import "server-only";

type GoogleBooksResponse = {
    totalItems: number;
    items?: GoogleBookVolume[];
};

type GoogleBookVolume = {
    id: string;
    volumeInfo: {
        title: string;
        subtitle?: string;
        authors?: string[];
        description?: string;
        pageCount?: number;
        publisher?: string;
        publishedDate?: string;
        categories?: string[];
        language?: string;

        imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
        };

        industryIdentifiers?: {
            type: string;
            identifier: string;
        }[];
    };
};

export type BookSearchResult = {
    googleBooksId: string;
    title: string;
    subtitle: string | null;
    authors: string[];
    description: string | null;
    coverUrl: string | null;
    pageCount: number | null;
    isbn10: string | null;
    isbn13: string | null;
    publisher: string | null;
    publishedDate: string | null;
    categories: string[];
    language: string | null;
};

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 400;

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Преобразуем ответ google к нужному нам
function mapGoogleBook(volume: GoogleBookVolume): BookSearchResult {
    const info = volume.volumeInfo;

    // международные идентификаторы изданий
    const isbn10 = info.industryIdentifiers?.find((item) => item.type === "ISBN_10")?.identifier ?? null;

    const isbn13 = info.industryIdentifiers?.find((item) => item.type === "ISBN_13")?.identifier ?? null;

    return {
        googleBooksId: volume.id,
        title: info.title,
        subtitle: info.subtitle ?? null,
        authors: info.authors ?? [],
        description: info.description ?? null,
        coverUrl: info.imageLinks?.thumbnail?.replace(/^http:/, "https:") ?? null,
        pageCount: info.pageCount ?? null,
        isbn10,
        isbn13,
        publisher: info.publisher ?? null,
        publishedDate: info.publishedDate ?? null,
        categories: info.categories ?? [],
        language: info.language ?? null,
    };
}

export async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
        return [];
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
        throw new Error("GOOGLE_BOOKS_API_KEY is not configured");
    }

    const url = new URL("https://www.googleapis.com/books/v1/volumes");

    url.searchParams.set("q", normalizedQuery);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("printType", "books");
    url.searchParams.set("orderBy", "relevance");

    // Делаем основной запрос и только один повтор при временной ошибке.
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        let response: Response;

        try {
            response = await fetch(url, {
                cache: "no-store",
            });
        } catch (error) {
            // Сетевую ошибку повторяем один раз, затем передаём выше.
            if (attempt === MAX_ATTEMPTS) {
                throw error;
            }

            await wait(RETRY_DELAY_MS);
            continue;
        }

        if (response.ok) {
            const data = (await response.json()) as GoogleBooksResponse;

            return (data.items ?? []).map(mapGoogleBook); // все из items прогоняем через наш map
        }

        // 429 и 5xx обычно временные; остальные статусы повторять бесполезно.
        const canRetry = response.status === 429 || response.status >= 500;

        if (!canRetry || attempt === MAX_ATTEMPTS) {
            throw new Error(`Google Books request failed: ${response.status}`);
        }

        await wait(RETRY_DELAY_MS);
    }

    // Цикл всегда возвращает данные или выбрасывает ошибку.
    throw new Error("Google Books request failed");
}

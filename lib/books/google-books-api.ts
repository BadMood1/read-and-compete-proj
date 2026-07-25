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

export type GoogleBookSearchResult = {
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

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const SEARCH_CACHE_SECONDS = 900;

// Настройки определяют, нужно ли кэшировать конкретный запрос к Google Books.
type GoogleBooksRequestOptions = {
    cache?: RequestCache;
    next?: {
        revalidate?: number;
    };
};

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGoogleBooksApiKey() {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    if (!apiKey) {
        throw new Error("GOOGLE_BOOKS_API_KEY is not configured");
    }

    return apiKey;
}

// Выполняет запрос к Google Books и повторяет его при временных ошибках.
async function fetchGoogleBooks(
    url: URL,
    options: GoogleBooksRequestOptions = {
        cache: "no-store",
    },
) {
    // Три попытки используются и поиском, и запросом отдельной книги.
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        let response: Response;

        try {
            response = await fetch(url, options);
        } catch (error) {
            // Последнюю сетевую ошибку передаём вызывающему коду.
            if (attempt === MAX_ATTEMPTS) {
                throw error;
            }

            await wait(RETRY_DELAY_MS);
            continue;
        }

        if (response.ok) {
            return response;
        }

        // 429 и 5xx могут быть временными; остальные статусы повторять не нужно.
        const canRetry = response.status === 429 || response.status >= 500;

        if (!canRetry || attempt === MAX_ATTEMPTS) {
            return response;
        }

        await wait(RETRY_DELAY_MS);
    }

    // Цикл всегда возвращает Response или выбрасывает сетевую ошибку.
    throw new Error("Google Books request failed");
}

function htmlToPlainText(html: string) {
    return html
        .replace(/<\/p>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

// Преобразуем ответ google к нужному нам
function mapGoogleBook(volume: GoogleBookVolume): GoogleBookSearchResult {
    const info = volume.volumeInfo;

    // международные идентификаторы изданий
    const isbn10 = info.industryIdentifiers?.find((item) => item.type === "ISBN_10")?.identifier ?? null;

    const isbn13 = info.industryIdentifiers?.find((item) => item.type === "ISBN_13")?.identifier ?? null;

    return {
        googleBooksId: volume.id,
        title: info.title,
        subtitle: info.subtitle ?? null,
        authors: info.authors ?? [],
        description: info.description ? htmlToPlainText(info.description) : null,
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

export async function searchGoogleBooks(query: string): Promise<GoogleBookSearchResult[]> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
        return [];
    }

    const url = new URL("https://www.googleapis.com/books/v1/volumes");

    url.searchParams.set("q", normalizedQuery);
    url.searchParams.set("key", getGoogleBooksApiKey());
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("printType", "books");
    url.searchParams.set("orderBy", "relevance");

    // Одинаковый поиск в течение 15 минут берётся из кэша Next.js,
    // поэтому возврат со страницы книги не расходует запрос Google Books повторно.
    const response = await fetchGoogleBooks(url, {
        next: {
            revalidate: SEARCH_CACHE_SECONDS,
        },
    });

    if (!response.ok) {
        throw new Error(`Google Books request failed: ${response.status}`);
    }

    const data = (await response.json()) as GoogleBooksResponse;

    return (data.items ?? []).map(mapGoogleBook);
}

export async function getGoogleBookById(
    googleBooksId: string,
): Promise<GoogleBookSearchResult | null> {
    const normalizedId = googleBooksId.trim();

    if (!normalizedId) {
        return null;
    }

    // ID является частью пути, поэтому кодируем его отдельно от API-ключа.
    const url = new URL(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(normalizedId)}`);

    url.searchParams.set("key", getGoogleBooksApiKey());

    const response = await fetchGoogleBooks(url);

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Google Books volume request failed: ${response.status}`);
    }

    const volume = (await response.json()) as GoogleBookVolume;

    return mapGoogleBook(volume);
}

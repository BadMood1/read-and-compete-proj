import "server-only";

import { getGoogleBookById, type GoogleBookSearchResult } from "@/lib/books/google-books-api";
import prisma from "@/lib/prisma";

// Сначала использует сохранённую книгу и обращается к Google только для ещё неизвестного ID.
export async function getBookDetailsByGoogleBooksId(
    googleBooksId: string,
): Promise<GoogleBookSearchResult | null> {
    const normalizedGoogleBooksId = googleBooksId.trim();

    if (!normalizedGoogleBooksId) {
        return null;
    }

    const localBook = await prisma.book.findUnique({
        where: {
            googleBooksId: normalizedGoogleBooksId,
        },
        // Поля совпадают с данными Google, поэтому BookPage не зависит от источника книги.
        select: {
            googleBooksId: true,
            title: true,
            subtitle: true,
            authors: true,
            description: true,
            coverUrl: true,
            pageCount: true,
            isbn10: true,
            isbn13: true,
            publisher: true,
            publishedDate: true,
            categories: true,
            language: true,
        },
    });

    if (localBook) {
        console.log(`Found local book for Google Books ID: ${normalizedGoogleBooksId}`);
        return localBook;
    }

    // Прямую ссылку на ещё не сохранённую книгу всё равно можно открыть через Google Books.
    return getGoogleBookById(normalizedGoogleBooksId);
}

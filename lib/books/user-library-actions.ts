"use server";

import { ReadingStatus, type ReadingStatus as ReadingStatusValue } from "@/app/generated/prisma/enums";
import { auth } from "@/auth";
import { getGoogleBookById } from "@/lib/books/google-books-api";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Возможные ответы интерфейсу после добавления или удаления книги.
export type BookLibraryMutationResult =
    | {
          success: true;
          isBookInUserLibrary: boolean;
      }
    | {
          success: false;
          error: string;
      };

// Ответ после изменения статуса нужен dropdown, чтобы подтвердить сохранённое значение.
export type UpdateCurrentUserBookReadingStatusResult =
    | {
          success: true;
          readingStatus: ReadingStatusValue;
      }
    | {
          success: false;
          error: string;
      };

const ALLOWED_READING_STATUSES = Object.values(ReadingStatus);

// TypeScript проверяет наш код, а эта функция защищает Server Action от произвольного POST-запроса.
function isReadingStatus(value: string): value is ReadingStatusValue {
    return ALLOWED_READING_STATUSES.some((readingStatus) => readingStatus === value);
}

// После изменения БД просим Next.js заново получить данные книги и библиотеки.
function revalidateBookDetailsAndLibraryPages(googleBooksId: string) {
    revalidatePath(`/books/${encodeURIComponent(googleBooksId)}`);
    revalidatePath("/library");
}

// Добавляет книгу в библиотеку текущего пользователя.
export async function addBookToCurrentUserLibrary(googleBooksId: string): Promise<BookLibraryMutationResult> {
    // Server Action доступен как отдельный POST-запрос, поэтому авторизацию проверяем и здесь.
    const session = await auth();

    // Убираем случайные пробелы и дальше используем только нормализованный ID.
    const normalizedBookId = googleBooksId.trim();

    if (!session?.user?.id) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedBookId) {
        return { success: false, error: "Не удалось определить книгу." };
    }

    // Сначала ищем книгу локально, чтобы не обращаться к Google при каждом добавлении.
    const existingBook = await prisma.book.findUnique({
        where: { googleBooksId: normalizedBookId },
    });

    let book = existingBook;

    if (!book) {
        // В нашей БД книги ещё нет, поэтому получаем проверенные данные у Google.
        const googleBook = await getGoogleBookById(normalizedBookId);

        if (!googleBook) {
            return { success: false, error: "Книга не найдена." };
        }

        // Upsert защищает от ситуации, когда два пользователя одновременно
        // пытаются впервые сохранить одну и ту же Google-книгу.
        book = await prisma.book.upsert({
            where: {
                googleBooksId: googleBook.googleBooksId,
            },
            // Если другой запрос уже создал книгу, сохраняем существующие данные.
            update: {},
            create: {
                googleBooksId: googleBook.googleBooksId,
                title: googleBook.title,
                subtitle: googleBook.subtitle,
                authors: googleBook.authors,
                description: googleBook.description,
                coverUrl: googleBook.coverUrl,
                pageCount: googleBook.pageCount,
                isbn10: googleBook.isbn10,
                isbn13: googleBook.isbn13,
                publisher: googleBook.publisher,
                publishedDate: googleBook.publishedDate,
                categories: googleBook.categories,
                language: googleBook.language,
            },
        });
    }

    // Создаём связь пользователя с книгой. Повторный вызов ничего не дублирует
    // благодаря составному уникальному ключу userId_bookId.
    await prisma.userBook.upsert({
        where: {
            userId_bookId: {
                userId: session.user.id,
                bookId: book.id,
            },
        },
        update: {},
        create: {
            userId: session.user.id,
            bookId: book.id,
        },
    });

    // Обновляем страницу книги и библиотеку после записи в БД.
    revalidateBookDetailsAndLibraryPages(normalizedBookId);

    // Клиенту нужен только новый статус, а не вся внутренняя запись Prisma.
    return { success: true, isBookInUserLibrary: true };
}

// Удаляет книгу только из библиотеки текущего пользователя.
export async function removeBookFromCurrentUserLibrary(
    googleBooksId: string,
): Promise<BookLibraryMutationResult> {
    // Удаление — отдельный публичный Server Action, поэтому снова проверяем сессию и входные данные.
    const session = await auth();
    const normalizedBookId = googleBooksId.trim();

    if (!session?.user?.id) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedBookId) {
        return { success: false, error: "Не удалось определить книгу." };
    }

    const book = await prisma.book.findUnique({
        where: {
            googleBooksId: normalizedBookId,
        },
        select: {
            id: true,
        },
    });

    if (book) {
        // удаляем одну запись, но deleteMany, т.к. если записи нет, то не будет ошибки
        // Общая запись Book остаётся, потому что она может использоваться другими читателями.
        await prisma.userBook.deleteMany({
            where: {
                userId: session.user.id,
                bookId: book.id,
            },
        });
    }

    revalidateBookDetailsAndLibraryPages(normalizedBookId);

    return { success: true, isBookInUserLibrary: false };
}

// Меняет статус книги только в библиотеке текущего пользователя.
export async function updateCurrentUserBookReadingStatus(
    googleBooksId: string,
    nextReadingStatus: string,
): Promise<UpdateCurrentUserBookReadingStatusResult> {
    // ID пользователя всегда берём из серверной сессии, а не доверяем клиенту.
    const session = await auth();
    const normalizedBookId = googleBooksId.trim();

    if (!session?.user?.id) {
        return { success: false, error: "Сначала войдите в аккаунт." };
    }

    if (!normalizedBookId) {
        return { success: false, error: "Не удалось определить книгу." };
    }

    if (!isReadingStatus(nextReadingStatus)) {
        return { success: false, error: "Неизвестный статус чтения." };
    }

    // Relation-фильтр находит UserBook по Google ID и одновременно ограничивает изменение владельцем.
    const updateResult = await prisma.userBook.updateMany({
        where: {
            userId: session.user.id,
            book: {
                googleBooksId: normalizedBookId,
            },
        },
        data: {
            status: nextReadingStatus,
        },
    });

    if (updateResult.count === 0) {
        return { success: false, error: "Книга не найдена в вашей библиотеке." };
    }

    revalidateBookDetailsAndLibraryPages(normalizedBookId);

    return { success: true, readingStatus: nextReadingStatus };
}

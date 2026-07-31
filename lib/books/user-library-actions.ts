"use server";

import { ReadingStatus, type ReadingStatus as ReadingStatusValue } from "@/app/generated/prisma/enums";
import { auth } from "@/auth";
import { getGoogleBookById } from "@/lib/books/google-books-api";
import prisma from "@/lib/prisma";
import { revalidateUserProfilePage } from "@/lib/profile/profile-page-revalidation";
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

// После изменения БД просим Next.js заново получить связанные страницы.
function revalidateBookDetailsLibraryAndProfilePages(googleBooksId: string, userId: string) {
    revalidatePath(`/books/${encodeURIComponent(googleBooksId)}`);
    revalidatePath("/library");
    revalidateUserProfilePage(userId);
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
    revalidateBookDetailsLibraryAndProfilePages(normalizedBookId, session.user.id);

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

    revalidateBookDetailsLibraryAndProfilePages(normalizedBookId, session.user.id);

    return { success: true, isBookInUserLibrary: false };
}

// Меняет статус книги только в библиотеке текущего пользователя.
export async function updateCurrentUserBookReadingStatus(
    googleBooksId: string,
    nextReadingStatus: string,
): Promise<UpdateCurrentUserBookReadingStatusResult> {
    // --- ПРОВЕРКИ ---

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

    // !-- ПРОВЕРКИ ---

    //
    const currentUserBook = await prisma.userBook.findFirst({
        where: {
            userId: session.user.id,
            book: {
                googleBooksId: normalizedBookId,
            },
        },
        select: {
            id: true,
            status: true,
            finishedAt: true,
        },
    });

    if (!currentUserBook) {
        return { success: false, error: "Книга не найдена в вашей библиотеке." };
    }

    let nextFinishedAt: Date | null;

    if (nextReadingStatus !== ReadingStatus.FINISHED) {
        // Книга больше не считается прочитанной — очищаем дату.
        nextFinishedAt = null;
    } else if (currentUserBook.status === ReadingStatus.FINISHED) {
        // защита от повторного изменения с finished на finished
        nextFinishedAt = currentUserBook.finishedAt ?? new Date();
    } else {
        // Пользователь только сейчас отметил книгу прочитанной.
        nextFinishedAt = new Date();
    }

    // Добавляем в БД
    await prisma.userBook.update({
        where: {
            id: currentUserBook.id,
        },
        data: {
            status: nextReadingStatus,
            finishedAt: nextFinishedAt,
        },
    });

    revalidateBookDetailsLibraryAndProfilePages(normalizedBookId, session.user.id);

    return { success: true, readingStatus: nextReadingStatus };
}

"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { ReadingStatus, type ReadingStatus as ReadingStatusValue } from "@/app/generated/prisma/enums";
import { auth } from "@/auth";
import { revalidateBookDetailsAndUserProfilePages } from "@/lib/books/book-related-page-revalidation";
import { getGoogleBookById } from "@/lib/books/google-books-api";
import { createUserLibraryCacheTag } from "@/lib/books/user-library-cache";
import prisma from "@/lib/prisma";
import { revalidatePath, updateTag } from "next/cache";

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
type UpdateCurrentUserBookReadingStatusResult =
    | {
          success: true;
          readingStatus: ReadingStatusValue;
      }
    | {
          success: false;
          error: string;
      };

const ALLOWED_READING_STATUSES = Object.values(ReadingStatus);
const SERIALIZABLE_TRANSACTION_ATTEMPTS = 3;

// TypeScript проверяет наш код, а эта функция защищает Server Action от произвольного POST-запроса.
function isReadingStatus(value: string): value is ReadingStatusValue {
    return ALLOWED_READING_STATUSES.some((readingStatus) => readingStatus === value);
}

// Функция выполняет изменение статуса книги как одну безопасную транзакцию. Если две книги одновременно
//  получают статус FINISHED и возникает конфликт счётчиков, она повторяет операцию до трёх раз,
// чтобы сохранить правильные значения 6, затем 7, а не два раза 6.
// (например, если оч. быстро отметим разные книги "Прочитано")
async function runSerializableLibraryTransactionWithRetry<Result>(
    operation: (transaction: Prisma.TransactionClient) => Promise<Result>,
): Promise<Result> {
    for (let attempt = 1; attempt <= SERIALIZABLE_TRANSACTION_ATTEMPTS; attempt++) {
        try {
            return await prisma.$transaction(operation, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
        } catch (error) {
            const shouldRetryTransaction =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2034" &&
                attempt < SERIALIZABLE_TRANSACTION_ATTEMPTS;

            if (!shouldRetryTransaction) {
                throw error;
            }
        }
    }

    // Цикл либо возвращает результат, либо выбрасывает последнюю ошибку.
    throw new Error("Не удалось завершить транзакцию изменения библиотеки.");
}

// Изменение личной библиотеки влияет на неё саму, страницу книги и статистику профиля.
function revalidatePagesAfterCurrentUserLibraryChange(googleBooksId: string, userId: string) {
    // Немедленно истекает общий кэш данных: свежий список увидят и владелец, и его друзья.
    updateTag(createUserLibraryCacheTag(userId));

    revalidateBookDetailsAndUserProfilePages(googleBooksId, userId);
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
        // Дальше нужен только локальный ID для создания связи UserBook.
        select: {
            id: true,
        },
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
            select: {
                id: true,
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
    revalidatePagesAfterCurrentUserLibraryChange(normalizedBookId, session.user.id);

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

    // deleteMany не падает, если связи уже нет, а фильтр по Book убирает отдельный запрос его ID.
    // Общая запись Book остаётся, потому что она может использоваться другими читателями.
    await prisma.userBook.deleteMany({
        where: {
            userId: session.user.id,
            book: {
                googleBooksId: normalizedBookId,
            },
        },
    });

    revalidatePagesAfterCurrentUserLibraryChange(normalizedBookId, session.user.id);

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
    const currentUserId = session.user.id;

    const currentUserBookExists = await runSerializableLibraryTransactionWithRetry(async (transaction) => {
        // Читаем состояние внутри транзакции, чтобы снимок считался из тех же данных.
        const currentUserBook = await transaction.userBook.findFirst({
            where: {
                userId: currentUserId,
                book: {
                    googleBooksId: normalizedBookId,
                },
            },
            select: {
                id: true,
                status: true,
                finishedAt: true,
                finishedBooksCountAtFinish: true,
            },
        });

        if (!currentUserBook) {
            return false;
        }

        if (nextReadingStatus !== ReadingStatus.FINISHED) {
            // После снятия FINISHED запись больше не представляет завершение книги.
            await transaction.userBook.update({
                where: {
                    id: currentUserBook.id,
                },
                data: {
                    status: nextReadingStatus,
                    finishedAt: null,
                    finishedBooksCountAtFinish: null,
                },
            });

            return true;
        }

        const completeFinishedBookSnapshotAlreadyExists =
            currentUserBook.status === ReadingStatus.FINISHED &&
            currentUserBook.finishedAt !== null &&
            currentUserBook.finishedBooksCountAtFinish !== null;

        if (completeFinishedBookSnapshotAlreadyExists) {
            // Повторный выбор FINISHED не меняет дату и исторический снимок.
            return true;
        }

        const currentFinishedBooksCount = await transaction.userBook.count({
            where: {
                userId: currentUserId,
                status: ReadingStatus.FINISHED,
            },
        });
        const currentBookIsAlreadyIncludedInCount = currentUserBook.status === ReadingStatus.FINISHED;
        const finishedBooksCountAtFinish =
            currentFinishedBooksCount + (currentBookIsAlreadyIncludedInCount ? 0 : 1);
        const finishedAt = currentBookIsAlreadyIncludedInCount
            ? (currentUserBook.finishedAt ?? new Date())
            : new Date();

        // Снимок записывается одновременно со статусом и больше сам не пересчитывается.
        await transaction.userBook.update({
            where: {
                id: currentUserBook.id,
            },
            data: {
                status: ReadingStatus.FINISHED,
                finishedAt,
                finishedBooksCountAtFinish,
            },
        });

        return true;
    });

    if (!currentUserBookExists) {
        return { success: false, error: "Книга не найдена в вашей библиотеке." };
    }

    revalidatePagesAfterCurrentUserLibraryChange(normalizedBookId, currentUserId);

    return { success: true, readingStatus: nextReadingStatus };
}

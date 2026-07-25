"use server";

import { auth } from "@/auth";
import { getGoogleBookById } from "@/lib/google-books";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addBookToLibrary(googleBooksId: string) {
    // Server Action доступен как отдельный POST-запрос, поэтому авторизацию проверяем и здесь.
    const session = await auth();

    // Убираем случайные пробелы и дальше используем только нормализованный ID.
    const normalizedBookId = googleBooksId.trim();

    if (!session?.user?.id) {
        return { success: false, error: "Сначала войдите в аккаунт." } as const;
    }

    if (!normalizedBookId) {
        return { success: false, error: "Не удалось определить книгу." } as const;
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
            throw new Error("Book not found");
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

    // Обновляем страницу книги и будущую страницу библиотеки после записи в БД.
    revalidatePath(`/books/${encodeURIComponent(normalizedBookId)}`);
    revalidatePath("/library");

    // Клиенту нужен только итог операции, а не вся внутренняя запись Prisma.
    // `as const` сохраняет success как точное значение true, а не общий boolean.
    return { success: true } as const;
}

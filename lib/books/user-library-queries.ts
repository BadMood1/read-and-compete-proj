import "server-only";

import prisma from "@/lib/prisma";

// Проверяем существует ли связь UserBook,
// чтобы после перезагрузки показать правильное состояние кнопки.
export async function isGoogleBookInUserLibrary(userId: string, googleBooksId: string) {
    const userLibraryEntry = await prisma.userBook.findFirst({
        where: {
            userId,
            book: {
                googleBooksId,
            },
        },
        // Для проверки существования достаточно получить только ID связи.
        select: {
            id: true,
        },
    });

    return Boolean(userLibraryEntry);
}

// Получаем только библиотеку нужного пользователя и нужные карточкам поля книги.
export async function getLibraryBooksForUser(userId: string) {
    return prisma.userBook.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            status: true,
            book: {
                select: {
                    googleBooksId: true,
                    title: true,
                    authors: true,
                    coverUrl: true,
                    pageCount: true,
                    publishedDate: true,
                },
            },
        },
    });
}

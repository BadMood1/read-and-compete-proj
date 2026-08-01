import "server-only";

import { revalidatePath } from "next/cache";

import { createBookDetailsBasePath } from "@/lib/books/book-details-navigation";
import { revalidateUserProfilePage } from "@/lib/profile/profile-page-revalidation";

// Добавление в библиотеку, статус, оценка или рецензия меняют книгу и статистику профиля.
export function revalidateBookDetailsAndUserProfilePages(
    googleBooksId: string,
    userId: string,
) {
    revalidatePath(createBookDetailsBasePath(googleBooksId));
    revalidateUserProfilePage(userId);
}

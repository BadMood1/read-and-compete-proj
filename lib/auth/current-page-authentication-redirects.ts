import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
    createLoginPagePathWithReturnPath,
    createWelcomePagePathWithReturnPath,
    CURRENT_PROTECTED_PAGE_PATH_HEADER,
    getValidatedAuthenticationReturnPath,
} from "@/lib/auth/authentication-return-path";

// Proxy передаёт сюда исходный адрес защищённой страницы вместе с её фильтрами.
async function getCurrentProtectedPagePath() {
    const requestHeaders = await headers();

    return getValidatedAuthenticationReturnPath(
        requestHeaders.get(CURRENT_PROTECTED_PAGE_PATH_HEADER) ?? undefined,
    );
}

// Используется всеми дополнительными auth-проверками, чтобы ни одна из них не потеряла deep link.
export async function redirectToLoginFromCurrentPage(): Promise<never> {
    const currentPagePath = await getCurrentProtectedPagePath();

    redirect(createLoginPagePathWithReturnPath(currentPagePath));
}

// Пользователь без username сначала завершает профиль, а затем возвращается на исходную страницу.
export async function redirectToWelcomeFromCurrentPage(): Promise<never> {
    const currentPagePath = await getCurrentProtectedPagePath();

    redirect(createWelcomePagePathWithReturnPath(currentPagePath));
}

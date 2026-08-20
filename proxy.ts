import { type NextRequest, NextResponse } from "next/server";

import { CURRENT_PROTECTED_PAGE_PATH_HEADER } from "@/lib/auth/authentication-return-path";

// Layout не получает текущий pathname напрямую, поэтому Proxy передаёт его приватным request-header.
// Проверка сессии остаётся в layout и рядом с запросами данных: этот слой ничего не авторизует.
export function proxy(request: NextRequest) {
    const currentPageUrl = request.nextUrl.clone();

    // Служебный параметр RSC-навигации не должен попасть в адрес возврата пользователя.
    currentPageUrl.searchParams.delete("_rsc");

    const currentPagePath = `${currentPageUrl.pathname}${currentPageUrl.search}`;
    const forwardedRequestHeaders = new Headers(request.headers);
    forwardedRequestHeaders.set(CURRENT_PROTECTED_PAGE_PATH_HEADER, currentPagePath);

    return NextResponse.next({
        request: {
            headers: forwardedRequestHeaders,
        },
    });
}

// Proxy запускается только для страниц защищённой route group, а не для API и статики.
export const config = {
    matcher: [
        "/",
        "/books/:path*",
        "/friends/:path*",
        "/leaderboard/:path*",
        "/library/:path*",
        "/profile/:path*",
    ],
};

type CreateBookDetailsPathOptions = {
    googleBooksId: string;
    returnPath: string;
};

// Собирает путь на страницу книги и добавляет адрес, куда потом вернуться.
export function createBookDetailsPath({
    googleBooksId,
    returnPath,
}: CreateBookDetailsPathOptions) {
    const encodedGoogleBooksId = encodeURIComponent(googleBooksId);
    const searchParams = new URLSearchParams({
        returnPath,
    });

    return `/books/${encodedGoogleBooksId}?${searchParams.toString()}`;
}

// Сохраняет поисковый запрос в пути главной страницы.
export function createSearchResultsReturnPath(query: string) {
    const searchParams = new URLSearchParams({
        q: query,
    });

    return `/?${searchParams.toString()}`;
}

// Принимаем только безопасный путь внутри приложения, иначе возвращаем на главную.
export function getValidatedBookDetailsReturnPath(
    rawReturnPath: string | string[] | undefined,
) {
    const returnPath = Array.isArray(rawReturnPath) ? rawReturnPath[0] : rawReturnPath;

    if (!returnPath || !returnPath.startsWith("/") || returnPath.startsWith("//")) {
        return "/";
    }

    // Разрешаем возврат только в известные разделы внутри приложения.
    const parsedUrl = new URL(returnPath, "http://internal");
    const isProfilePath =
        parsedUrl.pathname === "/profile" || parsedUrl.pathname.startsWith("/profile/");
    const isAllowedPath =
        parsedUrl.pathname === "/" || parsedUrl.pathname === "/library" || isProfilePath;

    return isAllowedPath ? `${parsedUrl.pathname}${parsedUrl.search}` : "/";
}

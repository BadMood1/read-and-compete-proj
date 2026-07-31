// Собирает единый адрес профиля, чтобы разные части приложения кодировали ID одинаково.
export function createProfilePath(userId: string) {
    return `/profile/${encodeURIComponent(userId.trim())}`;
}

type CreateProfilePathWithReturnPathOptions = {
    userId: string;
    returnPath: string;
};

// Добавляет профилю адрес страницы, на которую должна вести кнопка «Назад».
export function createProfilePathWithReturnPath({
    userId,
    returnPath,
}: CreateProfilePathWithReturnPathOptions) {
    const searchParams = new URLSearchParams({ returnPath });

    return `${createProfilePath(userId)}?${searchParams.toString()}`;
}

// Профиль принимает возврат только на страницу книги внутри нашего приложения.
export function getValidatedProfileReturnPath(
    rawReturnPath: string | string[] | undefined,
) {
    const returnPath = Array.isArray(rawReturnPath) ? rawReturnPath[0] : rawReturnPath;

    if (!returnPath || !returnPath.startsWith("/") || returnPath.startsWith("//")) {
        return null;
    }

    const parsedUrl = new URL(returnPath, "http://internal");
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const isBookPage =
        parsedUrl.origin === "http://internal" &&
        pathSegments.length === 2 &&
        pathSegments[0] === "books" &&
        pathSegments[1].length > 0;

    return isBookPage ? `${parsedUrl.pathname}${parsedUrl.search}` : null;
}

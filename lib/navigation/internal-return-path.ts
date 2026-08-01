const INTERNAL_URL_ORIGIN = "http://internal";

export type ReturnPathSearchParameter = string | string[] | undefined;

type SafeInternalPathDetails = {
    pathname: string;
    pathWithSearchParameters: string;
};

// Добавляет returnPath к внутреннему адресу и одинаково кодирует его во всём приложении.
export function createInternalPathWithReturnPath(destinationPath: string, returnPath: string) {
    // адрес куда пользователь переходит сейчас
    const destinationUrl = getSafeInternalUrl(destinationPath);

    if (!destinationUrl) {
        throw new Error("Destination path must be internal.");
    }

    // добавляем returnPath, внутри URL он уйдёт в поле search сам
    destinationUrl.searchParams.set("returnPath", returnPath);

    return getPathWithSearchParameters(destinationUrl);
}

// Отдаёт наружу только данные, которые нужны разделам для проверки своего returnPath.
export function getSafeInternalPathDetails(
    rawInternalPath: ReturnPathSearchParameter,
): SafeInternalPathDetails | null {
    const internalUrl = getSafeInternalUrl(rawInternalPath);

    if (!internalUrl) {
        return null;
    }

    return {
        pathname: internalUrl.pathname,
        pathWithSearchParameters: getPathWithSearchParameters(internalUrl),
    };
}

// Разбирает только адрес внутри приложения. Внешние и некорректные значения отбрасываются.
function getSafeInternalUrl(rawInternalPath: ReturnPathSearchParameter) {
    const internalPath = Array.isArray(rawInternalPath) ? rawInternalPath[0] : rawInternalPath;

    if (!internalPath || !internalPath.startsWith("/") || internalPath.startsWith("//")) {
        return null;
    }

    const parsedUrl = new URL(internalPath, INTERNAL_URL_ORIGIN);

    // Возвращаем вот такой url. origin нужен, т.к. JS не умеет разбирать путь без домена
    // URL {
    // origin: "http://internal",
    // pathname: "/books/abc123",
    // search: "" }
    return parsedUrl.origin === INTERNAL_URL_ORIGIN ? parsedUrl : null;
}

// Возвращает проверенный путь с query-параметрами, но без служебного внутреннего origin.
function getPathWithSearchParameters(internalUrl: URL) {
    return `${internalUrl.pathname}${internalUrl.search}`;
}

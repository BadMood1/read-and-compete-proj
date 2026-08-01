import {
    createInternalPathWithReturnPath,
    getSafeInternalPathDetails,
    type ReturnPathSearchParameter,
} from "@/lib/navigation/internal-return-path";

type CreateBookDetailsPathOptions = {
    googleBooksId: string;
    returnPath: string;
};

// Собирает базовый путь книги без query-параметров, например для ревалидации страницы.
export function createBookDetailsBasePath(googleBooksId: string) {
    return `/books/${encodeURIComponent(googleBooksId)}`;
}

// Собирает ссылку на страницу книги и добавляет адрес, куда потом вернуться.
export function createBookDetailsPath({
    googleBooksId,
    returnPath,
}: CreateBookDetailsPathOptions) {
    return createInternalPathWithReturnPath(
        createBookDetailsBasePath(googleBooksId),
        returnPath,
    );
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
    rawReturnPath: ReturnPathSearchParameter,
) {
    const safeReturnPath = getSafeInternalPathDetails(rawReturnPath);

    if (!safeReturnPath) {
        return "/";
    }

    // Общий helper проверяет безопасность, а здесь разрешаем только известные разделы.
    const isProfilePath =
        safeReturnPath.pathname === "/profile" ||
        safeReturnPath.pathname.startsWith("/profile/");
    const isAllowedPath =
        safeReturnPath.pathname === "/" ||
        safeReturnPath.pathname === "/library" ||
        isProfilePath;

    return isAllowedPath ? safeReturnPath.pathWithSearchParameters : "/";
}

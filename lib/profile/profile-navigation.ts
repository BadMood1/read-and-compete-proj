import {
    createInternalPathWithReturnPath,
    getSafeInternalPathDetails,
    type ReturnPathSearchParameter,
} from "@/lib/navigation/internal-return-path";

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
    return createInternalPathWithReturnPath(createProfilePath(userId), returnPath);
}

// Профиль принимает возврат только на страницу книги внутри нашего приложения.
export function getValidatedProfileReturnPath(
    rawReturnPath: ReturnPathSearchParameter,
) {
    const safeReturnPath = getSafeInternalPathDetails(rawReturnPath);

    if (!safeReturnPath) {
        return null;
    }

    // Общий helper проверяет безопасность, а здесь остаётся правило конкретного раздела.
    const pathSegments = safeReturnPath.pathname.split("/").filter(Boolean);
    const isBookPage =
        pathSegments.length === 2 &&
        pathSegments[0] === "books" &&
        pathSegments[1].length > 0;

    return isBookPage ? safeReturnPath.pathWithSearchParameters : null;
}

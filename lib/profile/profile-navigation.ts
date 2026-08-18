import {
    createInternalPathWithReturnPath,
    getSafeInternalPathDetails,
    type ReturnPathSearchParameter,
} from "@/lib/navigation/internal-return-path";

// Пока мигрируются старые ссылки, идентификатором может быть username или прежний user ID.
export function createProfilePath(profileIdentifier: string) {
    return `/profile/${encodeURIComponent(profileIdentifier.trim())}`;
}

// Собирает канонический путь библиотеки конкретного владельца профиля.
export function createProfileLibraryPath(profileIdentifier: string) {
    return `${createProfilePath(profileIdentifier)}/library`;
}

type CreateProfilePathWithReturnPathOptions = {
    profileIdentifier: string;
    returnPath: string;
};

// Добавляет профилю адрес страницы, на которую должна вести кнопка «Назад».
export function createProfilePathWithReturnPath({
    profileIdentifier,
    returnPath,
}: CreateProfilePathWithReturnPathOptions) {
    return createInternalPathWithReturnPath(createProfilePath(profileIdentifier), returnPath);
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

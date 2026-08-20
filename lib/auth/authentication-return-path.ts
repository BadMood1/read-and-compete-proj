import {
    createInternalPathWithReturnPath,
    getSafeInternalPathDetails,
    type ReturnPathSearchParameter,
} from "@/lib/navigation/internal-return-path";

export const CURRENT_PROTECTED_PAGE_PATH_HEADER = "x-read-and-compete-current-page";

const DEFAULT_AUTHENTICATION_RETURN_PATH = "/";
const MAX_AUTHENTICATION_RETURN_PATH_LENGTH = 2048;

// Auth-flow принимает только реальные защищённые страницы приложения.
// /login, /welcome, API и служебные пути сюда намеренно не входят, чтобы не создать цикл.
function isAllowedAuthenticationReturnPath(pathname: string) {
    return (
        pathname === "/" ||
        pathname === "/friends" ||
        pathname === "/leaderboard" ||
        pathname === "/library" ||
        pathname === "/profile" ||
        pathname.startsWith("/books/") ||
        pathname.startsWith("/profile/")
    );
}

// Проверяет путь, который после входа снова откроется пользователю.
// Любое внешнее, повторное или неизвестное значение безопасно заменяется главной страницей.
export function getValidatedAuthenticationReturnPath(
    rawReturnPath: ReturnPathSearchParameter,
) {
    if (
        Array.isArray(rawReturnPath) ||
        !rawReturnPath ||
        rawReturnPath.length > MAX_AUTHENTICATION_RETURN_PATH_LENGTH
    ) {
        return DEFAULT_AUTHENTICATION_RETURN_PATH;
    }

    const safeReturnPath = getSafeInternalPathDetails(rawReturnPath);

    if (!safeReturnPath || !isAllowedAuthenticationReturnPath(safeReturnPath.pathname)) {
        return DEFAULT_AUTHENTICATION_RETURN_PATH;
    }

    return safeReturnPath.pathWithSearchParameters;
}

// Формирует login URL и сохраняет внутри него страницу, которую пользователь хотел открыть.
export function createLoginPagePathWithReturnPath(returnPath: string) {
    return createInternalPathWithReturnPath(
        "/login",
        getValidatedAuthenticationReturnPath(returnPath),
    );
}

// После OAuth welcome проверит username и продолжит исходный переход.
export function createWelcomePagePathWithReturnPath(returnPath: string) {
    return createInternalPathWithReturnPath(
        "/welcome",
        getValidatedAuthenticationReturnPath(returnPath),
    );
}

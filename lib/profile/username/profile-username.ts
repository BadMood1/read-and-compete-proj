export const PROFILE_USERNAME_MIN_LENGTH = 3;
export const PROFILE_USERNAME_MAX_LENGTH = 24;

// Эти имена оставляем приложению, чтобы будущие служебные страницы не конфликтовали с профилями.
const RESERVED_PROFILE_USERNAMES = new Set([
    "admin",
    "api",
    "auth",
    "books",
    "friends",
    "home",
    "leaderboard",
    "library",
    "login",
    "me",
    "profile",
    "settings",
    "support",
    "welcome",
]);

// Небольшой встроенный словарь позволяет предложить читаемый username из кириллического имени.
// Для этой ограниченной задачи отдельная библиотека транслитерации не нужна.
const CYRILLIC_TO_LATIN: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
    і: "i",
    ї: "yi",
    є: "ye",
    ґ: "g",
};

// Убирает декоративный @ и приводит username к единому регистру перед проверкой и сохранением.
export function normalizeProfileUsername(username: string) {
    return username.trim().replace(/^@+/u, "").toLowerCase();
}

// Возвращает понятную ошибку для формы или null, если username соответствует всем правилам.
export function getProfileUsernameValidationError(username: string) {
    const normalizedUsername = normalizeProfileUsername(username);

    if (normalizedUsername.length < PROFILE_USERNAME_MIN_LENGTH) {
        return `Username должен содержать минимум ${PROFILE_USERNAME_MIN_LENGTH} символа.`;
    }

    if (normalizedUsername.length > PROFILE_USERNAME_MAX_LENGTH) {
        return `Username должен содержать не больше ${PROFILE_USERNAME_MAX_LENGTH} символов.`;
    }

    if (!/^[a-z]/u.test(normalizedUsername)) {
        return "Username должен начинаться с латинской буквы.";
    }

    if (!/^[a-z][a-z0-9_]*$/u.test(normalizedUsername)) {
        return "Используйте только латинские буквы, цифры и знак подчёркивания.";
    }

    if (RESERVED_PROFILE_USERNAMES.has(normalizedUsername)) {
        return "Этот username зарезервирован приложением.";
    }

    return null;
}

// Преобразует символы по одному, сохраняя латиницу и цифры для следующего этапа очистки.
function transliterateDisplayName(displayName: string) {
    return Array.from(displayName.toLowerCase(), (character) => {
        return CYRILLIC_TO_LATIN[character] ?? character;
    }).join("");
}

// Обрезает основу до лимита и не оставляет подчёркивание последним символом.
function fitProfileUsernameToMaximumLength(username: string) {
    return username.slice(0, PROFILE_USERNAME_MAX_LENGTH).replace(/_+$/u, "");
}

// Добавляет числовой суффикс и при необходимости укорачивает основу.
export function createProfileUsernameCandidate(profileUsernameBase: string, numericSuffix: number | null) {
    const normalizedProfileUsernameBase = normalizeProfileUsername(profileUsernameBase);

    // null обозначает первый и самый красивый вариант без цифр.
    if (numericSuffix === null) {
        return fitProfileUsernameToMaximumLength(normalizedProfileUsernameBase);
    }

    const sequenceSuffix = String(numericSuffix);
    const availableBaseLength = PROFILE_USERNAME_MAX_LENGTH - sequenceSuffix.length;
    const shortenedBase = normalizedProfileUsernameBase.slice(0, availableBaseLength).replace(/_+$/u, "");

    return `${shortenedBase}${sequenceSuffix}`;
}

// Создаёт только основу предложения. Свободный числовой суффикс позже выберет отдельный запрос к БД.
export function generateProfileUsernameBaseFromDisplayName(displayName: string) {
    const transliteratedDisplayName = transliterateDisplayName(displayName)
        .normalize("NFKD")
        .replace(/\p{Mark}+/gu, "");

    let generatedUsername = transliteratedDisplayName
        .replace(/[^a-z0-9]+/gu, "_")
        .replace(/_+/gu, "_")
        .replace(/^_+|_+$/gu, "");

    // Пустые и начинающиеся с цифры варианты превращаем в читаемый username с буквенным началом.
    if (!generatedUsername) {
        generatedUsername = "reader";
    } else if (!/^[a-z]/u.test(generatedUsername)) {
        generatedUsername = `reader_${generatedUsername}`;
    }

    if (RESERVED_PROFILE_USERNAMES.has(generatedUsername)) {
        generatedUsername = `reader_${generatedUsername}`;
    }

    if (generatedUsername.length < PROFILE_USERNAME_MIN_LENGTH) {
        generatedUsername = `${generatedUsername}_reader`;
    }

    return fitProfileUsernameToMaximumLength(generatedUsername);
}

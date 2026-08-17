export const PROFILE_DISPLAY_NAME_MIN_LENGTH = 2;
export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 50;

// Убирает случайные пробелы по краям и заменяет несколько пробелов одним.
// Остальные символы не ограничиваем: имя может содержать кириллицу, дефисы и апострофы.
export function normalizeProfileDisplayName(displayName: string) {
    return displayName.trim().replace(/\s+/gu, " ");
}

// Возвращает понятный текст ошибки или null, если нормализованное имя допустимо.
export function getProfileDisplayNameValidationError(normalizedDisplayName: string) {
    if (normalizedDisplayName.length < PROFILE_DISPLAY_NAME_MIN_LENGTH) {
        return `Имя должно содержать минимум ${PROFILE_DISPLAY_NAME_MIN_LENGTH} символа.`;
    }

    if (normalizedDisplayName.length > PROFILE_DISPLAY_NAME_MAX_LENGTH) {
        return `Имя должно содержать не больше ${PROFILE_DISPLAY_NAME_MAX_LENGTH} символов.`;
    }

    return null;
}

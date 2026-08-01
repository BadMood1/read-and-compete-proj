const DEFAULT_USER_DISPLAY_NAME = "Читатель";

// Приводит имена из OAuth к одному виду и подставляет fallback для пустого значения.
export function getUserDisplayName(displayName: string | null | undefined) {
    return displayName?.trim() || DEFAULT_USER_DISPLAY_NAME;
}

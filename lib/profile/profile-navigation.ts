// Собирает единый адрес профиля, чтобы разные части приложения кодировали ID одинаково.
export function createProfilePath(userId: string) {
    return `/profile/${encodeURIComponent(userId.trim())}`;
}

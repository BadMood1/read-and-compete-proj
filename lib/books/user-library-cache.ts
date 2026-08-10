import "server-only";

const USER_LIBRARY_CACHE_TAG_PREFIX = "user-library";

// У каждого пользователя свой тег, поэтому изменение одной библиотеки не сбрасывает остальные.
export function createUserLibraryCacheTag(userId: string) {
    return `${USER_LIBRARY_CACHE_TAG_PREFIX}:${userId.trim()}`;
}

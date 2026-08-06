import "server-only";

// Форма создаёт один q, но тип учитывает стандартный формат searchParams в Next.js.
export type FriendsPageSearchParameters = {
    q?: string | string[];
};

// Достаёт строку поиска из URL и приводит пустое значение к обычной пустой строке.
export async function getNormalizedFriendsPageSearchQuery(
    searchParams: Promise<FriendsPageSearchParameters>,
) {
    const rawSearchQuery = (await searchParams).q;

    return (typeof rawSearchQuery === "string" ? rawSearchQuery : "").trim();
}

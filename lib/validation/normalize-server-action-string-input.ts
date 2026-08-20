import "server-only";

// Server Action можно вызвать в обход типизированного интерфейса отдельным POST-запросом.
// null означает, что пришла не строка; пустая строка остаётся отдельным допустимым результатом.
export function normalizeServerActionStringInput(value: unknown): string | null {
    return typeof value === "string" ? value.trim() : null;
}

import { Search } from "lucide-react";
import Form from "next/form";

import { Button } from "@/components/ui/button";

type FriendsUserSearchSectionProps = {
    searchQueryPromise: Promise<string>;
};

// Полноширинная строка поиска сохраняет запрос в URL, поэтому результатом можно поделиться.
export async function FriendsUserSearchSection({ searchQueryPromise }: FriendsUserSearchSectionProps) {
    const searchQuery = await searchQueryPromise;

    return (
        <section aria-labelledby="friends-user-search-heading">
            <h2 id="friends-user-search-heading" className="sr-only">
                Поиск читателей
            </h2>

            {/* Строковый action добавляет значение поля q к адресу: /friends?q=... */}
            <Form action="/friends" role="search" className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                    <Search
                        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <label htmlFor="friends-user-search-query" className="sr-only">
                        Найти читателя по имени
                    </label>
                    <input
                        id="friends-user-search-query"
                        name="q"
                        type="search"
                        defaultValue={searchQuery}
                        minLength={2}
                        placeholder="Поиск по имени читателя"
                        className="h-12 w-full rounded-xl border border-input bg-card pl-12 pr-4 text-base shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15"
                    />
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full rounded-xl px-6 text-base shadow-sm sm:w-auto"
                >
                    Найти
                    <Search aria-hidden="true" />
                </Button>
            </Form>
        </section>
    );
}

// Резервирует точную высоту строки, пока Next.js получает параметры текущего URL.
export function FriendsUserSearchSectionSkeleton() {
    return (
        <div
            className="flex flex-col gap-3 motion-safe:animate-pulse sm:flex-row"
            role="status"
            aria-label="Загружаем поиск читателей"
        >
            <div className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-card" />
            <div className="h-12 w-full rounded-xl bg-primary/25 sm:w-28" />
        </div>
    );
}

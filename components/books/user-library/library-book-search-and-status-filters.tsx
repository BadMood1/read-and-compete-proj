// Здесь будут находиться поиск и фильтры уже добавленных в библиотеку книг.

import { Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";

import type { ReadingStatus } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { READING_STATUS_LABELS, READING_STATUS_ORDER } from "@/lib/books/reading-status-labels";
import { createLibrarySearchAndStatusPath } from "@/lib/books/user-library-navigation";
import { cn } from "@/lib/utils";

type FiltersProps = {
    searchQuery: string;
    selectedReadingStatus: ReadingStatus | null;
};

export function LibraryBookSearchAndStatusFilters({ searchQuery, selectedReadingStatus }: FiltersProps) {
    return (
        <div className="space-y-4">
            {/* Строковый action превращает форму в GET-переход на /library?q=... */}
            <Form action="/library" role="search" className="mt-4 flex flex-col gap-3 sm:flex-row">
                {/* фиктивный input, чтобы поле status через name включилось в URL */}
                {selectedReadingStatus ? (
                    <input type="hidden" name="status" value={selectedReadingStatus} />
                ) : null}
                <label htmlFor="library-book-query" className="sr-only">
                    Найти книгу в своей библиотеке
                </label>

                <div className="relative flex-1">
                    <Search
                        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <input
                        id="library-book-query"
                        name="q"
                        type="search"
                        defaultValue={searchQuery}
                        placeholder="Поиск по библиотеке"
                        className="h-12 w-full rounded-xl border border-input bg-card pl-12 pr-4 text-base shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15"
                    />
                </div>

                <Button type="submit" size="lg" className="h-12 rounded-xl px-6 text-base shadow-sm">
                    Найти
                    <Search aria-hidden="true" />
                </Button>
            </Form>

            <nav aria-label="Фильтр библиотеки по статусу чтения" className="flex flex-wrap gap-2">
                <Link
                    href={createLibrarySearchAndStatusPath(searchQuery, null)}
                    aria-current={selectedReadingStatus === null ? "page" : undefined}
                    className={cn(
                        "shrink-0 rounded-full border px-3 py-2 text-center text-sm font-medium transition-colors",
                        selectedReadingStatus === null
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground",
                    )}
                >
                    Все
                </Link>

                {READING_STATUS_ORDER.map((readingStatus) => {
                    const isCurrentReadingStatus = selectedReadingStatus === readingStatus;

                    return (
                        <Link
                            key={readingStatus}
                            href={createLibrarySearchAndStatusPath(searchQuery, readingStatus)}
                            aria-current={isCurrentReadingStatus ? "page" : undefined}
                            className={cn(
                                "shrink-0 rounded-full border px-3 py-2 text-center text-sm font-medium transition-colors",
                                isCurrentReadingStatus
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground",
                            )}
                        >
                            {READING_STATUS_LABELS[readingStatus]}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

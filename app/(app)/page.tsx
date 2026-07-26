import { ArrowRight, Search } from "lucide-react";
import { Suspense } from "react";

import { GoogleBookSearchResultCard } from "@/components/books/google-book-search-result-card";
import { Button } from "@/components/ui/button";
import { createSearchResultsReturnPath } from "@/lib/books/book-details-navigation";
import { searchGoogleBooks, type GoogleBookSearchResult } from "@/lib/books/google-books-api";

type HomeProps = {
    searchParams: Promise<{
        q?: string | string[];
    }>;
};

export default async function Home({ searchParams }: HomeProps) {
    const rawQuery = (await searchParams).q;
    const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";

    return (
        <main className="flex-1">
            <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
                {!query ? (
                    <div className="">
                        <p className="text-sm font-semibold text-primary">Поиск книг</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
                            Найдите следующую книгу
                        </h1>
                        <p className="mt-4 leading-7 text-muted-foreground">
                            Ищите по названию или автору. Найденную книгу можно будет добавить в личную
                            библиотеку на следующем шаге.
                        </p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-semibold text-primary">Поиск книг</p>
                    </div>
                )}

                <form action="/" method="get" role="search" className="mt-8 flex  flex-col gap-3 sm:flex-row">
                    <label htmlFor="book-query" className="sr-only">
                        Название книги или автор
                    </label>
                    <div className="relative flex-1">
                        <Search
                            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <input
                            id="book-query"
                            name="q"
                            type="search"
                            defaultValue={query}
                            minLength={2}
                            required
                            placeholder="Например, Мастер и Маргарита"
                            className="h-12 w-full rounded-xl border border-input bg-card pl-12 pr-4
                             text-base shadow-sm outline-none transition 
                             placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15"
                        />
                    </div>
                    <Button type="submit" size="lg" className="h-12 rounded-xl px-6 text-base shadow-sm">
                        Найти
                        <ArrowRight aria-hidden="true" />
                    </Button>
                </form>

                {!query ? (
                    <div className="mt-12 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/45 px-6 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                            <Search className="size-5 text-primary" aria-hidden="true" />
                        </span>
                        <h2 className="mt-4 font-semibold">Начните с поиска</h2>
                        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                            Результаты появятся здесь — с обложкой, авторами, годом издания и количеством
                            страниц.
                        </p>
                    </div>
                ) : (
                    // Новый query перезапускает Suspense и снова показывает skeleton.
                    <Suspense key={query} fallback={<GoogleBookSearchResultsSkeleton query={query} />}>
                        <GoogleBookSearchResults query={query} />
                    </Suspense>
                )}
            </section>
        </main>
    );
}

async function GoogleBookSearchResults({ query }: { query: string }) {
    let books: GoogleBookSearchResult[] = [];
    let searchFailed = false;

    // Только этот компонент ждёт внешний API; форма и Navbar уже отображены.
    try {
        if (query.length >= 2) {
            books = await searchGoogleBooks(query);
        }
    } catch (error) {
        console.error("Homepage book search failed:", error);
        searchFailed = true;
    }

    return (
        <div className="mt-10">
            <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Результаты поиска
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">«{query}»</h2>
                </div>
                {!searchFailed ? (
                    <p className="shrink-0 text-sm text-muted-foreground">Найдено: {books.length}</p>
                ) : null}
            </div>

            {query.length < 2 ? (
                <SearchMessage>Введите хотя бы два символа.</SearchMessage>
            ) : searchFailed ? (
                <SearchMessage>Google Books временно не отвечает. Попробуйте повторить поиск.</SearchMessage>
            ) : books.length === 0 ? (
                <SearchMessage>Ничего не найдено. Попробуйте изменить запрос.</SearchMessage>
            ) : (
                <div className="grid auto-rows-fr gap-4 lg:grid-cols-2">
                    {/* Все строки получают одинаковую высоту по самой высокой карточке. */}
                    {books.map((book) => (
                        <GoogleBookSearchResultCard
                            key={book.googleBooksId}
                            book={book}
                            bookDetailsReturnPath={createSearchResultsReturnPath(query)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function GoogleBookSearchResultsSkeleton({ query }: { query: string }) {
    return (
        <div className="mt-12" aria-busy="true" aria-live="polite">
            <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Результаты поиска
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">«{query}»</h2>
                </div>
                <p className="shrink-0 text-sm text-muted-foreground">Ищем...</p>
            </div>

            {/* Заглушки сохраняют размеры будущих карточек и уменьшают скачок страницы. */}
            <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div
                        key={index}
                        className="grid min-h-48 animate-pulse grid-cols-[88px_1fr] gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[104px_1fr] sm:gap-5"
                    >
                        <div className="aspect-2/3 rounded-lg bg-muted" />
                        <div className="self-center">
                            <div className="h-3 w-20 rounded-full bg-muted" />
                            <div className="mt-3 h-5 w-4/5 rounded-full bg-muted" />
                            <div className="mt-3 h-4 w-1/2 rounded-full bg-muted" />
                            <div className="mt-5 h-3 w-full rounded-full bg-muted" />
                            <div className="mt-2 h-3 w-3/4 rounded-full bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SearchMessage({ children }: { children: React.ReactNode }) {
    return (
        <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
            {children}
        </p>
    );
}

import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AddBookToLibraryBookmarkButton } from "@/components/books/add-book-to-library-bookmark-button";
import { createBookDetailsPath } from "@/lib/books/book-details-navigation";
import type { GoogleBookSearchResult } from "@/lib/books/google-books-api";

type GoogleBookSearchResultCardProps = {
    book: GoogleBookSearchResult;
    // Адрес поиска, на который нужно вернуться со страницы книги.
    bookDetailsReturnPath: string;
};

// Показывает один результат Google Books и открывает его полную страницу.
export function GoogleBookSearchResultCard({ book, bookDetailsReturnPath }: GoogleBookSearchResultCardProps) {
    const details = [
        book.publishedDate?.slice(0, 4),
        book.pageCount ? `${book.pageCount} стр.` : null,
        book.language?.toUpperCase(),
    ].filter(Boolean);

    // Передаём поисковый запрос через query-параметр страницы книги.
    // bookDetailsReturnPath = "/?q=Harry+Potter"
    const bookDetailsPath = createBookDetailsPath({
        googleBooksId: book.googleBooksId,
        returnPath: bookDetailsReturnPath,
    });

    return (
        <article className="group/book-card relative h-full">
            <Link
                href={bookDetailsPath}
                aria-label={`Открыть книгу «${book.title}»`}
                className="grid h-full grid-cols-[88px_1fr] gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm
                 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:grid-cols-[104px_1fr] sm:gap-5"
            >
                <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-secondary/70">
                    {book.coverUrl ? (
                        <Image
                            src={book.coverUrl}
                            alt={`Обложка книги «${book.title}»`}
                            fill
                            sizes="(max-width: 640px) 88px, 104px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <BookOpen className="size-6 opacity-55" aria-hidden="true" />
                        </div>
                    )}
                </div>

                {/* Справа оставляем место под ленточку, но не забираем лишнюю ширину на телефонах. */}
                <div className="min-w-0 self-center pr-12 sm:pr-14">
                    {book.categories[0] ? (
                        <p className="mb-1 line-clamp-1 text-xs font-medium uppercase tracking-wider text-primary">
                            {book.categories[0]}
                        </p>
                    ) : null}

                    <h3 className="line-clamp-2 text-lg font-semibold leading-snug">{book.title}</h3>

                    {book.subtitle ? (
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{book.subtitle}</p>
                    ) : null}

                    <p className="mt-2 line-clamp-2 text-sm font-medium">
                        {book.authors.length > 0 ? book.authors.join(", ") : "Автор не указан"}
                    </p>

                    {details.length > 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">{details.join(" · ")}</p>
                    ) : null}

                    {book.description ? (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {book.description}
                        </p>
                    ) : null}
                </div>
            </Link>

            {/* Пока показываем только начальное оранжевое состояние без логики добавления. */}
            <AddBookToLibraryBookmarkButton state="not-added" />
        </article>
    );
}

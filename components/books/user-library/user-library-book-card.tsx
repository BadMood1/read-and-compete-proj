import type { ReadingStatus } from "@/app/generated/prisma/enums";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LibraryBookReadingStatusDropdown } from "./library-book-reading-status-dropdown";
import { createBookDetailsPath } from "@/lib/books/book-details-navigation";

type UserLibraryBookCardProps = {
    status: ReadingStatus;
    book: {
        googleBooksId: string;
        title: string;
        authors: string[];
        coverUrl: string | null;
        pageCount: number | null;
        publishedDate: string | null;
    };
    returnPath: string;
};

// Показывает одну сохранённую книгу и ведёт на её полную страницу.
export function UserLibraryBookCard({ status, book, returnPath }: UserLibraryBookCardProps) {
    // Собираем только существующие характеристики, чтобы не выводить пустые разделители.
    const details = [
        book.publishedDate?.slice(0, 4),
        book.pageCount ? `${book.pageCount} стр.` : null,
    ].filter(Boolean);

    // returnPath нужен, чтобы ссылка «Назад» вернула пользователя в библиотеку.
    // добавляем в searchParams, на странице книги возьмем обратно
    const bookDetailsPath = createBookDetailsPath({
        googleBooksId: book.googleBooksId,
        returnPath,
    });

    return (
        <article className="relative isolate grid min-h-48 grid-cols-[88px_1fr] gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:grid-cols-[104px_1fr] sm:gap-5">
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

            {/* Информация начинается на уровне верхнего края обложки, а статус прижат к низу. */}
            <div className="flex min-w-0 flex-col">
                <h2 className="text-lg font-semibold leading-snug">
                    <Link
                        href={bookDetailsPath}
                        aria-label={`Открыть книгу «${book.title}»`}
                        className="after:absolute after:inset-0 after:z-10 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2"
                    >
                        {book.title}
                    </Link>
                </h2>

                <p className="mt-2 text-sm font-medium">
                    {book.authors.length > 0 ? book.authors.join(", ") : "Автор не указан"}
                </p>

                {details.length > 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">{details.join(" · ")}</p>
                ) : null}

                {/* Dropdown лежит выше растянутой ссылки, поэтому кнопка не оказывается внутри Link. */}
                <div className="mt-auto pt-4">
                    <LibraryBookReadingStatusDropdown
                        googleBooksId={book.googleBooksId}
                        readingStatus={status}
                    />
                </div>
            </div>
        </article>
    );
}

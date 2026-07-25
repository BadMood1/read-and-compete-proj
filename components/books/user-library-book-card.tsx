import type { ReadingStatus } from "@/app/generated/prisma/enums";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createBookDetailsPath } from "@/lib/books/book-details-navigation";
import { READING_STATUS_LABELS } from "@/lib/books/reading-status-labels";

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
};

// Показывает одну сохранённую книгу и ведёт на её полную страницу.
export function UserLibraryBookCard({ status, book }: UserLibraryBookCardProps) {
    // Собираем только существующие характеристики, чтобы не выводить пустые разделители.
    const details = [
        book.publishedDate?.slice(0, 4),
        book.pageCount ? `${book.pageCount} стр.` : null,
    ].filter(Boolean);

    // returnPath нужен, чтобы ссылка «Назад» вернула пользователя в библиотеку.
    // добавляем в searchParams, на странице книги возьмем обратно
    const bookDetailsPath = createBookDetailsPath({
        googleBooksId: book.googleBooksId,
        returnPath: "/library",
    });

    return (
        <article>
            <Link
                href={bookDetailsPath}
                aria-label={`Открыть книгу «${book.title}»`}
                className="grid min-h-48 grid-cols-[88px_1fr] gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:grid-cols-[104px_1fr] sm:gap-5"
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

                <div className="min-w-0 self-center">
                    <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
                        {READING_STATUS_LABELS[status]}
                    </span>

                    <h2 className="mt-3 text-lg font-semibold leading-snug">{book.title}</h2>

                    <p className="mt-2 text-sm font-medium">
                        {book.authors.length > 0 ? book.authors.join(", ") : "Автор не указан"}
                    </p>

                    {details.length > 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">{details.join(" · ")}</p>
                    ) : null}
                </div>
            </Link>
        </article>
    );
}

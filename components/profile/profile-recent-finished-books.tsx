import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { createBookDetailsPath } from "@/lib/books/book-details-navigation";
import { createProfilePath } from "@/lib/profile/profile-navigation";

type ProfileRecentFinishedBook = {
    googleBooksId: string;
    title: string;
    authors: string[];
    coverUrl: string | null;
    finishedAt: Date | null;
};

type ProfileRecentFinishedBooksProps = {
    profileUserId: string;
    books: ProfileRecentFinishedBook[];
};

const finishedBookDateFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
});

// Показывает последние книги, которые пользователь отметил прочитанными.
export function ProfileRecentFinishedBooks({ profileUserId, books }: ProfileRecentFinishedBooksProps) {
    if (books.length === 0) {
        return (
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    История чтения
                </p>
                {/* <h2 className="mt-2 text-2xl font-semibold tracking-tight">Последние прочитанные</h2> */}

                <div className="mt-5 flex min-h-40 sm:min-h-50 flex-col items-center justify-center rounded-2xl bg-muted/55 px-4 text-center">
                    <BookOpen className="size-8 text-primary/65" aria-hidden="true" />
                    <p className="mt-3 font-medium">История завершений пока пуста</p>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                        Последние книги появятся после новой отметки «Прочитано».
                    </p>
                </div>
            </section>
        );
    }

    const profileReturnPath = createProfilePath(profileUserId);

    return (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">История чтения</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Последние прочитанные</h2>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {books.map((book) => {
                    // returnPath возвращает со страницы книги обратно в этот профиль.
                    const bookDetailsPath = createBookDetailsPath({
                        googleBooksId: book.googleBooksId,
                        returnPath: profileReturnPath,
                    });

                    return (
                        <article key={book.googleBooksId} className="min-w-0">
                            <Link
                                href={bookDetailsPath}
                                aria-label={`Открыть книгу «${book.title}»`}
                                className="group block h-full rounded-2xl border border-border bg-background p-3 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-secondary/65">
                                    {book.coverUrl ? (
                                        <Image
                                            src={book.coverUrl}
                                            alt={`Обложка книги «${book.title}»`}
                                            fill
                                            sizes="(max-width: 767px) 42vw, (max-width: 1279px) 29vw, 210px"
                                            className="object-cover transition duration-300 group-hover:scale-[1.02]"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <BookOpen
                                                className="size-8 text-foreground/45"
                                                aria-hidden="true"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="px-0.5 pb-1 pt-3">
                                    <h3 className="line-clamp-3 font-semibold leading-snug transition-colors group-hover:text-primary">
                                        {book.title}
                                    </h3>
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                        {book.authors.length > 0
                                            ? book.authors.join(", ")
                                            : "Автор не указан"}
                                    </p>
                                    {book.finishedAt ? (
                                        <p className="mt-3 text-xs font-medium text-muted-foreground">
                                            Прочитано {finishedBookDateFormatter.format(book.finishedAt)}
                                        </p>
                                    ) : null}
                                </div>
                            </Link>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

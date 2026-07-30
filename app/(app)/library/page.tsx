import {
    LibraryBookSearchAndStatusFilters,
    UserLibraryBookCard,
} from "@/components/books/user-library";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { READING_STATUS_ORDER } from "@/lib/books/reading-status-labels";
import { createLibrarySearchAndStatusPath } from "@/lib/books/user-library-navigation";
import { getLibraryBooksForUser } from "@/lib/books/user-library-queries";
import { LibraryBig, SearchX } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

type LibraryPageProps = {
    searchParams: Promise<{
        q?: string | string[];
        status?: string | string[];
    }>;
};

// Серверная страница получает личную библиотеку пользователя прямо из БД.
export default async function LibraryPage({ searchParams }: LibraryPageProps) {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Библиотека и параметры URL независимы, поэтому ждём их одновременно.
    const [libraryBooks, resolvedSearchParams] = await Promise.all([
        getLibraryBooksForUser(session.user.id),
        searchParams,
    ]);

    // searchQuery

    const rawSearchQuery = Array.isArray(resolvedSearchParams.q) // если в запросе ?q=qwe&q=1232 (чисто защита)
        ? resolvedSearchParams.q[0]
        : resolvedSearchParams.q;

    const searchQuery = rawSearchQuery?.trim() || "";
    const normalizedSearchQuery = searchQuery.toLowerCase();

    // Status

    const rawSelectedReadingStatus = Array.isArray(resolvedSearchParams.status)
        ? resolvedSearchParams.status[0]
        : resolvedSearchParams.status;

    const selectedReadingStatus =
        READING_STATUS_ORDER.find((readingStatus) => readingStatus === rawSelectedReadingStatus) ?? null;

    // Фильтр с учетом поиска и статуса
    const filteredLibraryBooks = libraryBooks.filter((userLibraryEntry) => {
        const matchesSelectedReadingStatus =
            selectedReadingStatus === null || userLibraryEntry.status === selectedReadingStatus;

        const normalizedBookTitle = userLibraryEntry.book.title.toLowerCase(); // по названию

        // some() вернёт true, если запрос содержится хотя бы в одном имени автора.
        const doesAnyBookAuthorMatchSearchQuery = userLibraryEntry.book.authors.some(
            (author) => author.toLowerCase().includes(normalizedSearchQuery), // по массиву авторов перебрали
        );

        const doesBookMatchSearchQuery =
            normalizedSearchQuery === "" ||
            normalizedBookTitle.includes(normalizedSearchQuery) ||
            doesAnyBookAuthorMatchSearchQuery;

        return matchesSelectedReadingStatus && doesBookMatchSearchQuery;
    });

    // Берём путь наш формируем, чтоб карточки использовали его как возвратный
    const returnPath = createLibrarySearchAndStatusPath(searchQuery, selectedReadingStatus);

    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-primary">Library</p>
                </div>

                {libraryBooks.length > 0 ? (
                    <p className="text-sm text-muted-foreground">Книг: {filteredLibraryBooks.length}</p>
                ) : null}
            </div>

            {/* Поиск и фильтры */}
            <LibraryBookSearchAndStatusFilters
                searchQuery={searchQuery}
                selectedReadingStatus={selectedReadingStatus}
            />

            {/* Различаем пустую библиотеку, отсутствие совпадений и найденные книги. */}
            {libraryBooks.length === 0 ? (
                <div className="mt-10 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/45 px-6 text-center">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                        <LibraryBig className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 font-semibold">Библиотека пока пустая</h2>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                        Найдите первую книгу и добавьте её в личную библиотеку.
                    </p>
                    <Button asChild size="lg" className="mt-5">
                        <Link href="/">Найти книги</Link>
                    </Button>
                </div>
            ) : filteredLibraryBooks.length === 0 ? (
                <div className="mt-10 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/45 px-6 text-center">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                        <SearchX className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 font-semibold">Подходящих книг не найдено</h2>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                        Измените поисковый запрос, выберите другой статус или сбросьте фильтры.
                    </p>
                    <Button asChild variant="outline" size="lg" className="mt-5">
                        <Link href="/library">Сбросить фильтры</Link>
                    </Button>
                </div>
            ) : (
                <div className="mt-10 grid gap-4 lg:grid-cols-2">
                    {filteredLibraryBooks.map((userLibraryEntry) => (
                        <UserLibraryBookCard
                            key={userLibraryEntry.id}
                            status={userLibraryEntry.status}
                            book={userLibraryEntry.book}
                            returnPath={returnPath}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}

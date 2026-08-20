import {
    LibraryBookSearchAndStatusFilters,
    UserLibraryBookCard,
} from "@/components/books/user-library";
import { Button } from "@/components/ui/button";
import { redirectToLoginFromCurrentPage } from "@/lib/auth/current-page-authentication-redirects";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import {
    filterLibraryBooksBySearchAndReadingStatus,
    getLibraryPageFilters,
    type LibraryPageSearchParameters,
} from "@/lib/books/library-page-filtering";
import { createLibrarySearchAndStatusPath } from "@/lib/books/user-library-navigation";
import { getLibraryBooksForUser } from "@/lib/books/user-library-queries";
import { LibraryBig, SearchX } from "lucide-react";
import Link from "next/link";

type LibraryPageProps = {
    searchParams: Promise<LibraryPageSearchParameters>;
};

const CURRENT_USER_LIBRARY_PAGE_PATH = "/library";

// Серверная страница получает личную библиотеку пользователя прямо из БД.
export default async function LibraryPage({ searchParams }: LibraryPageProps) {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
        return redirectToLoginFromCurrentPage();
    }

    // Библиотека и параметры URL независимы, поэтому ждём их одновременно.
    const [libraryBooks, resolvedSearchParams] = await Promise.all([
        getLibraryBooksForUser(session.user.id),
        searchParams,
    ]);

    const { searchQuery, selectedReadingStatus } = getLibraryPageFilters(resolvedSearchParams);
    const filteredLibraryBooks = filterLibraryBooksBySearchAndReadingStatus(libraryBooks, {
        searchQuery,
        selectedReadingStatus,
    });

    // Берём путь наш формируем, чтоб карточки использовали его как возвратный
    const returnPath = createLibrarySearchAndStatusPath({
        libraryPagePath: CURRENT_USER_LIBRARY_PAGE_PATH,
        searchQuery,
        readingStatus: selectedReadingStatus,
    });

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
                libraryPagePath={CURRENT_USER_LIBRARY_PAGE_PATH}
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
                        <Link href={CURRENT_USER_LIBRARY_PAGE_PATH}>Сбросить фильтры</Link>
                    </Button>
                </div>
            ) : (
                <div className="mt-10 grid gap-4 lg:grid-cols-2">
                    {filteredLibraryBooks.map((userLibraryEntry) => (
                        <UserLibraryBookCard
                            key={userLibraryEntry.id}
                            interactionMode="editable"
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

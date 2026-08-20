import { LibraryBig, LockKeyhole, SearchX } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
    LibraryBookSearchAndStatusFilters,
    UserLibraryBookCard,
} from "@/components/books/user-library";
import { PageBackNavigationLink } from "@/components/navigation/page-back-navigation-link";
import { Button } from "@/components/ui/button";
import { redirectToLoginFromCurrentPage } from "@/lib/auth/current-page-authentication-redirects";
import {
    filterLibraryBooksBySearchAndReadingStatus,
    getLibraryPageFilters,
    type LibraryPageSearchParameters,
} from "@/lib/books/library-page-filtering";
import { createLibrarySearchAndStatusPath } from "@/lib/books/user-library-navigation";
import { getLibraryBooksForUser } from "@/lib/books/user-library-queries";
import { getCurrentUserFriendLibraryAccessState } from "@/lib/friends/library-access/current-user-friend-library-access-queries";
import { CurrentUserFriendLibraryAccessState } from "@/lib/friends/library-access/current-user-friend-library-access-state";
import {
    createProfileLibraryPath,
    createProfilePath,
} from "@/lib/profile/profile-navigation";
import { getProfileLibraryOwnerByIdentifier } from "@/lib/profile/profile-library-owner-query";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type ProfileLibraryPageProps = {
    params: Promise<{
        username: string;
    }>;
    searchParams: Promise<LibraryPageSearchParameters>;
};

// Проверяет доступ на сервере до запроса приватного содержимого библиотеки.
export default async function ProfileLibraryPage({ params, searchParams }: ProfileLibraryPageProps) {
    // Username владельца и фильтры из URL независимы, поэтому получаем их одновременно.
    const [{ username: profileIdentifier }, resolvedSearchParams] = await Promise.all([
        params,
        searchParams,
    ]);
    const { searchQuery, selectedReadingStatus } = getLibraryPageFilters(resolvedSearchParams);

    const profileLibraryOwner = await getProfileLibraryOwnerByIdentifier(profileIdentifier);

    if (!profileLibraryOwner) {
        notFound();
    }

    const canonicalProfileIdentifier = profileLibraryOwner.username ?? profileLibraryOwner.id;
    const canonicalProfileLibraryPath = createProfileLibraryPath(canonicalProfileIdentifier);

    // Старая ID-ссылка сохраняет фильтры и сразу превращается в канонический username-адрес.
    if (profileIdentifier.trim().toLowerCase() !== canonicalProfileIdentifier) {
        redirect(
            createLibrarySearchAndStatusPath({
                libraryPagePath: canonicalProfileLibraryPath,
                searchQuery,
                readingStatus: selectedReadingStatus,
            }),
        );
    }

    const libraryAccessState = await getCurrentUserFriendLibraryAccessState(profileLibraryOwner.id);

    // Защищённый layout обычно не допустит этот случай, но страница безопасна сама по себе.
    if (libraryAccessState === null) {
        return redirectToLoginFromCurrentPage();
    }

    // У собственной библиотеки остаётся короткий канонический адрес /library.
    if (libraryAccessState === CurrentUserFriendLibraryAccessState.CURRENT_USER_LIBRARY) {
        redirect(
            createLibrarySearchAndStatusPath({
                libraryPagePath: "/library",
                searchQuery,
                readingStatus: selectedReadingStatus,
            }),
        );
    }

    const profilePagePath = createProfilePath(canonicalProfileIdentifier);
    const profileDisplayName = getUserDisplayName(profileLibraryOwner.name);

    // Для отсутствующей дружбы и скрытой библиотеки намеренно показываем одно состояние.
    if (libraryAccessState !== CurrentUserFriendLibraryAccessState.FRIEND_LIBRARY_VISIBLE) {
        return (
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
                <div className="space-y-6">
                    <PageBackNavigationLink href={profilePagePath} label="Назад к профилю" />

                    <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/45 px-6 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                            <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
                        </span>
                        <h1 className="mt-4 text-xl font-semibold">Библиотека недоступна</h1>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                            Эту библиотеку нельзя открыть с текущего аккаунта.
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    // Только положительная проверка доступа разрешает запросить записи UserBook владельца.
    const libraryBooks = await getLibraryBooksForUser(profileLibraryOwner.id);
    const filteredLibraryBooks = filterLibraryBooksBySearchAndReadingStatus(libraryBooks, {
        searchQuery,
        selectedReadingStatus,
    });
    const profileLibraryPagePath = canonicalProfileLibraryPath;

    // Карточка сохраняет текущие фильтры, чтобы ссылка «Назад» вернула в то же состояние списка.
    const returnPath = createLibrarySearchAndStatusPath({
        libraryPagePath: profileLibraryPagePath,
        searchQuery,
        readingStatus: selectedReadingStatus,
    });

    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
            <div className="space-y-6">
                <PageBackNavigationLink href={profilePagePath} label="Назад к профилю" />

                {/* Такой же компактный заголовок используется в личной библиотеке. */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <p className="text-sm font-semibold text-primary">
                        {profileDisplayName}&apos;s Library
                    </p>

                    {libraryBooks.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Книг: {filteredLibraryBooks.length}
                        </p>
                    ) : null}
                </div>

                <LibraryBookSearchAndStatusFilters
                    libraryPagePath={profileLibraryPagePath}
                    searchQuery={searchQuery}
                    selectedReadingStatus={selectedReadingStatus}
                />
            </div>

            {/* В чужой библиотеке доступны только просмотр, поиск и фильтрация. */}
            {libraryBooks.length === 0 ? (
                <div className="mt-10 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/45 px-6 text-center">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                        <LibraryBig className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 font-semibold">Библиотека пока пустая</h2>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                        В этой библиотеке пока нет добавленных книг.
                    </p>
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
                        <Link href={profileLibraryPagePath}>Сбросить фильтры</Link>
                    </Button>
                </div>
            ) : (
                <div className="mt-10 grid gap-4 lg:grid-cols-2">
                    {filteredLibraryBooks.map((userLibraryEntry) => (
                        <UserLibraryBookCard
                            key={userLibraryEntry.id}
                            interactionMode="read-only"
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

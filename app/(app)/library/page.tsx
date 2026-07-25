import { auth } from "@/auth";
import { UserLibraryBookCard } from "@/components/books/user-library-book-card";
import { Button } from "@/components/ui/button";
import { getLibraryBooksForUser } from "@/lib/books/user-library-queries";
import { LibraryBig } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

// Серверная страница получает личную библиотеку пользователя прямо из БД.
export default async function LibraryPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // Получаем только библиотеку текущего пользователя и нужные карточкам поля книги.
    const libraryBooks = await getLibraryBooksForUser(session.user.id);

    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-primary">Library</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
                        Моя библиотека
                    </h1>
                </div>

                {libraryBooks.length > 0 ? (
                    <p className="text-sm text-muted-foreground">Книг: {libraryBooks.length}</p>
                ) : null}
            </div>

            {/* Показываем приглашение к поиску или сетку сохранённых книг. */}
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
            ) : (
                <div className="mt-10 grid gap-4 lg:grid-cols-2">
                    {libraryBooks.map((userLibraryEntry) => (
                        <UserLibraryBookCard
                            key={userLibraryEntry.id}
                            status={userLibraryEntry.status}
                            book={userLibraryEntry.book}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}

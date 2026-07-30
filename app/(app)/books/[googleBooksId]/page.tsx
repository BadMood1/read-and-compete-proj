import { getGoogleBookById } from "@/lib/books/google-books-api";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AddOrRemoveBookFromLibraryButton from "@/components/books/add-or-remove-book-from-library-button";
import { BookRatingSummary } from "@/components/reviews/book-rating-summary";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { getValidatedBookDetailsReturnPath } from "@/lib/books/book-details-navigation";
import { isGoogleBookInUserLibrary } from "@/lib/books/user-library-queries";
import { CurrentUserBookReviewEditor } from "@/components/reviews/current-user-book-review-editor";
import { getCurrentUserReviewForGoogleBook } from "@/lib/reviews/current-user-review-queries";
import { PublicBookReviewList } from "@/components/reviews/public-book-review-list";
import { getPublicReviewsForGoogleBook } from "@/lib/reviews/public-book-review-queries";
import { getBookRatingSummary } from "@/lib/reviews/book-rating-summary-query";

type BookPageProps = {
    // В Next.js 16 динамические параметры страницы приходят как Promise.
    params: Promise<{
        googleBooksId: string;
    }>;
    searchParams: Promise<{
        returnPath?: string | string[];
    }>;
};

export default async function BookPage({ params, searchParams }: BookPageProps) {
    // Сессия не зависит от параметров и Google Books, поэтому запускаем её заранее.
    const currentSessionPromise = getCurrentSession();

    // Параметры адреса независимы друг от друга, поэтому получаем их одновременно.
    const [{ googleBooksId }, resolvedSearchParams] = await Promise.all([params, searchParams]);

    // Определяем, куда вести ссылку «Назад» — в поиск или библиотеку.
    const bookDetailsReturnPath = getValidatedBookDetailsReturnPath(resolvedSearchParams.returnPath);
    const backLinkLabel = bookDetailsReturnPath.startsWith("/library")
        ? "Назад к библиотеке"
        : "Назад к поиску";

    // Загружаем конкретную книгу по ID из адресной строки.
    const [book, session] = await Promise.all([getGoogleBookById(googleBooksId), currentSessionPromise]);

    // null означает, что Google не нашёл книгу с таким ID.
    if (!book) {
        notFound();
    }

    const currentUserId = session?.user?.id;

    // Защита layout остаётся основной, а эта проверка не даёт странице работать без userId.
    if (!currentUserId) {
        redirect("/login");
    }

    // Все запросы используют уже известные ID, но друг от друга не зависят.
    const [
        isBookAlreadyInUserLibrary,
        currentUserReview,
        publicBookReviews,
        bookRatingSummary,
    ] = await Promise.all([
        isGoogleBookInUserLibrary(currentUserId, book.googleBooksId),
        getCurrentUserReviewForGoogleBook(currentUserId, book.googleBooksId),
        getPublicReviewsForGoogleBook(book.googleBooksId, currentUserId),
        getBookRatingSummary(book.googleBooksId),
    ]);

    const details = [
        book.publishedDate?.slice(0, 4),
        book.pageCount ? `${book.pageCount} стр.` : null,
        book.language?.toUpperCase(),
    ].filter(Boolean);

    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
            {/* returnPath сохраняет источник перехода, но принимается только после проверки пути. */}
            <Link
                href={bookDetailsReturnPath}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {backLinkLabel}
            </Link>

            {/* На планшете описание занимает всю нижнюю строку, на desktop возвращается вправо. */}
            <article className="mt-6 grid gap-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8 md:grid-cols-[240px_minmax(0,1fr)] md:gap-x-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[360px_minmax(0,1fr)]">
                {/* Обложка: сверху на мобильном и в левой колонке начиная с планшета. */}
                <div className="relative mx-auto aspect-2/3 w-full max-w-64 overflow-hidden rounded-2xl bg-secondary/60 shadow-md md:col-start-1 md:row-start-1 md:mx-0 md:max-w-none lg:row-span-2">
                    {book.coverUrl ? (
                        <Image
                            src={book.coverUrl}
                            alt={`Обложка книги «${book.title}»`}
                            fill
                            sizes="(max-width: 767px) 256px, (max-width: 1023px) 240px, (max-width: 1279px) 320px, 360px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <BookOpen className="size-10 text-primary/60" aria-hidden="true" />
                        </div>
                    )}
                </div>

                {/* Основная информация всегда располагается рядом с обложкой на md и lg. */}
                <div className="min-w-0 md:col-start-2 md:row-start-1">
                    {book.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {book.categories.slice(0, 3).map((category) => (
                                <span
                                    key={category}
                                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                                >
                                    {category}
                                </span>
                            ))}
                        </div>
                    ) : null}

                    <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
                        {book.title}
                    </h1>

                    {book.subtitle ? (
                        <p className="mt-3 text-lg text-muted-foreground">{book.subtitle}</p>
                    ) : null}

                    <p className="mt-5 font-medium">
                        {book.authors.length > 0 ? book.authors.join(", ") : "Автор не указан"}
                    </p>

                    {details.length > 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">{details.join(" · ")}</p>
                    ) : null}

                    {book.publisher ? (
                        <p className="mt-2 text-sm text-muted-foreground">Издательство: {book.publisher}</p>
                    ) : null}

                    {/* Общий рейтинг учитывает все оценки пользователей, даже оставленные без текста. */}
                    <BookRatingSummary
                        averageRating={bookRatingSummary.averageRating}
                        ratingsCount={bookRatingSummary.ratingsCount}
                    />
                </div>

                {/* На md описание идёт под обеими колонками, а на lg — только под информацией справа. */}
                <section className="border-t border-border pt-6 md:col-span-2 md:row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-2">
                    <h2 className="font-semibold">Описание</h2>

                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                        {book.description ?? "Описание отсутствует."}
                    </p>
                </section>

                {/* Начальное состояние приходит с сервера и сохраняется после перезагрузки. */}
                <AddOrRemoveBookFromLibraryButton
                    googleBooksId={book.googleBooksId}
                    isInitiallyInUserLibrary={isBookAlreadyInUserLibrary}
                />
            </article>

            {/* Редактор вынесен отдельно, потому что позже получит своё клиентское состояние. */}
            <CurrentUserBookReviewEditor
                googleBooksId={book.googleBooksId}
                initialReview={currentUserReview}
            />
            {/* Остальные рецензии пользователей */}
            <PublicBookReviewList reviews={publicBookReviews} />
        </main>
    );
}

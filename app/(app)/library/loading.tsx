import { LibraryPageSkeleton } from "@/components/books/user-library";

// Next.js показывает этот каркас, пока сервер получает сессию и книги пользователя.
export default function LibraryLoading() {
    return <LibraryPageSkeleton variant="current-user" />;
}

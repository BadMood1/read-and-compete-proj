import { LibraryPageSkeleton } from "@/components/books/user-library";

// Вариант profile оставляет место для ссылки возврата к владельцу библиотеки.
export default function ProfileLibraryLoading() {
    return <LibraryPageSkeleton variant="profile" />;
}

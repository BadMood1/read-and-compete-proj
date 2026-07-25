"use client";

import { addBookToLibrary } from "@/app/(app)/books/actions";
import { Button } from "@/components/ui/button";
import { Check, LoaderCircle, Plus } from "lucide-react";
import { useState, useTransition } from "react";

type AddToLibraryButtonProps = {
    // ID передаём в Server Action, чтобы там найти или создать книгу.
    googleBooksId: string;

    // Сервер сообщает, есть ли книга в библиотеке до загрузки клиентского JS.
    defaultIsInLibrary: boolean;
};

export default function AddToLibraryButton({ googleBooksId, defaultIsInLibrary }: AddToLibraryButtonProps) {
    // Локально переключаем кнопку сразу после успешного добавления.
    const [isInLibrary, setIsInLibrary] = useState(defaultIsInLibrary);

    // Текст ошибки показываем рядом с кнопкой, не ломая всю страницу.
    const [error, setError] = useState<string | null>(null);

    // useTransition сообщает, пока ли выполняется асинхронный Server Action.
    const [isPending, startTransition] = useTransition();

    function handleAddBook() {
        // Не отправляем повторный запрос во время загрузки или после добавления.
        if (isInLibrary || isPending) {
            return;
        }

        setError(null);

        // Transition даёт pending-состояние, пока Server Action работает с БД.
        startTransition(async () => {
            try {
                const result = await addBookToLibrary(googleBooksId);

                // Ожидаемые ошибки action возвращает как результат, а не исключение.
                if (!result.success) {
                    setError(result.error);
                    return;
                }

                // После успеха блокируем кнопку и меняем её текст.
                setIsInLibrary(true);
            } catch {
                // Сюда попадают неожиданные ошибки БД, сети или Google Books.
                setError("Не удалось добавить книгу. Попробуйте ещё раз.");
            }
        });
    }

    return (
        <div className="md:col-span-2 lg:col-span-1 lg:col-start-2">
            <Button
                type="button"
                size="lg"
                onClick={handleAddBook}
                disabled={isPending || isInLibrary}
                className="w-full sm:w-auto"
            >
                {/* Иконка и подпись отражают текущее состояние операции. */}
                {isPending ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : isInLibrary ? (
                    <Check aria-hidden="true" />
                ) : (
                    <Plus aria-hidden="true" />
                )}

                {isPending ? "Добавляем..." : isInLibrary ? "Уже в библиотеке" : "Добавить в библиотеку"}
            </Button>

            {error ? (
                <p role="alert" className="mt-2 text-sm text-destructive">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

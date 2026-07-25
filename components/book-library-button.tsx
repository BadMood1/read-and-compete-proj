"use client";

import {
    addBookToLibrary,
    removeBookFromLibrary,
    type BookLibraryActionResult,
} from "@/app/(app)/books/actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

type BookLibraryButtonProps = {
    // ID передаём в Server Action, чтобы там найти или создать книгу.
    googleBooksId: string;

    // Сервер сообщает, есть ли книга в библиотеке до загрузки клиентского JS.
    defaultIsInLibrary: boolean;
};

// Помогает понять, какая операция сейчас выполняется и какой текст показать.
type LibraryOperation = "add" | "remove";

// Одна кнопка добавляет книгу, а для удаления сначала открывает подтверждение.
export default function BookLibraryButton({ googleBooksId, defaultIsInLibrary }: BookLibraryButtonProps) {
    // Локально переключаем кнопку сразу после успешного добавления.
    const [isInLibrary, setIsInLibrary] = useState(defaultIsInLibrary);

    // Текст ошибки показываем рядом с кнопкой, не ломая всю страницу.
    const [error, setError] = useState<string | null>(null);

    // useTransition сообщает, пока ли выполняется асинхронный Server Action.
    const [isPending, startTransition] = useTransition();
    const [pendingOperation, setPendingOperation] = useState<LibraryOperation | null>(null);

    // Общая обработка результата для добавления и удаления.
    function runLibraryAction(
        operation: LibraryOperation,
        action: () => Promise<BookLibraryActionResult>,
    ) {
        // Не отправляем вторую мутацию, пока первая ещё выполняется.
        if (isPending) {
            return;
        }

        setError(null);
        setPendingOperation(operation);

        // Transition даёт pending-состояние, пока Server Action работает с БД.
        startTransition(async () => {
            try {
                const result = await action();

                // Ожидаемые ошибки action возвращает как результат, а не исключение.
                if (!result.success) {
                    setError(result.error);
                    return;
                }

                // Сервер возвращает итоговое состояние после добавления или удаления.
                setIsInLibrary(result.isInLibrary);
            } catch {
                // Сюда попадают неожиданные ошибки БД, сети или Google Books.
                setError("Не удалось изменить библиотеку. Попробуйте ещё раз.");
            } finally {
                setPendingOperation(null);
            }
        });
    }

    // Добавляем только если книги ещё нет в библиотеке.
    function handleAddBook() {
        if (!isInLibrary) {
            runLibraryAction("add", () => addBookToLibrary(googleBooksId));
        }
    }

    // Удаляем только если книга действительно находится в библиотеке.
    function handleRemoveBook() {
        if (isInLibrary) {
            runLibraryAction("remove", () => removeBookFromLibrary(googleBooksId));
        }
    }

    // Текст кнопки зависит от текущей операции и наличия книги в библиотеке.
    const buttonLabel =
        pendingOperation === "add"
            ? "Добавляем..."
            : pendingOperation === "remove"
              ? "Удаляем..."
              : isInLibrary
                ? "Уже в библиотеке"
                : "Добавить в библиотеку";

    return (
        <div className="md:col-span-2 lg:col-span-1 lg:col-start-2">
            {/* Для сохранённой книги кнопка сначала открывает подтверждение удаления. */}
            {isInLibrary ? (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            disabled={isPending}
                            className="w-full sm:w-auto"
                        >
                            {isPending ? (
                                <LoaderCircle className="animate-spin" aria-hidden="true" />
                            ) : (
                                <Check aria-hidden="true" />
                            )}
                            {buttonLabel}
                        </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Удалить книгу из библиотеки?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Книга исчезнет из вашей личной библиотеки. Её всегда можно будет добавить
                                снова.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRemoveBook}>
                                <Trash2 aria-hidden="true" />
                                Удалить
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : (
                <Button
                    type="button"
                    size="lg"
                    onClick={handleAddBook}
                    disabled={isPending}
                    className="w-full sm:w-auto"
                >
                    {isPending ? (
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                        <Plus aria-hidden="true" />
                    )}
                    {buttonLabel}
                </Button>
            )}

            {error ? (
                <p role="alert" className="mt-2 text-sm text-destructive">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

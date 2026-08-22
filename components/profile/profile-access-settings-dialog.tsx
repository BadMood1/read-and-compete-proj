"use client";

import { Globe2, LoaderCircle, Settings2, UsersRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import { updateCurrentUserRecentFinishedBooksVisibilityForNonFriends } from "@/lib/profile/current-user-profile-privacy-actions";
import { cn } from "@/lib/utils";

type ProfileAccessSettingsDialogProps = {
    initialRecentFinishedBooksVisibleToNonFriends: boolean;
};

// Открывает настройки профиля и сразу сохраняет изменение единственного тумблера.
export function ProfileAccessSettingsDialog({
    initialRecentFinishedBooksVisibleToNonFriends,
}: ProfileAccessSettingsDialogProps) {
    const [areRecentFinishedBooksVisibleToNonFriends, setAreRecentFinishedBooksVisibleToNonFriends] =
        useState(initialRecentFinishedBooksVisibleToNonFriends);
    const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    async function handleRecentFinishedBooksVisibilityChange(nextVisibility: boolean) {
        if (isUpdatingPrivacy || nextVisibility === areRecentFinishedBooksVisibleToNonFriends) {
            return;
        }

        const previousVisibility = areRecentFinishedBooksVisibleToNonFriends;

        // Сразу двигаем тумблер, а при ошибке возвращаем подтверждённое сервером значение.
        setErrorMessage(null);
        setAreRecentFinishedBooksVisibleToNonFriends(nextVisibility);
        setIsUpdatingPrivacy(true);

        try {
            const result = await updateCurrentUserRecentFinishedBooksVisibilityForNonFriends(nextVisibility);

            if (!result.success) {
                setAreRecentFinishedBooksVisibleToNonFriends(previousVisibility);
                setErrorMessage(result.error);
                return;
            }

            setAreRecentFinishedBooksVisibleToNonFriends(result.recentFinishedBooksVisibleToNonFriends);
        } catch {
            setAreRecentFinishedBooksVisibleToNonFriends(previousVisibility);
            setErrorMessage("Не удалось сохранить настройку. Попробуйте ещё раз.");
        } finally {
            setIsUpdatingPrivacy(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-11 w-full rounded-xl px-4 sm:w-auto"
                >
                    <Settings2 aria-hidden="true" />
                    Настроить доступ
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Кому показывать последние прочитанные книги?</DialogTitle>

                    <DialogDescription className="sr-only">
                        Настройте видимость последних прочитанных книг.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-busy={isUpdatingPrivacy}>
                    <button
                        type="button"
                        aria-pressed={!areRecentFinishedBooksVisibleToNonFriends}
                        disabled={isUpdatingPrivacy}
                        onClick={() => void handleRecentFinishedBooksVisibilityChange(false)}
                        className={cn(
                            "flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition",
                            "disabled:cursor-wait disabled:opacity-70",
                            !areRecentFinishedBooksVisibleToNonFriends
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:bg-secondary/60",
                        )}
                    >
                        {isUpdatingPrivacy && !areRecentFinishedBooksVisibleToNonFriends ? (
                            <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                        ) : (
                            <UsersRound className="size-4 shrink-0" aria-hidden="true" />
                        )}

                        <span className="truncate">Только друзья</span>
                    </button>

                    <button
                        type="button"
                        aria-pressed={areRecentFinishedBooksVisibleToNonFriends}
                        disabled={isUpdatingPrivacy}
                        onClick={() => void handleRecentFinishedBooksVisibilityChange(true)}
                        className={cn(
                            "flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition",
                            "disabled:cursor-wait disabled:opacity-70",
                            areRecentFinishedBooksVisibleToNonFriends
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:bg-secondary/60",
                        )}
                    >
                        {isUpdatingPrivacy && areRecentFinishedBooksVisibleToNonFriends ? (
                            <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                        ) : (
                            <Globe2 className="size-4 shrink-0" aria-hidden="true" />
                        )}

                        <span>Всем</span>
                    </button>
                </div>

                <p className="text-xs leading-5 text-muted-foreground mt-2">
                    Индивидуальные ограничения для друзей сохраняются.
                </p>

                {errorMessage ? (
                    <p
                        role="alert"
                        className={cn(
                            "rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive",
                            "transition-opacity duration-200 motion-reduce:transition-none",
                            isErrorMessageVisible ? "opacity-100" : "opacity-0",
                        )}
                    >
                        {errorMessage}
                    </p>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

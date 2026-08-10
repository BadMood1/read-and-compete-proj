"use client";

import { Check, LoaderCircle, Settings2, UsersRound } from "lucide-react";

import { useFriendsListLibraryAccessSettings } from "@/components/friends/friends-list/friends-list-library-access-settings-context";
import { Button } from "@/components/ui/button";

// Управляет режимом настройки и показывает общее состояние сохранения тумблеров.
export function FriendsListSectionHeader() {
    const {
        isManagingLibraryAccess,
        isAnyLibraryVisibilityUpdatePending,
        toggleLibraryAccessSettings,
    } = useFriendsListLibraryAccessSettings();

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                    <UsersRound className="size-5 text-primary" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                    <h2 id="friends-list-heading" className="text-lg font-semibold tracking-tight">
                        Ваши друзья
                    </h2>
                    <p className="mt-1 min-h-6 text-sm leading-6 text-muted-foreground">
                        {isManagingLibraryAccess
                            ? "Включено — друг видит вашу библиотеку."
                            : "Здесь собраны читатели, с которыми вы уже подружились."}
                    </p>
                </div>
            </div>

            <Button
                type="button"
                variant={isManagingLibraryAccess ? "default" : "outline"}
                className="h-9 w-full shrink-0 rounded-xl px-2 sm:w-auto sm:min-w-46"
                aria-pressed={isManagingLibraryAccess}
                aria-busy={isAnyLibraryVisibilityUpdatePending}
                disabled={isAnyLibraryVisibilityUpdatePending}
                onClick={toggleLibraryAccessSettings}
            >
                {isAnyLibraryVisibilityUpdatePending ? (
                    <>
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                        Сохраняем...
                    </>
                ) : isManagingLibraryAccess ? (
                    <>
                        <Check aria-hidden="true" />
                        Готово
                    </>
                ) : (
                    <>
                        <Settings2 aria-hidden="true" />
                        Настроить доступ
                    </>
                )}
            </Button>
        </div>
    );
}

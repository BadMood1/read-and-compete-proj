"use client";

import { useState } from "react";

import { useFriendsListLibraryAccessSettings } from "@/components/friends/friends-list/friends-list-library-access-settings-context";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { updateCurrentUserLibraryVisibilityForFriend } from "@/lib/friends/library-access/current-user-library-sharing-actions";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";

type FriendLibrarySharingSwitchProps = {
    friendUserId: string;
    friendDisplayName: string;
    initialLibraryVisibilityForFriend: boolean;
};

// Отдельный клиентский компонент нужен только для интерактивного тумблера:
// сама карточка друга продолжает рендериться на сервере.
export function FriendLibrarySharingSwitch({
    friendUserId,
    friendDisplayName,
    initialLibraryVisibilityForFriend,
}: FriendLibrarySharingSwitchProps) {
    const {
        isManagingLibraryAccess,
        startLibraryVisibilityUpdate,
        finishLibraryVisibilityUpdate,
    } = useFriendsListLibraryAccessSettings();
    const [isLibraryVisibleToFriend, setIsLibraryVisibleToFriend] = useState(
        initialLibraryVisibilityForFriend,
    );
    // состояние загрузки
    const [isUpdatingLibraryVisibility, setIsUpdatingLibraryVisibility] = useState(false);

    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    async function handleLibraryVisibilityChange(nextLibraryVisibility: boolean) {
        if (isUpdatingLibraryVisibility) return;

        const previousLibraryVisibility = isLibraryVisibleToFriend;

        setErrorMessage(null);
        setIsLibraryVisibleToFriend(nextLibraryVisibility);
        setIsUpdatingLibraryVisibility(true);
        startLibraryVisibilityUpdate();

        try {
            const result = await updateCurrentUserLibraryVisibilityForFriend(
                friendUserId,
                nextLibraryVisibility,
            );

            if (!result.success) {
                setErrorMessage(result.error);
                setIsLibraryVisibleToFriend(previousLibraryVisibility);
                return;
            }

            setIsLibraryVisibleToFriend(result.isCurrentUserLibraryVisibleToFriend);
        } catch {
            setErrorMessage("Не удалось изменить доступ к библиотеке. Попробуйте ещё раз.");
            setIsLibraryVisibleToFriend(previousLibraryVisibility);
        } finally {
            setIsUpdatingLibraryVisibility(false);
            finishLibraryVisibilityUpdate();
        }
    }
    return (
        <div
            className={cn(
                // Контейнер освобождает место рядом со стрелкой, но больше не обрезает тумблер.
                "relative z-20 h-5 shrink-0 transition-[width,margin-right] duration-200 ease-out motion-reduce:transition-none",
                isManagingLibraryAccess ? "mr-2 w-9" : "mr-0 w-0",
            )}
            aria-hidden={!isManagingLibraryAccess}
        >
            <Switch
                checked={isLibraryVisibleToFriend}
                onCheckedChange={handleLibraryVisibilityChange}
                tabIndex={isManagingLibraryAccess ? 0 : -1}
                aria-label={`Разрешить пользователю ${friendDisplayName} видеть вашу библиотеку`}
                disabled={isUpdatingLibraryVisibility}
                aria-busy={isUpdatingLibraryVisibility}
                className={cn(
                    // Сам тумблер остаётся на месте и плавно затухает без заметной границы обрезки.
                    "absolute top-0 right-0 origin-right transition-[background-color,box-shadow,opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                    isManagingLibraryAccess
                        ? "scale-100 opacity-100"
                        : "pointer-events-none scale-90 opacity-0",
                )}
            />
            {errorMessage ? (
                <p
                    role="alert"
                    className={cn(
                        "pointer-events-none absolute right-0 bottom-[calc(100%+0.5rem)] z-30 w-56 rounded-lg border border-destructive/25 bg-card px-2.5 py-1.5 text-xs text-destructive shadow-md",
                        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                        isErrorMessageVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                    )}
                >
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}

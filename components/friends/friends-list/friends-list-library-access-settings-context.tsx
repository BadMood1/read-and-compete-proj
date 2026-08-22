"use client";

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";

type FriendsListLibraryAccessSettingsContextValue = {
    isManagingLibraryAccess: boolean;
    isAnyLibraryVisibilityUpdatePending: boolean;
    toggleLibraryAccessSettings: () => void;
    startLibraryVisibilityUpdate: () => void;
    finishLibraryVisibilityUpdate: () => void;
};

const FriendsListLibraryAccessSettingsContext =
    createContext<FriendsListLibraryAccessSettingsContextValue | null>(null);

type FriendsListLibraryAccessSettingsProviderProps = {
    children: ReactNode;
};

// Хранит UI-режим всей секции, не превращая серверный запрос друзей в клиентский.
export function FriendsListLibraryAccessSettingsProvider({
    children,
}: FriendsListLibraryAccessSettingsProviderProps) {
    const [isManagingLibraryAccess, setIsManagingLibraryAccess] = useState(false);
    const [pendingLibraryVisibilityUpdateCount, setPendingLibraryVisibilityUpdateCount] = useState(0);

    const isAnyLibraryVisibilityUpdatePending = pendingLibraryVisibilityUpdateCount > 0;

    // Cache Components сохраняет страницу в React Activity при переходе.
    // Cleanup закрывает временный режим настройки, когда /friends становится скрытой.
    useLayoutEffect(() => {
        return () => {
            // регистрирует функцию очистки
            setIsManagingLibraryAccess(false);
        };
    }, []);

    function toggleLibraryAccessSettings() {
        // Не скрываем тумблеры и связанные с ними ошибки, пока сервер сохраняет настройку.
        if (isAnyLibraryVisibilityUpdatePending) {
            return;
        }

        setIsManagingLibraryAccess((currentValue) => !currentValue);
    }

    // Счётчик корректно учитывает одновременное сохранение настроек нескольких друзей.
    function startLibraryVisibilityUpdate() {
        setPendingLibraryVisibilityUpdateCount((currentCount) => currentCount + 1);
    }

    function finishLibraryVisibilityUpdate() {
        setPendingLibraryVisibilityUpdateCount((currentCount) => Math.max(currentCount - 1, 0));
    }

    return (
        <FriendsListLibraryAccessSettingsContext.Provider
            value={{
                isManagingLibraryAccess,
                isAnyLibraryVisibilityUpdatePending,
                toggleLibraryAccessSettings,
                startLibraryVisibilityUpdate,
                finishLibraryVisibilityUpdate,
            }}
        >
            {children}
        </FriendsListLibraryAccessSettingsContext.Provider>
    );
}

// Заголовок и будущие тумблеры используют один режим без передачи пропсов через весь список.
export function useFriendsListLibraryAccessSettings() {
    const context = useContext(FriendsListLibraryAccessSettingsContext);

    if (!context) {
        throw new Error(
            "useFriendsListLibraryAccessSettings должен использоваться внутри FriendsListLibraryAccessSettingsProvider.",
        );
    }

    return context;
}

"use client";

import { useEffect, useState } from "react";

const ERROR_MESSAGE_VISIBLE_DURATION_MS = 4_000;
const ERROR_MESSAGE_TRANSITION_DURATION_MS = 200;

// Хранит ошибку и сам скрывает её, чтобы сообщение не оставалось на экране навсегда.
// По-сути обычный useState, к которому добавлен таймер
export function useAutoDismissErrorMessage(visibleDurationMs = ERROR_MESSAGE_VISIBLE_DURATION_MS) {
    const [errorMessage, setStoredErrorMessage] = useState<string | null>(null);
    const [isErrorMessageVisible, setIsErrorMessageVisible] = useState(false);

    function setErrorMessage(nextErrorMessage: string | null) {
        // Каждое новое сообщение сначала должно появиться из прозрачного состояния.
        setIsErrorMessageVisible(false);
        setStoredErrorMessage(nextErrorMessage);
    }

    useEffect(() => {
        if (!errorMessage) {
            return;
        }

        // --- Плавное появление ---
        // Сообщение уже добавлено в DOM с opacity-0. На следующем кадре включаем opacity-100.
        const showAnimationFrameId = window.requestAnimationFrame(() => {
            setIsErrorMessageVisible(true);
        });

        // --- Плавное исчезновение ---
        // За 200 мс до удаления возвращаем opacity-0, но пока оставляем сообщение в DOM.
        const startHidingTimeoutId = window.setTimeout(() => {
            setIsErrorMessageVisible(false);
        }, Math.max(visibleDurationMs - ERROR_MESSAGE_TRANSITION_DURATION_MS, 0));

        // После CSS-перехода errorMessage становится null, и условный <p> исчезает из JSX.
        const removeMessageTimeoutId = window.setTimeout(() => {
            setStoredErrorMessage(null);
        }, visibleDurationMs);

        // --- Очистка анимации ---
        // Отменяем незавершённые действия, если появилась новая ошибка или компонент закрылся.
        return () => {
            window.cancelAnimationFrame(showAnimationFrameId);
            window.clearTimeout(startHidingTimeoutId);
            window.clearTimeout(removeMessageTimeoutId);
        };
    }, [errorMessage, visibleDurationMs]);

    // as const говорит TypeScript, что это кортеж из трёх конкретных элементов.
    return [errorMessage, setErrorMessage, isErrorMessageVisible] as const;
}

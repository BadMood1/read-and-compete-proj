"use client";

import {
    type SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import type { CurrentUserNotificationsData } from "@/lib/notifications/current-user-notification-queries";

// --- ТИПЫ РЕЗУЛЬТАТА И НАСТРОЙКИ ОБНОВЛЕНИЯ ---

type CurrentUserNotificationsRefreshResult =
    | { success: true }
    | { success: false; error: string };

type RefreshCurrentUserNotificationsOptions = {
    // Открытие панели и переход на другую страницу требуют проверки сразу,
    // даже если фоновое обновление выполнялось совсем недавно.
    ignoreRecentRefresh?: boolean;
};

const BACKGROUND_REFRESH_COOLDOWN_MS = 5_000;

// Пытается взять понятное сообщение из ответа API, но всегда имеет безопасный fallback.
async function getNotificationRefreshErrorMessage(response: Response) {
    try {
        const responseData = (await response.json()) as { error?: unknown };

        return typeof responseData.error === "string"
            ? responseData.error
            : "Не удалось обновить уведомления.";
    } catch {
        return "Не удалось обновить уведомления.";
    }
}

// Хранит актуальные уведомления и собирает все способы их фонового обновления в одном месте.
export function useCurrentUserNotificationsRefresh(
    initialNotificationsData: CurrentUserNotificationsData,
    currentPagePath: string,
) {
    // --- ДАННЫЕ, КОТОРЫЕ ПОКАЗЫВАЮТСЯ В КОЛОКОЛЬЧИКЕ И ПАНЕЛИ ---

    // Сервер передаёт начальный список при первой загрузке, дальше хук поддерживает его свежим.
    const [notificationsData, setNotificationsData] = useState(initialNotificationsData);

    // --- СЛУЖЕБНЫЕ REF, КОТОРЫЕ НЕ НУЖНО ПОКАЗЫВАТЬ В UI ---

    // Запоминает предыдущий путь, чтобы не делать второй запрос сразу после первого рендера.
    const previousPagePathRef = useRef(currentPagePath);

    // Нужен для небольшой паузы между одинаковыми фоновыми сигналами браузера.
    const lastRefreshStartedAtRef = useRef(0);

    // Пока запрос выполняется, остальные причины обновления получают тот же Promise.
    const pendingRefreshPromiseRef =
        useRef<Promise<CurrentUserNotificationsRefreshResult> | null>(null);

    // Позволяет отменить незавершённый fetch, когда пользователь выходит из приложения.
    const refreshAbortControllerRef = useRef<AbortController | null>(null);

    // Версия увеличивается после действий пользователя. Благодаря ей GET, запущенный раньше,
    // не сможет позднее вернуть колокольчик к уже устаревшему состоянию.
    const notificationsDataRevisionRef = useRef(0);

    // Начальные данные только что пришли с сервера, поэтому ближайший фоновый
    // focus-сигнал не должен сразу повторять тот же запрос.
    useEffect(() => {
        lastRefreshStartedAtRef.current = Date.now();
    }, []);

    // --- БЕЗОПАСНОЕ ЛОКАЛЬНОЕ ИЗМЕНЕНИЕ ДАННЫХ ---

    // Панель вызывает эту обёртку после «прочитать», «прочитать всё» или «очистить».
    // Вместе с React-состоянием она обновляет служебную версию данных.
    const updateNotificationsData = useCallback(
        (nextNotificationsData: SetStateAction<CurrentUserNotificationsData>) => {
            notificationsDataRevisionRef.current += 1;
            setNotificationsData(nextNotificationsData);
        },
        [],
    );

    // --- ОСНОВНОЙ ЗАПРОС СВЕЖИХ УВЕДОМЛЕНИЙ ---

    // Эту одну функцию используют навигация, возвращение во вкладку и открытие панели.
    const refreshCurrentUserNotifications = useCallback(
        ({
            ignoreRecentRefresh = false,
        }: RefreshCurrentUserNotificationsOptions = {}): Promise<CurrentUserNotificationsRefreshResult> => {
            // Несколько одновременных причин обновления используют один и тот же HTTP-запрос.
            if (pendingRefreshPromiseRef.current) {
                return pendingRefreshPromiseRef.current;
            }

            const refreshStartedAt = Date.now();

            // focus и visibilitychange часто срабатывают почти одновременно.
            if (
                !ignoreRecentRefresh &&
                refreshStartedAt - lastRefreshStartedAtRef.current < BACKGROUND_REFRESH_COOLDOWN_MS
            ) {
                return Promise.resolve({ success: true });
            }

            lastRefreshStartedAtRef.current = refreshStartedAt;

            // Снимок версии помогает понять, менял ли пользователь данные во время fetch.
            const dataRevisionAtRefreshStart = notificationsDataRevisionRef.current;
            const abortController = new AbortController();
            refreshAbortControllerRef.current = abortController;

            const refreshPromise = (async (): Promise<CurrentUserNotificationsRefreshResult> => {
                try {
                    // Персональные уведомления всегда читаем напрямую с сервера без browser cache.
                    const response = await fetch("/api/notifications", {
                        cache: "no-store",
                        signal: abortController.signal,
                    });

                    if (!response.ok) {
                        return {
                            success: false,
                            error: await getNotificationRefreshErrorMessage(response),
                        };
                    }

                    const freshNotificationsData =
                        (await response.json()) as CurrentUserNotificationsData;

                    // Если за время GET пользователь уже изменил уведомления Server Action,
                    // ответ старого запроса игнорируем и сохраняем более новое локальное состояние.
                    if (notificationsDataRevisionRef.current === dataRevisionAtRefreshStart) {
                        notificationsDataRevisionRef.current += 1;
                        setNotificationsData(freshNotificationsData);
                    }

                    return { success: true };
                } catch (error) {
                    // Фоновые вызовы просто сохранят старые данные. При открытии панели
                    // компонент сам покажет пользователю возвращённое отсюда сообщение.
                    return {
                        success: false,
                        error:
                            error instanceof DOMException && error.name === "AbortError"
                                ? "Обновление уведомлений отменено."
                                : "Не удалось обновить уведомления.",
                    };
                } finally {
                    // После любого исхода следующий триггер снова сможет запустить запрос.
                    pendingRefreshPromiseRef.current = null;

                    if (refreshAbortControllerRef.current === abortController) {
                        refreshAbortControllerRef.current = null;
                    }
                }
            })();

            pendingRefreshPromiseRef.current = refreshPromise;
            return refreshPromise;
        },
        [],
    );

    // --- АВТОМАТИЧЕСКИЕ ПРИЧИНЫ ОБНОВЛЕНИЯ ---

    // 1. Переход между Home, Library, Friends и другими страницами приложения.
    // Общий layout сохраняется между страницами, поэтому отдельно замечаем смену pathname.
    useEffect(() => {
        if (previousPagePathRef.current === currentPagePath) {
            return;
        }

        previousPagePathRef.current = currentPagePath;
        void refreshCurrentUserNotifications({ ignoreRecentRefresh: true });
    }, [currentPagePath, refreshCurrentUserNotifications]);

    // 2. Возврат из другой вкладки или другого приложения обратно на сайт.
    // После возвращения во вкладку проверяем события, созданные во время её неактивности.
    useEffect(() => {
        function refreshNotificationsWhenPageBecomesActive() {
            if (document.visibilityState === "visible") {
                void refreshCurrentUserNotifications();
            }
        }

        window.addEventListener("focus", refreshNotificationsWhenPageBecomesActive);
        document.addEventListener("visibilitychange", refreshNotificationsWhenPageBecomesActive);

        return () => {
            window.removeEventListener("focus", refreshNotificationsWhenPageBecomesActive);
            document.removeEventListener("visibilitychange", refreshNotificationsWhenPageBecomesActive);
        };
    }, [refreshCurrentUserNotifications]);

    // --- ОЧИСТКА ПРИ ЗАКРЫТИИ КОМПОНЕНТА ---

    // При выходе из приложения отменяем незавершённый запрос этой панели.
    useEffect(
        () => () => {
            refreshAbortControllerRef.current?.abort();
        },
        [],
    );

    // --- ТО, ЧТО ХУК ОТДАЁТ ПАНЕЛИ УВЕДОМЛЕНИЙ ---

    return {
        notificationsData,
        updateNotificationsData,
        refreshCurrentUserNotifications,
    };
}

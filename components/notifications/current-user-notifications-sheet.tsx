"use client";

import { Bell, CheckCheck, LoaderCircle, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { type MouseEvent, useRef, useState } from "react";

import { CurrentUserNotificationListItem } from "@/components/notifications/current-user-notification-list-item";
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import {
    deleteCurrentUserReadNotifications,
    markAllCurrentUserNotificationsAsRead,
    markCurrentUserNotificationAsRead,
} from "@/lib/notifications/current-user-notification-actions";
import { createCurrentUserNotificationDestinationPath } from "@/lib/notifications/current-user-notification-navigation";
import type { CurrentUserNotificationsData } from "@/lib/notifications/current-user-notification-queries";
import { cn } from "@/lib/utils";

type CurrentUserNotificationsSheetProps = {
    initialNotificationsData: CurrentUserNotificationsData;
};

const notificationCountFormatter = new Intl.NumberFormat("ru-RU");
const notificationPluralRules = new Intl.PluralRules("ru-RU");

// Формирует подписи «1 непрочитанное», «2 непрочитанных», «5 непрочитанных».
function formatUnreadNotificationsCount(notificationsCount: number) {
    const formattedCount = notificationCountFormatter.format(notificationsCount);

    switch (notificationPluralRules.select(notificationsCount)) {
        case "one":
            return `${formattedCount} непрочитанное уведомление`;
        case "few":
            return `${formattedCount} непрочитанных уведомления`;
        default:
            return `${formattedCount} непрочитанных уведомлений`;
    }
}

// Интерактивная часть панели: локально обновляет список и вызывает Server Actions.
export function CurrentUserNotificationsSheet({
    initialNotificationsData,
}: CurrentUserNotificationsSheetProps) {
    const currentPagePath = usePathname();

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [notificationsData, setNotificationsData] = useState(initialNotificationsData);
    const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeletingReadNotifications, setIsDeletingReadNotifications] = useState(false);
    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    // Не запускаем два одинаковых запроса, если пользователь очень быстро нажал одну строку дважды.
    const pendingNotificationIdsRef = useRef(new Set<string>());

    const hasReadNotifications =
        notificationsData.totalNotificationsCount > notificationsData.unreadNotificationsCount;
    const displayedNotificationsCount = notificationsData.notifications.length;

    function handleSheetOpenChange(shouldOpen: boolean) {
        setIsSheetOpen(shouldOpen);

        if (shouldOpen) {
            setErrorMessage(null);
        }
    }

    // Нажатие сразу закрывает панель и запускает переход. Запись в БД завершается в фоне,
    // поэтому пользователь не ждёт ответа сервера перед открытием нужной страницы.
    function handleNotificationSelect(notificationId: string, isRead: boolean) {
        setIsSheetOpen(false);

        if (isRead || pendingNotificationIdsRef.current.has(notificationId)) {
            return; // запрос уже выполняется
        }

        pendingNotificationIdsRef.current.add(notificationId);

        void markCurrentUserNotificationAsRead(notificationId)
            .then((result) => {
                if (!result.success) {
                    setErrorMessage(result.error);
                    return;
                }

                setNotificationsData((currentData) => ({
                    ...currentData,
                    unreadNotificationsCount: result.unreadNotificationsCount,
                    notifications: currentData.notifications.map((notification) =>
                        notification.id === notificationId ? { ...notification, isRead: true } : notification,
                    ),
                }));
            })
            .catch(() => {
                setErrorMessage("Не удалось отметить уведомление прочитанным.");
            })
            .finally(() => {
                pendingNotificationIdsRef.current.delete(notificationId);
            });
    }

    async function handleMarkAllAsRead() {
        if (isMarkingAllAsRead || notificationsData.unreadNotificationsCount === 0) {
            return;
        }

        setErrorMessage(null);
        setIsMarkingAllAsRead(true);

        try {
            const result = await markAllCurrentUserNotificationsAsRead();

            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }

            // Action уже вернул свежие последние 30, включая параллельно пришедшие события.
            setNotificationsData(result.notificationsData);
        } catch {
            setErrorMessage("Не удалось отметить уведомления прочитанными.");
        } finally {
            setIsMarkingAllAsRead(false);
        }
    }

    function handleDeleteDialogOpenChange(shouldOpen: boolean) {
        if (isDeletingReadNotifications) {
            return;
        }

        setErrorMessage(null);
        setIsDeleteDialogOpen(shouldOpen);
    }

    async function handleDeleteReadNotifications(event: MouseEvent<HTMLButtonElement>) {
        // Не даём AlertDialog закрыться, пока сервер не подтвердит удаление.
        event.preventDefault();

        if (isDeletingReadNotifications) {
            return;
        }

        setErrorMessage(null);
        setIsDeletingReadNotifications(true);

        try {
            const result = await deleteCurrentUserReadNotifications();

            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }

            // Свежий список уже заполнен более старыми записями вместо удалённых.
            setNotificationsData(result.notificationsData);
            setIsDeleteDialogOpen(false);
        } catch {
            setErrorMessage("Не удалось очистить прочитанные уведомления.");
        } finally {
            setIsDeletingReadNotifications(false);
        }
    }

    return (
        <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
            <SheetTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full text-muted-foreground hover:bg-secondary/55 hover:text-primary sm:size-9"
                    aria-label={
                        notificationsData.unreadNotificationsCount > 0
                            ? `Открыть уведомления: ${formatUnreadNotificationsCount(notificationsData.unreadNotificationsCount)}`
                            : "Открыть уведомления"
                    }
                >
                    <Bell aria-hidden="true" />

                    {notificationsData.unreadNotificationsCount > 0 ? (
                        <span
                            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums"
                            aria-hidden="true"
                        >
                            {notificationsData.unreadNotificationsCount > 99
                                ? "99+"
                                : notificationsData.unreadNotificationsCount}
                        </span>
                    ) : null}
                </Button>
            </SheetTrigger>

            <SheetContent className="h-[85dvh]">
                <SheetHeader className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
                    <SheetTitle>Уведомления</SheetTitle>
                    <SheetDescription>
                        {notificationsData.unreadNotificationsCount > 0
                            ? formatUnreadNotificationsCount(notificationsData.unreadNotificationsCount)
                            : "Все уведомления прочитаны"}
                    </SheetDescription>

                    {errorMessage ? (
                        <p
                            role="alert"
                            className={cn(
                                "pt-1 text-sm text-destructive transition-opacity duration-200",
                                isErrorMessageVisible ? "opacity-100" : "opacity-0",
                            )}
                        >
                            {errorMessage}
                        </p>
                    ) : null}
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
                    {notificationsData.notifications.length > 0 ? (
                        <>
                            {notificationsData.totalNotificationsCount > displayedNotificationsCount ? (
                                <p className="px-3 pb-2 text-xs leading-5 text-muted-foreground">
                                    Показаны последние {displayedNotificationsCount} из{" "}
                                    {notificationsData.totalNotificationsCount}.
                                </p>
                            ) : null}

                            <ul className="grid gap-1">
                                {notificationsData.notifications.map((notification) => (
                                    <CurrentUserNotificationListItem
                                        key={notification.id}
                                        notification={notification}
                                        destinationPath={createCurrentUserNotificationDestinationPath(
                                            notification,
                                            currentPagePath,
                                        )}
                                        onSelect={handleNotificationSelect}
                                    />
                                ))}
                            </ul>
                        </>
                    ) : (
                        <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                                <Bell className="size-5" aria-hidden="true" />
                            </span>
                            <p className="mt-3 font-semibold">Уведомлений пока нет</p>
                            <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">
                                Здесь появятся заявки в друзья, их принятие и комментарии к рецензиям.
                            </p>
                        </div>
                    )}
                </div>

                {notificationsData.totalNotificationsCount > 0 ? (
                    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={
                                isMarkingAllAsRead ||
                                isDeletingReadNotifications ||
                                notificationsData.unreadNotificationsCount === 0
                            }
                            aria-busy={isMarkingAllAsRead}
                            aria-label="Прочитать все уведомления"
                            onClick={handleMarkAllAsRead}
                        >
                            {isMarkingAllAsRead ? (
                                <LoaderCircle className="animate-spin" aria-hidden="true" />
                            ) : (
                                <CheckCheck aria-hidden="true" />
                            )}
                            <span className="hidden min-[390px]:inline">
                                {isMarkingAllAsRead ? "Сохраняем..." : "Прочитать все"}
                            </span>
                        </Button>

                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={
                                        !hasReadNotifications ||
                                        isMarkingAllAsRead ||
                                        isDeletingReadNotifications
                                    }
                                    aria-label="Очистить прочитанные уведомления"
                                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 aria-hidden="true" />
                                    <span className="hidden min-[390px]:inline">Очистить прочитанные</span>
                                </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Очистить прочитанные?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Все уже просмотренные уведомления будут удалены навсегда.
                                        Непрочитанные события останутся в панели.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                {errorMessage ? (
                                    <p role="alert" className="text-sm text-destructive">
                                        {errorMessage}
                                    </p>
                                ) : null}

                                <AlertDialogFooter className="grid grid-cols-2 sm:flex">
                                    <AlertDialogCancel disabled={isDeletingReadNotifications}>
                                        Отмена
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        disabled={isDeletingReadNotifications}
                                        aria-busy={isDeletingReadNotifications}
                                        onClick={handleDeleteReadNotifications}
                                    >
                                        {isDeletingReadNotifications ? (
                                            <LoaderCircle className="animate-spin" aria-hidden="true" />
                                        ) : (
                                            <Trash2 aria-hidden="true" />
                                        )}
                                        {isDeletingReadNotifications ? "Удаляем..." : "Очистить"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

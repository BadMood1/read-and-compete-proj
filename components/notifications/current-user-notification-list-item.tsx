"use client";

import { MessageCircle, UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";

import { NotificationType } from "@/app/generated/prisma/enums";
import { UserAvatar } from "@/components/users/user-avatar";
import type { CurrentUserNotificationSummary } from "@/lib/notifications/current-user-notification-queries";
import { getUserDisplayName } from "@/lib/users/user-display-name";
import { cn } from "@/lib/utils";

type CurrentUserNotificationListItemProps = {
    notification: CurrentUserNotificationSummary;
    destinationPath: string;
    onSelect: (notificationId: string, isRead: boolean) => void;
};

const notificationDateFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
});

// Возвращает короткий текст и иконку для каждого вида события.
function getNotificationPresentation(notification: CurrentUserNotificationSummary) {
    const actorDisplayName = getUserDisplayName(notification.actor.name);

    switch (notification.type) {
        case NotificationType.FRIEND_REQUEST_RECEIVED:
            return {
                icon: UserPlus,
                message: (
                    <>
                        Новая заявка в друзья от <strong>{actorDisplayName}</strong>
                    </>
                ),
            };

        case NotificationType.FRIEND_REQUEST_ACCEPTED:
            return {
                icon: UserCheck,
                message: (
                    <>
                        <strong>{actorDisplayName}</strong> теперь у вас в друзьях
                    </>
                ),
            };

        case NotificationType.REVIEW_COMMENT_RECEIVED:
            return {
                icon: MessageCircle,
                message: (
                    <>
                        Новый комментарий от <strong>{actorDisplayName}</strong>
                        {notification.reviewComment ? (
                            <> к рецензии на «{notification.reviewComment.review.book.title}»</>
                        ) : null}
                    </>
                ),
            };
    }
}

// Одна строка целиком является ссылкой: внутри неё нет вложенных кнопок или ссылок.
export function CurrentUserNotificationListItem({
    notification,
    destinationPath,
    onSelect,
}: CurrentUserNotificationListItemProps) {
    const actorDisplayName = getUserDisplayName(notification.actor.name);
    const presentation = getNotificationPresentation(notification);
    const NotificationIcon = presentation.icon;
    const createdAt = new Date(notification.createdAt);

    return (
        <li>
            <Link
                href={destinationPath}
                onClick={() => onSelect(notification.id, notification.isRead)}
                className={cn(
                    "grid grid-cols-[2.5rem_minmax(0,1fr)_2rem] gap-3 rounded-2xl border px-3 py-3.5 transition-colors outline-none",
                    "hover:border-primary/20 hover:bg-secondary/45 focus-visible:ring-2 focus-visible:ring-ring",
                    notification.isRead
                        ? "border-transparent bg-transparent"
                        : "border-primary/15 bg-secondary/30",
                )}
            >
                <UserAvatar
                    displayName={actorDisplayName}
                    imageUrl={notification.actor.image}
                    className="size-10"
                />

                <div className="min-w-0">
                    <p className="text-sm leading-5 text-foreground">{presentation.message}</p>

                    {notification.type === NotificationType.REVIEW_COMMENT_RECEIVED &&
                    notification.reviewComment ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            «{notification.reviewComment.text}»
                        </p>
                    ) : null}

                    <time
                        dateTime={createdAt.toISOString()}
                        className="mt-1.5 block text-xs text-muted-foreground"
                    >
                        {notificationDateFormatter.format(createdAt)}
                    </time>
                </div>

                <span
                    className={cn(
                        "flex size-8 items-center justify-center rounded-xl",
                        notification.isRead
                            ? "bg-muted/70 text-muted-foreground"
                            : "bg-primary/10 text-primary",
                    )}
                >
                    <NotificationIcon className="size-4" aria-hidden="true" />
                    <span className="sr-only">
                        {notification.isRead ? "Прочитано" : "Новое уведомление"}
                    </span>
                </span>
            </Link>
        </li>
    );
}

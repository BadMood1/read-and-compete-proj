import { NotificationType } from "@/app/generated/prisma/enums";
import { createBookDetailsPath } from "@/lib/books/book-details-navigation";
import type { CurrentUserNotificationSummary } from "@/lib/notifications/current-user-notification-queries";
import { createProfilePath } from "@/lib/profile/profile-navigation";

// Выбирает страницу, которую нужно открыть после нажатия на конкретный вид уведомления.
export function createCurrentUserNotificationDestinationPath(
    notification: CurrentUserNotificationSummary,
    currentPagePath: string,
) {
    switch (notification.type) {
        case NotificationType.FRIEND_REQUEST_RECEIVED:
            return "/friends";

        case NotificationType.FRIEND_REQUEST_ACCEPTED:
            return createProfilePath(notification.actor.id);

        case NotificationType.REVIEW_COMMENT_RECEIVED:
            // Связанный комментарий удаляется вместе с уведомлением, но null всё равно
            // обрабатываем защитно на случай некорректных данных в БД.
            if (!notification.reviewComment) {
                return "/";
            }

            return createBookDetailsPath({
                googleBooksId: notification.reviewComment.review.book.googleBooksId,
                returnPath: currentPagePath,
            });

        default:
            return "/";
    }
}

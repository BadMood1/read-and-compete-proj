import "server-only";

import { FriendRequestStatus } from "@/app/generated/prisma/enums";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import {
    CurrentUserFriendLibraryAccessState,
    type CurrentUserFriendLibraryAccessState as CurrentUserFriendLibraryAccessStateValue,
} from "@/lib/friends/library-access/current-user-friend-library-access-state";
import { createFriendshipPairKey } from "@/lib/friends/profile-friendship/create-friendship-pair-key";
import prisma from "@/lib/prisma";

// Определяет, может ли вошедший пользователь открыть библиотеку владельца профиля.
// Проверка намеренно не кэшируется: запрет доступа должен учитываться при следующем запросе.
export async function getCurrentUserFriendLibraryAccessState(
    libraryOwnerUserId: string,
): Promise<CurrentUserFriendLibraryAccessStateValue | null> {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;
    const normalizedLibraryOwnerUserId = libraryOwnerUserId.trim();

    // null означает, что без корректных ID проверку доступа выполнить невозможно.
    if (!currentUserId || !normalizedLibraryOwnerUserId) {
        return null;
    }

    if (currentUserId === normalizedLibraryOwnerUserId) {
        return CurrentUserFriendLibraryAccessState.CURRENT_USER_LIBRARY;
    }

    const friendshipPairKey = createFriendshipPairKey(
        currentUserId,
        normalizedLibraryOwnerUserId,
    );

    const friendship = await prisma.friendRequest.findUnique({
        where: {
            pairKey: friendshipPairKey,
        },
        // Направление определяет, какое из двух независимых разрешений принадлежит владельцу.
        select: {
            senderId: true,
            receiverId: true,
            status: true,
            senderLibraryVisibleToReceiver: true,
            receiverLibraryVisibleToSender: true,
        },
    });

    // Только ACCEPTED представляет дружбу. Ожидающие и отклонённые заявки доступа не дают.
    if (!friendship || friendship.status !== FriendRequestStatus.ACCEPTED) {
        return CurrentUserFriendLibraryAccessState.NOT_FRIENDS;
    }

    let isLibraryVisibleToCurrentUser: boolean;

    if (friendship.senderId === normalizedLibraryOwnerUserId) {
        // Владелец отправлял исходную заявку, поэтому используем разрешение sender -> receiver.
        isLibraryVisibleToCurrentUser = friendship.senderLibraryVisibleToReceiver;
    } else if (friendship.receiverId === normalizedLibraryOwnerUserId) {
        // Владелец получал исходную заявку, поэтому используем разрешение receiver -> sender.
        isLibraryVisibleToCurrentUser = friendship.receiverLibraryVisibleToSender;
    } else {
        // Защита от повреждённой записи, в которой pairKey не соответствует участникам.
        return CurrentUserFriendLibraryAccessState.NOT_FRIENDS;
    }

    return isLibraryVisibleToCurrentUser
        ? CurrentUserFriendLibraryAccessState.FRIEND_LIBRARY_VISIBLE
        : CurrentUserFriendLibraryAccessState.FRIEND_LIBRARY_HIDDEN;
}

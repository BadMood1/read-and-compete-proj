import {
    CurrentUserFriendLibraryAccessState,
    type CurrentUserFriendLibraryAccessState as CurrentUserFriendLibraryAccessStateValue,
} from "@/lib/friends/library-access/current-user-friend-library-access-state";

type CanCurrentUserViewProfileRecentFinishedBooksOptions = {
    currentUserLibraryAccessState: CurrentUserFriendLibraryAccessStateValue;
    areRecentFinishedBooksVisibleToNonFriends: boolean;
};

// Индивидуальный запрет другу важнее общей настройки для пользователей не в друзьях.
export function canCurrentUserViewProfileRecentFinishedBooks({
    currentUserLibraryAccessState,
    areRecentFinishedBooksVisibleToNonFriends,
}: CanCurrentUserViewProfileRecentFinishedBooksOptions): boolean {
    switch (currentUserLibraryAccessState) {
        case CurrentUserFriendLibraryAccessState.CURRENT_USER_LIBRARY:
        case CurrentUserFriendLibraryAccessState.FRIEND_LIBRARY_VISIBLE:
            return true;

        case CurrentUserFriendLibraryAccessState.FRIEND_LIBRARY_HIDDEN:
            return false;

        // PENDING и REJECTED не являются дружбой, поэтому используют общую настройку профиля.
        case CurrentUserFriendLibraryAccessState.NOT_FRIENDS:
            return areRecentFinishedBooksVisibleToNonFriends;
    }
}

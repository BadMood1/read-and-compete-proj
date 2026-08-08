// Все состояния доступа текущего пользователя к библиотеке владельца профиля.
export const CurrentUserFriendLibraryAccessState = {
    // Для собственной библиотеки проверка дружбы и разрешений не нужна.
    CURRENT_USER_LIBRARY: "CURRENT_USER_LIBRARY",
    // Пользователи являются друзьями, и владелец разрешил просмотр.
    FRIEND_LIBRARY_VISIBLE: "FRIEND_LIBRARY_VISIBLE",
    // Дружба существует, но владелец скрыл свою библиотеку от текущего пользователя.
    FRIEND_LIBRARY_HIDDEN: "FRIEND_LIBRARY_HIDDEN",
    // Принятой дружбы нет: заявки PENDING и REJECTED доступ не дают.
    NOT_FRIENDS: "NOT_FRIENDS",
} as const;

// Получаем union строковых значений объекта без отдельного enum и повторения строк.
export type CurrentUserFriendLibraryAccessState =
    (typeof CurrentUserFriendLibraryAccessState)[keyof typeof CurrentUserFriendLibraryAccessState];

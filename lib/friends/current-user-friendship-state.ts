// Все возможные отношения текущего пользователя с владельцем открытого профиля.
// По одному из этих значений клиентский компонент выбирает нужные кнопки.
export const CurrentUserFriendshipState = {
    // Открыт собственный профиль — кнопки дружбы не нужны.
    CURRENT_USER_PROFILE: "CURRENT_USER_PROFILE",
    // Активной заявки и принятой дружбы между пользователями нет.
    NOT_FRIENDS: "NOT_FRIENDS",
    // Текущий пользователь отправил заявку и ждёт ответа.
    OUTGOING_FRIEND_REQUEST: "OUTGOING_FRIEND_REQUEST",
    // Владелец профиля отправил заявку, на которую нужно ответить.
    INCOMING_FRIEND_REQUEST: "INCOMING_FRIEND_REQUEST",
    // Заявка принята, поэтому пользователи уже являются друзьями.
    FRIENDS: "FRIENDS",
} as const;

// Получаем union строковых значений объекта без отдельного enum и дублирования строк.
export type CurrentUserFriendshipState =
    (typeof CurrentUserFriendshipState)[keyof typeof CurrentUserFriendshipState];

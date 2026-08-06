// Возвращает один и тот же ключ независимо от направления заявки:
// createFriendshipPairKey("user-a", "user-b") === createFriendshipPairKey("user-b", "user-a").
// Благодаря длине каждого ID разделители внутри значения не создают неоднозначные ключи.
export function createFriendshipPairKey(firstUserId: string, secondUserId: string) {
    const [lowerUserId, higherUserId] =
        firstUserId < secondUserId
            ? [firstUserId, secondUserId]
            : [secondUserId, firstUserId];

    return `${lowerUserId.length}:${lowerUserId}|${higherUserId.length}:${higherUserId}`;
}

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { FriendLibrarySharingSwitch } from "@/components/friends/friends-list/friend-library-sharing-switch";
import { UserAvatar } from "@/components/users/user-avatar";
import type { CurrentUserFriendSummary } from "@/lib/friends/friends-page/current-user-friends-queries";
import { createProfilePath } from "@/lib/profile/profile-navigation";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type FriendsListUserCardProps = {
    friend: CurrentUserFriendSummary;
};

// Ссылка визуально покрывает карточку, но тумблер остаётся отдельной кнопкой поверх неё.
// Так внутри ссылки не появляется другой интерактивный элемент.
export function FriendsListUserCard({ friend }: FriendsListUserCardProps) {
    const displayName = getUserDisplayName(friend.name);

    return (
        <article className="group relative isolate flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm">
            <UserAvatar
                displayName={displayName}
                imageUrl={friend.image}
                size="lg"
                className="ring-2 ring-secondary/65"
            />

            <div className="min-w-0 flex-1">
                <p className="font-semibold transition-colors group-hover:text-primary">
                    <Link
                        href={createProfilePath(friend.id)}
                        aria-label={`Открыть профиль пользователя ${displayName}`}
                        className="block min-w-0 outline-none after:absolute after:inset-0 after:z-10 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2"
                    >
                        <span className="block truncate">{displayName}</span>
                    </Link>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Открыть профиль</p>
            </div>

            <div className="flex shrink-0 items-center">
                <FriendLibrarySharingSwitch
                    friendUserId={friend.id}
                    friendDisplayName={displayName}
                    initialLibraryVisibilityForFriend={friend.isCurrentUserLibraryVisibleToFriend}
                />

                <ChevronRight
                    className="pointer-events-none size-4 shrink-0 text-muted-foreground transition group-hover:text-primary"
                    aria-hidden="true"
                />
            </div>
        </article>
    );
}

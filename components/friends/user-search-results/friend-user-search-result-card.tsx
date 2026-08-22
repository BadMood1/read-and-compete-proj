import { ChevronRight, Clock3, UserPlus } from "lucide-react";
import Link from "next/link";

import { UserAvatar } from "@/components/users/user-avatar";
import type { FriendsPageUserSearchResult } from "@/lib/friends/friends-page/friends-page-user-search-query";
import { createProfilePath } from "@/lib/profile/profile-navigation";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type FriendUserSearchResultCardProps = {
    user: FriendsPageUserSearchResult;
};

// Показывает одного найденного читателя и ведёт на его профиль.
export function FriendUserSearchResultCard({ user }: FriendUserSearchResultCardProps) {
    const displayName = getUserDisplayName(user.name);

    return (
        <Link
            href={createProfilePath(user.username ?? user.id)}
            aria-label={`Открыть профиль пользователя ${displayName}`}
            className="group flex min-h-16 min-w-0 items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 transition hover:border-primary/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
            <UserAvatar
                displayName={displayName}
                imageUrl={user.image}
                className="ring-1 ring-secondary/65"
            />

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-5 transition-colors group-hover:text-primary">
                    {displayName}

                    {user.username ? (
                        <span className="ml-1.5 font-normal text-muted-foreground">@{user.username}</span>
                    ) : null}
                </p>

                <div className="mt-0.5 min-w-0 text-xs leading-4 text-muted-foreground">
                    {user.hasOutgoingFriendRequest ? (
                        <span className="flex min-w-0 items-center gap-1">
                            <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">Заявка отправлена</span>
                        </span>
                    ) : (
                        <span className="flex min-w-0 items-center gap-1 text-primary">
                            <UserPlus className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">Можно добавить в друзья</span>
                        </span>
                    )}
                </div>
            </div>

            <ChevronRight
                className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                aria-hidden="true"
            />
        </Link>
    );
}

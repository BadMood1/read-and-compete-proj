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
            href={createProfilePath(user.id)}
            aria-label={`Открыть профиль пользователя ${displayName}`}
            className="group flex h-full min-h-20 min-w-0 items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
            <UserAvatar
                displayName={displayName}
                imageUrl={user.image}
                size="lg"
                className="ring-2 ring-secondary/65"
            />

            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold transition-colors group-hover:text-primary">
                    {displayName}
                </p>
                <div className="mt-1 min-h-5 text-xs text-muted-foreground">
                    {user.hasOutgoingFriendRequest ? (
                        <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3.5" aria-hidden="true" />
                            Заявка отправлена
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-primary">
                            <UserPlus className="size-3.5" aria-hidden="true" />
                            Можно добавить в друзья
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

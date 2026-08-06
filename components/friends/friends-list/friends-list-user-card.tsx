import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { UserAvatar } from "@/components/users/user-avatar";
import type { CurrentUserFriendSummary } from "@/lib/friends/friends-page/current-user-friends-queries";
import { createProfilePath } from "@/lib/profile/profile-navigation";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type FriendsListUserCardProps = {
    friend: CurrentUserFriendSummary;
};

// Вся карточка является ссылкой, поэтому открыть профиль удобно и мышкой, и с телефона.
export function FriendsListUserCard({ friend }: FriendsListUserCardProps) {
    const displayName = getUserDisplayName(friend.name);

    return (
        <Link
            href={createProfilePath(friend.id)}
            aria-label={`Открыть профиль пользователя ${displayName}`}
            className="group flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border border-border bg-background p-3 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
            <UserAvatar
                displayName={displayName}
                imageUrl={friend.image}
                size="lg"
                className="ring-2 ring-secondary/65"
            />

            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold transition-colors group-hover:text-primary">
                    {displayName}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Открыть профиль</p>
            </div>

            <ChevronRight
                className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary"
                aria-hidden="true"
            />
        </Link>
    );
}

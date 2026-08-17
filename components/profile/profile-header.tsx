import { LibraryBig, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { ProfileDisplayNameEditor } from "@/components/profile/profile-display-name-editor";
import { ProfileFriendshipControls } from "@/components/profile/profile-friendship-controls";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/users/user-avatar";
import {
    CurrentUserFriendLibraryAccessState,
    type CurrentUserFriendLibraryAccessState as CurrentUserFriendLibraryAccessStateValue,
} from "@/lib/friends/library-access/current-user-friend-library-access-state";
import {
    CurrentUserFriendshipState,
    type CurrentUserFriendshipState as CurrentUserFriendshipStateValue,
} from "@/lib/friends/profile-friendship/current-user-friendship-state";
import { createProfileLibraryPath } from "@/lib/profile/profile-navigation";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type ProfileHeaderProps = {
    profileUserId: string;
    profileDisplayName: string | null;
    profileImageUrl: string | null;
    currentUserFriendshipState: CurrentUserFriendshipStateValue;
    currentUserFriendLibraryAccessState: CurrentUserFriendLibraryAccessStateValue;
};

// Верхний блок знакомит с владельцем профиля и оставляет только актуальное действие.
export function ProfileHeader({
    profileUserId,
    profileDisplayName,
    profileImageUrl,
    currentUserFriendshipState,
    currentUserFriendLibraryAccessState,
}: ProfileHeaderProps) {
    const displayName = getUserDisplayName(profileDisplayName);

    // В своём профиле нужна ссылка на библиотеку, в чужом — управление дружбой.
    const isCurrentUserProfile =
        currentUserFriendshipState === CurrentUserFriendshipState.CURRENT_USER_PROFILE;
    const isCurrentUserFriend =
        currentUserFriendshipState === CurrentUserFriendshipState.FRIENDS;
    const isFriendLibraryVisible =
        currentUserFriendLibraryAccessState ===
        CurrentUserFriendLibraryAccessState.FRIEND_LIBRARY_VISIBLE;
    const isFriendLibraryHidden =
        currentUserFriendLibraryAccessState ===
        CurrentUserFriendLibraryAccessState.FRIEND_LIBRARY_HIDDEN;

    return (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <UserAvatar
                    displayName={displayName}
                    imageUrl={profileImageUrl}
                    className="size-24 ring-4 ring-secondary/70 sm:size-28 **:data-[slot=avatar-fallback]:text-2xl"
                />

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Профиль читателя
                    </p>
                    {isCurrentUserProfile ? (
                        <ProfileDisplayNameEditor initialDisplayName={displayName} />
                    ) : (
                        <>
                            <h1 className="mt-2 wrap-break-word text-3xl font-bold tracking-tight sm:text-4xl">
                                {displayName}
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                                Книжная статистика и последние прочитанные книги.
                            </p>
                        </>
                    )}
                </div>

                {isCurrentUserProfile ? (
                    <Button asChild size="lg" className="h-11 rounded-xl px-4">
                        <Link href="/library">
                            <LibraryBig aria-hidden="true" />
                            Моя библиотека
                        </Link>
                    </Button>
                ) : (
                    // На чужом профиле действия складываются на мобильном и стоят рядом на desktop.
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                        {/* Ссылка доступна только другу, которому владелец открыл библиотеку. */}
                        {isCurrentUserFriend && isFriendLibraryVisible ? (
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="h-11 w-full rounded-xl px-4 sm:w-auto"
                            >
                                <Link href={createProfileLibraryPath(profileUserId)}>
                                    <LibraryBig aria-hidden="true" />
                                    Библиотека
                                </Link>
                            </Button>
                        ) : null}

                        {/* Закрытое состояние объясняет отсутствие доступа, но не является действием. */}
                        {isCurrentUserFriend && isFriendLibraryHidden ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="h-11 w-full rounded-xl px-4 sm:w-auto"
                                disabled
                            >
                                <LockKeyhole aria-hidden="true" />
                                Библиотека закрыта
                            </Button>
                        ) : null}

                        <ProfileFriendshipControls
                            // key сбрасывает локальное состояние кнопок при переходе на другой профиль.
                            key={profileUserId}
                            profileUserId={profileUserId}
                            initialCurrentUserFriendshipState={currentUserFriendshipState}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}

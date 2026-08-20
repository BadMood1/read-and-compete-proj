import { LibraryBig, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { ProfileIdentityEditor } from "@/components/profile/profile-identity-editor";
import { ProfileLinkCopyUsername } from "@/components/profile/profile-link-copy-username";
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
    profileUsername: string | null;
    profileImageUrl: string | null;
    currentUserFriendshipState: CurrentUserFriendshipStateValue;
    currentUserFriendLibraryAccessState: CurrentUserFriendLibraryAccessStateValue;
};

// Верхний блок знакомит с владельцем профиля и оставляет только актуальное действие.
export function ProfileHeader({
    profileUserId,
    profileDisplayName,
    profileUsername,
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
            <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-5 text-left sm:flex sm:gap-5">
                <UserAvatar
                    displayName={displayName}
                    imageUrl={profileImageUrl}
                    className="size-20 ring-4 ring-secondary/70 sm:size-28 **:data-[slot=avatar-fallback]:text-2xl"
                />

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Профиль читателя
                    </p>
                    {isCurrentUserProfile ? (
                        <ProfileIdentityEditor
                            initialDisplayName={displayName}
                            initialUsername={profileUsername ?? ""}
                        />
                    ) : (
                        <>
                            <h1 className="mt-1 wrap-break-word text-2xl font-bold leading-tight tracking-tight sm:mt-2 sm:text-4xl">
                                {displayName}
                            </h1>
                            {profileUsername ? (
                                <div className="mt-1 flex min-w-0">
                                    <ProfileLinkCopyUsername
                                        username={profileUsername}
                                        profileDisplayName={displayName}
                                    />
                                </div>
                            ) : null}
                            <p className="mt-2 hidden text-sm leading-6 text-muted-foreground sm:block sm:text-base">
                                Книжная статистика и последние прочитанные книги.
                            </p>
                        </>
                    )}
                </div>

                {isCurrentUserProfile ? (
                    <Button
                        asChild
                        size="lg"
                        className="col-span-2 h-11 w-full rounded-xl px-4 sm:ml-auto sm:w-auto"
                    >
                        <Link href="/library">
                            <LibraryBig aria-hidden="true" />
                            Моя библиотека
                        </Link>
                    </Button>
                ) : (
                    // На чужом профиле действия складываются на мобильном и стоят рядом на desktop.
                    <div className="col-span-2 flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                        {/* Ссылка доступна только другу, которому владелец открыл библиотеку. */}
                        {isCurrentUserFriend && isFriendLibraryVisible ? (
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="h-11 w-full rounded-xl px-4 sm:w-auto"
                            >
                                <Link
                                    href={createProfileLibraryPath(
                                        profileUsername ?? profileUserId,
                                    )}
                                >
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

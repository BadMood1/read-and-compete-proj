import { notFound, redirect } from "next/navigation";

import { PageBackNavigationLink } from "@/components/navigation/page-back-navigation-link";
import { ProfileHeader, ProfileRecentFinishedBooks, ProfileStatistics } from "@/components/profile";
import { redirectToLoginFromCurrentPage } from "@/lib/auth/current-page-authentication-redirects";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { getCurrentUserFriendLibraryAccessState } from "@/lib/friends/library-access/current-user-friend-library-access-queries";
import { getCurrentUserFriendshipStateWithProfileUser } from "@/lib/friends/profile-friendship/current-user-friendship-queries";
import {
    createProfilePath,
    createProfilePathWithReturnPath,
    getValidatedProfileReturnPath,
} from "@/lib/profile/profile-navigation";
import { getProfileRecentFinishedBooks } from "@/lib/profile/profile-recent-finished-books-query";
import { canCurrentUserViewProfileRecentFinishedBooks } from "@/lib/profile/profile-recent-finished-books-visibility";
import { getUserProfileByIdentifier } from "@/lib/profile/profile-user-query";

type ProfilePageProps = {
    // В Next.js 16 значение динамического сегмента [username] приходит как Promise.
    params: Promise<{
        username: string;
    }>;
    searchParams: Promise<{
        returnPath?: string | string[];
    }>;
};

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
    // Сессия не зависит от параметров страницы, поэтому начинаем получать её сразу.
    const currentSessionPromise = getCurrentSession();
    const [{ username: profileIdentifier }, resolvedSearchParams] = await Promise.all([
        params,
        searchParams,
    ]);

    // Некорректный или внешний returnPath просто не создаст кнопку возврата.
    const profileReturnPath = getValidatedProfileReturnPath(resolvedSearchParams.returnPath);

    // Сессия и публичный профиль не зависят друг от друга, поэтому получаем их одновременно.
    const [profileUser, session] = await Promise.all([
        getUserProfileByIdentifier(profileIdentifier),
        currentSessionPromise,
    ]);

    const currentUserId = session?.user?.id;

    // Layout уже защищает раздел приложения, а локальная проверка сохраняет строгий тип userId.
    if (!currentUserId) {
        return redirectToLoginFromCurrentPage();
    }

    if (!profileUser) {
        notFound();
    }

    const canonicalProfileIdentifier = profileUser.username ?? profileUser.id;

    // Старый URL с user ID не ломаем: временно перенаправляем на актуальный username.
    if (profileIdentifier.trim().toLowerCase() !== canonicalProfileIdentifier) {
        redirect(
            profileReturnPath
                ? createProfilePathWithReturnPath({
                      profileIdentifier: canonicalProfileIdentifier,
                      returnPath: profileReturnPath,
                  })
                : createProfilePath(canonicalProfileIdentifier),
        );
    }

    const [currentUserFriendshipState, currentUserFriendLibraryAccessState] = await Promise.all([
        getCurrentUserFriendshipStateWithProfileUser(profileUser.id),
        getCurrentUserFriendLibraryAccessState(profileUser.id),
    ]);

    // null означает, что запросы не смогли определить текущего пользователя.
    if (currentUserFriendshipState === null || currentUserFriendLibraryAccessState === null) {
        return redirectToLoginFromCurrentPage();
    }

    const canViewRecentFinishedBooks = canCurrentUserViewProfileRecentFinishedBooks({
        currentUserLibraryAccessState: currentUserFriendLibraryAccessState,
        areRecentFinishedBooksVisibleToNonFriends:
            profileUser.recentFinishedBooksVisibleToNonFriends,
    });

    // Закрытые названия книг даже не запрашиваются из БД для текущего зрителя.
    const recentFinishedBooks = canViewRecentFinishedBooks
        ? await getProfileRecentFinishedBooks(profileUser.id)
        : [];

    // Для карточек нужен простой возврат в профиль без бесконечного вложения returnPath.
    const currentProfilePagePath = createProfilePath(canonicalProfileIdentifier);

    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
            <div className="space-y-6">
                {profileReturnPath ? (
                    <PageBackNavigationLink href={profileReturnPath} label="Назад к книге" />
                ) : null}

                <ProfileHeader
                    profileUserId={profileUser.id}
                    profileDisplayName={profileUser.name}
                    profileUsername={profileUser.username}
                    profileImageUrl={profileUser.image}
                    profileRecentFinishedBooksVisibleToNonFriends={
                        profileUser.recentFinishedBooksVisibleToNonFriends
                    }
                    currentUserFriendshipState={currentUserFriendshipState}
                    currentUserFriendLibraryAccessState={currentUserFriendLibraryAccessState}
                />

                <ProfileStatistics statistics={profileUser.statistics} />

                <ProfileRecentFinishedBooks
                    bookDetailsReturnPath={currentProfilePagePath}
                    books={recentFinishedBooks}
                    canViewRecentFinishedBooks={canViewRecentFinishedBooks}
                />
            </div>
        </main>
    );
}

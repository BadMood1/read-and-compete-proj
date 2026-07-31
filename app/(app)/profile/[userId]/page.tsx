import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
    ProfileHeader,
    ProfileRecentFinishedBooks,
    ProfileStatistics,
} from "@/components/profile";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { getValidatedProfileReturnPath } from "@/lib/profile/profile-navigation";
import { getUserProfileById } from "@/lib/profile/profile-user-query";

type ProfilePageProps = {
    // В Next.js 16 значение динамического сегмента [userId] приходит как Promise.
    params: Promise<{
        userId: string;
    }>;
    searchParams: Promise<{
        returnPath?: string | string[];
    }>;
};

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
    // Сессия не зависит от ID профиля, поэтому запускаем обе операции одновременно.
    const currentSessionPromise = getCurrentSession();
    const [{ userId }, resolvedSearchParams] = await Promise.all([params, searchParams]);

    // Некорректный или внешний returnPath просто не создаст кнопку возврата.
    const profileReturnPath = getValidatedProfileReturnPath(resolvedSearchParams.returnPath);

    const [profileUser, session] = await Promise.all([
        getUserProfileById(userId),
        currentSessionPromise,
    ]);

    const currentUserId = session?.user?.id;

    // Layout уже защищает раздел приложения, а локальная проверка сохраняет строгий тип userId.
    if (!currentUserId) {
        redirect("/login");
    }

    if (!profileUser) {
        notFound();
    }

    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
            <div className="space-y-6">
                {profileReturnPath ? (
                    <Link
                        href={profileReturnPath}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Назад к книге
                    </Link>
                ) : null}

                <ProfileHeader
                    profileDisplayName={profileUser.name}
                    profileImageUrl={profileUser.image}
                    isCurrentUserProfile={profileUser.id === currentUserId}
                />

                <ProfileStatistics statistics={profileUser.statistics} />

                <ProfileRecentFinishedBooks
                    profileUserId={profileUser.id}
                    books={profileUser.recentFinishedBooks}
                />
            </div>
        </main>
    );
}

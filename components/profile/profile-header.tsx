import { LibraryBig } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/users/user-avatar";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type ProfileHeaderProps = {
    profileDisplayName: string | null;
    profileImageUrl: string | null;
    isCurrentUserProfile: boolean;
};

// Верхний блок знакомит с владельцем профиля и оставляет только актуальное действие.
export function ProfileHeader({
    profileDisplayName,
    profileImageUrl,
    isCurrentUserProfile,
}: ProfileHeaderProps) {
    const displayName = getUserDisplayName(profileDisplayName);

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
                    <h1 className="mt-2 wrap-break-word text-3xl font-bold tracking-tight sm:text-4xl">
                        {displayName}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                        Книжная статистика и последние прочитанные книги.
                    </p>
                </div>

                {isCurrentUserProfile ? (
                    <Button asChild size="lg" className="h-11 rounded-xl px-4">
                        <Link href="/library">
                            <LibraryBig aria-hidden="true" />
                            Моя библиотека
                        </Link>
                    </Button>
                ) : null}
            </div>
        </section>
    );
}

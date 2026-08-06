"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { IncomingFriendRequestActions } from "@/components/friends/incoming-friend-requests/incoming-friend-request-actions";
import { UserAvatar } from "@/components/users/user-avatar";
import type { CurrentUserIncomingFriendRequestSummary } from "@/lib/friends/friends-page/current-user-incoming-friend-requests-queries";
import { createProfilePath } from "@/lib/profile/profile-navigation";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type IncomingFriendRequestCardProps = {
    sender: CurrentUserIncomingFriendRequestSummary["sender"];
};

// Отделяет переход в профиль от кнопок ответа, чтобы интерактивные элементы не вкладывались друг в друга.
export function IncomingFriendRequestCard({ sender }: IncomingFriendRequestCardProps) {
    const senderDisplayName = getUserDisplayName(sender.name);
    const [isRequestVisible, setIsRequestVisible] = useState(true);

    // Убираем весь list item сразу после ответа, не дожидаясь серверного refresh.
    if (!isRequestVisible) {
        return null;
    }

    function handleRequestResolved() {
        setIsRequestVisible(false);

        // Нажатая кнопка исчезает вместе с карточкой, поэтому сохраняем клавиатурный фокус в секции.
        window.requestAnimationFrame(() => {
            document.getElementById("incoming-friend-requests-heading")?.focus();
        });
    }

    return (
        <li>
            <article className="rounded-2xl border border-border bg-background p-3">
                <Link
                    href={createProfilePath(sender.id)}
                    aria-label={`Открыть профиль пользователя ${senderDisplayName}`}
                    className="group flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <UserAvatar
                        displayName={senderDisplayName}
                        imageUrl={sender.image}
                        size="lg"
                        className="ring-2 ring-secondary/65"
                    />

                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold transition-colors group-hover:text-primary">
                            {senderDisplayName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Хочет добавить вас в друзья
                        </p>
                    </div>

                    <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                        aria-hidden="true"
                    />
                </Link>

                <div className="mt-3">
                    <IncomingFriendRequestActions
                        senderUserId={sender.id}
                        onRequestResolved={handleRequestResolved}
                    />
                </div>
            </article>
        </li>
    );
}

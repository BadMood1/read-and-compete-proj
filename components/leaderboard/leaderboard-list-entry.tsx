import { UserRoundCheck } from "lucide-react";
import Link from "next/link";

import { UserAvatar } from "@/components/users/user-avatar";
import { formatBookCount } from "@/lib/books/book-count-formatting";
import type { LeaderboardMetric, LeaderboardScope } from "@/lib/leaderboard/leaderboard-page-filters";
import type { LeaderboardEntry } from "@/lib/leaderboard/leaderboard-queries";
import { createProfilePath } from "@/lib/profile/profile-navigation";
import { getUserDisplayName } from "@/lib/users/user-display-name";
import { cn } from "@/lib/utils";

type LeaderboardListEntryProps = {
    entry: LeaderboardEntry;
    selectedMetric: LeaderboardMetric;
    selectedScope: LeaderboardScope;
};

const integerNumberFormatter = new Intl.NumberFormat("ru-RU");

type LeaderboardPrizePresentation = {
    rowClassName: string;
    positionClassName: string;
};

// Первые три места получают спокойные золотой, серебряный и бронзовый акценты.
// При одинаковом результате одинаковое место получает одинаковое оформление.
function getLeaderboardPrizePresentation(position: number): LeaderboardPrizePresentation | null {
    if (position === 1) {
        return {
            rowClassName: "border-amber-200/60 bg-amber-50 hover:bg-amber-50/70",
            positionClassName: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
        };
    }

    if (position === 2) {
        return {
            rowClassName: "border-stone-200/70 bg-stone-50/55 hover:bg-stone-50/80",
            positionClassName: "bg-stone-100 text-stone-700 ring-1 ring-stone-200",
        };
    }

    if (position === 3) {
        return {
            rowClassName: "border-orange-200/50 bg-orange-50/35 hover:bg-orange-50/60",
            positionClassName: "bg-orange-100/80 text-orange-800 ring-1 ring-orange-200",
        };
    }

    return null;
}

// Показывает одну позицию рейтинга и её отношение к текущему пользователю.
export function LeaderboardListEntry({ entry, selectedMetric, selectedScope }: LeaderboardListEntryProps) {
    const displayName = getUserDisplayName(entry.user.name);
    const isCurrentUser = entry.relationshipToCurrentUser === "CURRENT_USER";
    const prizePresentation = getLeaderboardPrizePresentation(entry.position);
    // В рейтинге друзей иконка была бы у каждой строки и только создавала визуальный шум.
    const shouldShowFriendIcon = selectedScope === "all" && entry.relationshipToCurrentUser === "FRIEND";

    const primaryMetricValue =
        selectedMetric === "books"
            ? formatBookCount(entry.finishedBooksCount)
            : `${integerNumberFormatter.format(entry.finishedPagesCount)} стр.`;
    const secondaryMetricValue =
        selectedMetric === "books"
            ? `${integerNumberFormatter.format(entry.finishedPagesCount)} стр.`
            : formatBookCount(entry.finishedBooksCount);

    return (
        <li
            className={cn(
                "grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-2 py-3 transition-colors sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:px-3",
                isCurrentUser
                    ? "border-primary/15 bg-secondary/30"
                    : (prizePresentation?.rowClassName ?? "border-transparent hover:bg-muted/45"),
            )}
        >
            <span
                className={cn(
                    "flex size-8 items-center justify-center justify-self-center rounded-full text-sm font-semibold text-muted-foreground tabular-nums",
                    prizePresentation?.positionClassName,
                )}
                title={`${entry.position} место`}
            >
                {entry.position}
            </span>

            {/* Аватар и имя образуют одну ссылку, поэтому в строке нет дублирующих переходов. */}
            <Link
                href={createProfilePath(entry.user.username ?? entry.user.id)}
                aria-label={`Открыть профиль пользователя ${displayName}`}
                className="group flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
                <UserAvatar
                    displayName={displayName}
                    imageUrl={entry.user.image}
                    size="lg"
                    className="ring-2 ring-secondary/65"
                />

                <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-medium transition-colors group-hover:text-primary">
                        {displayName}
                    </span>

                    {shouldShowFriendIcon ? (
                        <span className="inline-flex shrink-0 text-primary/70" title="Ваш друг">
                            <UserRoundCheck className="size-4" aria-hidden="true" />
                            <span className="sr-only">Ваш друг</span>
                        </span>
                    ) : null}

                    {isCurrentUser ? (
                        <span className="shrink-0 rounded-full bg-card/80 px-2 py-0.5 text-[0.7rem] font-semibold text-foreground/70">
                            Вы
                        </span>
                    ) : null}
                </span>
            </Link>

            <div className="shrink-0 text-right">
                <p className="font-semibold whitespace-nowrap tabular-nums">{primaryMetricValue}</p>
                <p className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {secondaryMetricValue}
                </p>
            </div>
        </li>
    );
}

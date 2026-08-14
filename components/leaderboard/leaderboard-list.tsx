import Link from "next/link";

import { LeaderboardListEntry } from "@/components/leaderboard/leaderboard-list-entry";
import {
    LEADERBOARD_SCOPES,
    type LeaderboardPageFilters,
    type LeaderboardScope,
} from "@/lib/leaderboard/leaderboard-page-filters";
import { createLeaderboardPagePath } from "@/lib/leaderboard/leaderboard-navigation";
import type { LeaderboardResults } from "@/lib/leaderboard/leaderboard-queries";
import { cn } from "@/lib/utils";

type LeaderboardListProps = {
    leaderboardResults: LeaderboardResults;
    leaderboardFilters: LeaderboardPageFilters;
    periodDateRange: string;
};

const LEADERBOARD_SCOPE_LABELS: Record<LeaderboardScope, string> = {
    all: "Все",
    friends: "Друзья",
};

// Собирает фильтр состава, период и готовые строки рейтинга в одну секцию.
export function LeaderboardList({
    leaderboardResults,
    leaderboardFilters,
    periodDateRange,
}: LeaderboardListProps) {
    const { selectedMetric, selectedPeriod, selectedScope } = leaderboardFilters;
    const { entries, totalParticipantsCount, currentUserEntryOutsideLimit } =
        leaderboardResults;

    return (
        <section
            aria-labelledby="leaderboard-list-heading"
            className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5"
        >
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 id="leaderboard-list-heading" className="sr-only">
                        Участники
                    </h2>

                    {/* Scope меняет состав участников, сохраняя метрику и период. */}
                    <nav
                        aria-label="Состав участников рейтинга"
                        className="grid w-44 grid-cols-2 rounded-xl bg-muted p-1"
                    >
                        {LEADERBOARD_SCOPES.map((scope) => {
                            const isCurrentScope = scope === selectedScope;

                            return (
                                <Link
                                    key={scope}
                                    href={createLeaderboardPagePath({
                                        selectedMetric,
                                        selectedPeriod,
                                        selectedScope: scope,
                                    })}
                                    aria-current={isCurrentScope ? "page" : undefined}
                                    className={cn(
                                        "rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
                                        isCurrentScope
                                            ? "bg-card text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {LEADERBOARD_SCOPE_LABELS[scope]}
                                </Link>
                            );
                        })}
                    </nav>

                    <p className="mt-2 text-sm text-muted-foreground">{periodDateRange}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                    Всего: {totalParticipantsCount}
                </p>
            </div>

            {totalParticipantsCount === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                    В рейтинге пока нет участников.
                </p>
            ) : (
                <ul className="mt-4 space-y-1 border-t border-border pt-2">
                    {entries.map((entry) => (
                        <LeaderboardListEntry
                            key={entry.user.id}
                            entry={entry}
                            selectedMetric={selectedMetric}
                            selectedScope={selectedScope}
                        />
                    ))}

                    {currentUserEntryOutsideLimit ? (
                        <>
                            <li
                                className="px-2 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                aria-hidden="true"
                            >
                                Ваша позиция
                            </li>
                            <LeaderboardListEntry
                                entry={currentUserEntryOutsideLimit}
                                selectedMetric={selectedMetric}
                                selectedScope={selectedScope}
                            />
                        </>
                    ) : null}
                </ul>
            )}
        </section>
    );
}

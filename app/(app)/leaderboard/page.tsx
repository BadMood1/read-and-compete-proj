import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
      <p className="text-sm font-semibold text-primary">Leaderboard</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
        Рейтинг читателей
      </h1>

      <div className="mt-10 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/45 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
          <Trophy className="size-5 text-primary" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-semibold">Рейтинг появится позже</h2>
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
          Сначала наполним библиотеки, затем сравним прочитанные книги и страницы.
        </p>
      </div>
    </main>
  );
}

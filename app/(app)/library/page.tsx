import { LibraryBig } from "lucide-react";

export default function LibraryPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold text-primary">Library</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
        Моя библиотека
      </h1>

      <div className="mt-10 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/45 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
          <LibraryBig className="size-5 text-primary" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-semibold">Библиотека пока пустая</h2>
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
          Здесь появятся сохранённые книги и фильтры по статусу чтения.
        </p>
      </div>
    </main>
  );
}

import { BookOpen } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { SignInButton } from "@/components/auth-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Сразу показывает skeleton, пока сервер проверяет текущую сессию.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

// Динамическая часть страницы: auth() выполняется только во время запроса.
async function LoginPageContent() {
  const session = await auth();

  // Уже авторизованному пользователю страница входа не нужна.
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-secondary p-10 lg:flex lg:flex-col xl:p-16">
        <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span className="flex size-10 items-center justify-center rounded-xl bg-background shadow-sm">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span>
            read<span className="text-primary">&amp;</span>compete
          </span>
        </div>

        <div className="my-auto max-w-2xl py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Читайте вместе
          </p>
          <h1 className="mt-5 text-6xl font-semibold leading-[0.98] tracking-[-0.045em] xl:text-7xl">
            Читайте больше.
            <br />
            Делитесь прочитанным.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-foreground/65">
            Собирайте личную библиотеку, отмечайте прочитанное и следите за тем,
            что выбирают друзья.
          </p>
        </div>

        <p className="text-sm text-foreground/55">
          Ваше следующее книжное соревнование начинается здесь.
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <Card
          id="login"
          className="w-full max-w-md rounded-3xl border border-border bg-card shadow-[0_24px_70px_rgba(50,35,25,0.10)]"
        >
          <CardHeader className="px-6 pt-3 text-center sm:px-8">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-secondary lg:hidden">
              <BookOpen className="size-5 text-primary" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              Войти в аккаунт
            </CardTitle>
            <CardDescription className="mt-1 leading-6">
              Выберите удобный способ. Если аккаунта ещё нет, он создастся
              автоматически.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 px-6 sm:px-8">
            <SignInButton provider="github" />
            <SignInButton provider="google" />
          </CardContent>

          <CardFooter className="justify-center border-0 bg-transparent px-6 pb-3 text-center text-xs text-muted-foreground sm:px-8">
            Мы не храним пароли — вход обрабатывают GitHub и Google.
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

// Повторяет адаптивную структуру login-страницы и предотвращает скачок интерфейса.
function LoginPageSkeleton() {
  return (
    <main
      className="grid min-h-svh animate-pulse lg:grid-cols-[1.1fr_0.9fr]"
      role="status"
      aria-label="Проверка авторизации"
    >
      {/* На больших экранах сохраняем место под информационную часть страницы. */}
      <section className="relative hidden overflow-hidden bg-secondary p-10 lg:flex lg:flex-col xl:p-16">
        <div className="flex items-center gap-3">
          <span className="size-10 rounded-xl bg-background/75" />
          <span className="h-5 w-36 rounded-md bg-background/75" />
        </div>

        <div className="my-auto max-w-2xl space-y-5 py-16">
          <div className="h-3 w-32 rounded-full bg-background/70" />
          {/* Три тонкие строки учитывают перенос длинной части настоящего заголовка. */}
          <div className="space-y-4 py-4">
            <div className="h-8 w-full max-w-xl rounded-lg bg-background/70" />
            <div className="h-8 w-3/5 max-w-sm rounded-lg bg-background/70" />
            <div className="h-8 w-5/6 max-w-lg rounded-lg bg-background/70" />
          </div>
          <div className="h-5 w-full max-w-lg rounded-md bg-background/60" />
          <div className="h-5 w-3/4 max-w-md rounded-md bg-background/60" />
        </div>

        <div className="h-4 w-80 rounded-md bg-background/60" />
      </section>

      {/* На мобильных остаётся только заглушка карточки входа по центру. */}
      <section className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        {/* Используем настоящую структуру Card, чтобы skeleton совпадал с ней по высоте. */}
        <Card className="w-full max-w-md rounded-3xl border border-border bg-card shadow-[0_24px_70px_rgba(50,35,25,0.10)]">
          <CardHeader className="px-6 pt-3 text-center sm:px-8">
            <div className="mx-auto mb-3 size-11 rounded-2xl bg-secondary lg:hidden" />
            <div className="mx-auto h-8 w-48 rounded-md bg-muted" />
            <div className="mt-1 space-y-2">
              <div className="mx-auto h-5 w-full max-w-xs rounded-md bg-muted" />
              <div className="mx-auto h-5 w-4/5 max-w-64 rounded-md bg-muted" />
            </div>
          </CardHeader>

          <CardContent className="space-y-3 px-6 sm:px-8">
            <div className="h-11 w-full rounded-xl bg-muted" />
            <div className="h-11 w-full rounded-xl bg-muted" />
          </CardContent>

          <CardFooter className="justify-center border-0 bg-transparent px-6 pb-3 sm:px-8">
            <div className="h-4 w-64 max-w-full rounded-md bg-muted" />
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

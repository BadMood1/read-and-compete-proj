import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Политика конфиденциальности | read&compete",
  description:
    "Как read&compete получает, использует и защищает данные пользователей.",
};

const POLICY_UPDATED_AT = "21 августа 2026 года";

const sectionHeadingClassName =
  "text-xl font-semibold tracking-tight text-foreground sm:text-2xl";
const sectionTextClassName = "mt-3 leading-7 text-foreground/70";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Простая публичная шапка: для просмотра политики авторизация не нужна. */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/login"
            className="group flex items-center gap-3 font-semibold tracking-tight"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary shadow-sm transition-transform group-hover:-rotate-3">
              <BookOpen className="size-5 text-primary" aria-hidden="true" />
            </span>
            <span>
              read<span className="text-primary">&amp;</span>compete
            </span>
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-2 text-sm font-medium text-foreground/65 transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Ко входу
          </Link>
        </header>

        <article className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8 lg:p-10">
          <header className="border-b border-border pb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
              Правовая информация
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
              Политика конфиденциальности
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Последнее обновление: {POLICY_UPDATED_AT}
            </p>
            <p className="mt-5 max-w-3xl leading-7 text-foreground/70">
              Эта политика объясняет, какие данные использует книжный сервис
              read&amp;compete, зачем они нужны и кому могут быть видны. Используя
              сервис, вы соглашаетесь с описанной здесь обработкой данных.
            </p>
          </header>

          <div className="mt-8 space-y-9">
            <section aria-labelledby="policy-data">
              <h2 id="policy-data" className={sectionHeadingClassName}>
                1. Какие данные мы получаем
              </h2>
              <p className={sectionTextClassName}>
                При входе через Google или GitHub сервис получает данные,
                предоставленные выбранным OAuth-провайдером: идентификатор
                аккаунта, имя, адрес электронной почты и аватар. Пароль от Google
                или GitHub сервис не получает и не хранит.
              </p>
              <p className={sectionTextClassName}>
                Для работы авторизации могут храниться технические данные
                OAuth-подключения, токены провайдера и данные сессии. Также мы
                сохраняем информацию, которую вы создаёте в сервисе:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-foreground/70 marker:text-primary">
                <li>отображаемое имя, username и аватар;</li>
                <li>книги, статусы чтения и настройки библиотеки;</li>
                <li>оценки, рецензии, комментарии, лайки и дизлайки;</li>
                <li>заявки в друзья и настройки доступа для друзей;</li>
                <li>уведомления о действиях внутри сервиса.</li>
              </ul>
            </section>

            <section aria-labelledby="policy-purpose">
              <h2 id="policy-purpose" className={sectionHeadingClassName}>
                2. Для чего нужны данные
              </h2>
              <p className={sectionTextClassName}>
                Данные используются только для входа в аккаунт и работы функций
                read&amp;compete: ведения библиотеки, профиля и рейтинга читателей,
                общения с друзьями, публикации рецензий и показа уведомлений. Мы
                не продаём пользовательские данные и не используем их для
                сторонней рекламы.
              </p>
            </section>

            <section aria-labelledby="policy-visibility">
              <h2 id="policy-visibility" className={sectionHeadingClassName}>
                3. Что видят другие пользователи
              </h2>
              <p className={sectionTextClassName}>
                Имя, username, аватар, публичная статистика, оценки, рецензии,
                комментарии и реакции могут быть видны другим пользователям
                сервиса. Доступ друзей к содержимому вашей библиотеки зависит от
                выбранной вами настройки. Адрес электронной почты и технические
                данные авторизации другим пользователям не показываются.
              </p>
            </section>

            <section aria-labelledby="policy-services">
              <h2 id="policy-services" className={sectionHeadingClassName}>
                4. Сторонние сервисы
              </h2>
              <p className={sectionTextClassName}>
                Для работы проекта используются Google и GitHub для входа,
                Google Books для получения информации о книгах, Neon для хранения
                базы данных и Vercel для размещения приложения. Эти сервисы могут
                обрабатывать технические данные в соответствии со своими
                политиками конфиденциальности.
              </p>
            </section>

            <section aria-labelledby="policy-cookies">
              <h2 id="policy-cookies" className={sectionHeadingClassName}>
                5. Cookies и сессия
              </h2>
              <p className={sectionTextClassName}>
                Сервис использует необходимые cookies, чтобы сохранить вход в
                аккаунт, защитить авторизацию и вернуть пользователя на нужную
                страницу. Они не применяются для рекламного отслеживания.
              </p>
            </section>

            <section aria-labelledby="policy-storage">
              <h2 id="policy-storage" className={sectionHeadingClassName}>
                6. Хранение и удаление данных
              </h2>
              <p className={sectionTextClassName}>
                Данные хранятся, пока аккаунт и сервис существуют либо пока они
                нужны для описанных функций. Чтобы запросить удаление аккаунта и
                связанных с ним данных, свяжитесь с разработчиком. После удаления
                аккаунта общие сведения о книгах, импортированные из Google Books,
                могут остаться в каталоге без связи с вашим профилем.
              </p>
            </section>

            <section aria-labelledby="policy-security">
              <h2 id="policy-security" className={sectionHeadingClassName}>
                7. Защита данных
              </h2>
              <p className={sectionTextClassName}>
                Мы используем OAuth-вход, серверные проверки доступа и разумные
                технические меры для защиты данных. При этом ни один способ
                хранения и передачи данных через интернет не может гарантировать
                абсолютную безопасность.
              </p>
            </section>

            <section aria-labelledby="policy-changes">
              <h2 id="policy-changes" className={sectionHeadingClassName}>
                8. Изменения и связь
              </h2>
              <p className={sectionTextClassName}>
                Политика может обновляться вместе с развитием проекта. Актуальная
                версия и дата изменения всегда публикуются на этой странице.
                Вопросы о данных или запрос на их удаление можно направить
                разработчику через профиль{" "}
                <a
                  href="https://github.com/BadMood1"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/75"
                >
                  BadMood1 на GitHub
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
                . Не отправляйте OAuth-токены, cookies и другие секретные данные.
              </p>
            </section>
          </div>

          <footer className="mt-10 border-t border-border pt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/35 hover:text-primary"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Вернуться ко входу
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}

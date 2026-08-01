import { BookOpen, LogOut, UserRound } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/auth";
import { NavLinks } from "@/components/nav-links";
import { UserAvatar } from "@/components/users/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createProfilePath } from "@/lib/profile/profile-navigation";
import { getUserDisplayName } from "@/lib/users/user-display-name";

type NavbarUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function Navbar({ user }: { user: NavbarUser }) {
  const displayName = getUserDisplayName(user.name);
  // В интерфейсе сразу используем публичный URL, не заходя через redirect /profile.
  const profilePath = createProfilePath(user.id);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-card/90 shadow-[0_5px_24px_rgba(48,36,28,0.07)] backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary transition-transform group-hover:-rotate-3">
            <BookOpen
              className="size-4.5 text-primary"
              aria-hidden="true"
            />
          </span>
          <span className="hidden text-lg tracking-[-0.035em] sm:inline">
            read<span className="text-primary">&amp;</span>compete
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NavLinks />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full outline-none ring-offset-2 ring-offset-background transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Открыть меню пользователя"
              >
                <UserAvatar
                  displayName={displayName}
                  imageUrl={user.image}
                  className="size-9"
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <p className="truncate text-sm font-semibold">{displayName}</p>
                {user.email ? (
                  <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </p>
                ) : null}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href={profilePath}>
                  <UserRound aria-hidden="true" />
                  Профиль
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <form
                action={async () => {
                  "use server";

                  await signOut({ redirectTo: "/login" });
                }}
              >
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    <LogOut aria-hidden="true" />
                    Выйти
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}

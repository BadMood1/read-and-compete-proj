import { LogOut } from "lucide-react";

import { signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

type OAuthProvider = "github" | "google";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 7.7c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.56 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 12.2c0-.64-.06-1.25-.16-1.84H12v3.48h5.25a4.49 4.49 0 0 1-1.95 2.94v2.26h3.16c1.85-1.7 2.89-4.22 2.89-6.84Z"
      />
      <path
        fill="currentColor"
        d="M12 21.75c2.64 0 4.86-.88 6.48-2.38l-3.16-2.26c-.88.59-2 .94-3.32.94-2.55 0-4.71-1.72-5.48-4.03H3.26v2.34A9.79 9.79 0 0 0 12 21.75Z"
        opacity=".8"
      />
      <path
        fill="currentColor"
        d="M6.52 14.02A5.9 5.9 0 0 1 6.21 12c0-.7.12-1.38.31-2.02V7.64H3.26A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.01 4.36l3.26-2.34Z"
        opacity=".6"
      />
      <path
        fill="currentColor"
        d="M12 5.95c1.44 0 2.73.49 3.75 1.46l2.81-2.81A9.43 9.43 0 0 0 12 2.25a9.79 9.79 0 0 0-8.74 5.39l3.26 2.34C7.29 7.67 9.45 5.95 12 5.95Z"
        opacity=".9"
      />
    </svg>
  );
}

const providerContent = {
  github: {
    label: "Продолжить с GitHub",
    icon: <GitHubIcon />,
  },
  google: {
    label: "Продолжить с Google",
    icon: <GoogleIcon />,
  },
} satisfies Record<OAuthProvider, { label: string; icon: React.ReactNode }>;

export function SignInButton({ provider }: { provider: OAuthProvider }) {
  const content = providerContent[provider];

  return (
    <form
      action={async () => {
        "use server";

        // Auth.js сам создаст OAuth URL и обработает callback провайдера.
        await signIn(provider, { redirectTo: "/" });
      }}
    >
      <Button
        type="submit"
        variant={provider === "github" ? "default" : "outline"}
        size="lg"
        className="w-full"
      >
        {content.icon}
        {content.label}
      </Button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";

        // Удаляем текущую сессию и возвращаем пользователя на главную.
        await signOut({ redirectTo: "/" });
      }}
      className="w-full"
    >
      <Button type="submit" variant="outline" size="lg" className="w-full">
        <LogOut />
        Выйти
      </Button>
    </form>
  );
}

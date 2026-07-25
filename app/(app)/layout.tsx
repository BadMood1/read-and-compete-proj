import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // Все страницы этой группы доступны только авторизованным пользователям.
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar user={session.user} />
      {children}
    </div>
  );
}

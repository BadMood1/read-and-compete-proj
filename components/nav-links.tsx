"use client";

import { House, LibraryBig, Trophy, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
    { href: "/", label: "Home", icon: House },
    { href: "/library", label: "Library", icon: LibraryBig },
    { href: "/friends", label: "Friends", icon: UsersRound },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function NavLinks() {
    const pathname = usePathname();

    return (
        <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;

                return (
                    <Link
                        key={href}
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={label}
                        className={cn(
                            "flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium transition-colors",
                            "hover:bg-secondary/55 hover:text-primary",
                            isActive ? "bg-secondary/70 text-foreground" : "text-muted-foreground",
                        )}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                        <span className="hidden md:inline">{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

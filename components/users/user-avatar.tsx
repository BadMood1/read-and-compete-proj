"use client";

import Image from "next/image";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserDisplayName } from "@/lib/users/user-display-name";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
    displayName: string;
    imageUrl?: string | null;
    size?: "default" | "sm" | "lg";
    className?: string;
};

function getUserInitials(displayName: string) {
    return (
        displayName
            .split(/\s+/)
            .map((namePart) => namePart[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "RC"
    );
}

// Один компонент отвечает и за оптимизированное изображение, и за fallback с инициалами.
export function UserAvatar({
    displayName,
    imageUrl,
    size = "default",
    className,
}: UserAvatarProps) {
    const normalizedDisplayName = getUserDisplayName(displayName);
    const normalizedImageUrl = imageUrl?.trim() || null;

    // Запоминаем URL, который не загрузился, чтобы не повторять его до смены изображения.
    const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
    const shouldShowImage =
        normalizedImageUrl !== null && normalizedImageUrl !== failedImageUrl;

    return (
        <Avatar size={size} className={cn("overflow-hidden", className)}>
            {/* Инициалы остаются под изображением и видны во время загрузки или после ошибки. */}
            <AvatarFallback>{getUserInitials(normalizedDisplayName)}</AvatarFallback>

            {shouldShowImage ? (
                <Image
                    src={normalizedImageUrl}
                    alt={`Аватар пользователя ${normalizedDisplayName}`}
                    width={96}
                    height={96}
                    className="absolute inset-0 z-10 size-full object-cover"
                    onError={() => setFailedImageUrl(normalizedImageUrl)}
                />
            ) : null}
        </Avatar>
    );
}

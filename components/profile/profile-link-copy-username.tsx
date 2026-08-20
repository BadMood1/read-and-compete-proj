"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { useState } from "react";

import { Toast, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { createProfilePath } from "@/lib/profile/profile-navigation";
import { cn } from "@/lib/utils";

type ProfileLinkCopyUsernameProps = {
    username: string;
    profileDisplayName: string;
};

type ProfileLinkCopyResult = "success" | "error";

// Сам @username копирует каноническую ссылку профиля и подтверждает действие toast-уведомлением.
export function ProfileLinkCopyUsername({
    username,
    profileDisplayName,
}: ProfileLinkCopyUsernameProps) {
    const [copyResult, setCopyResult] = useState<ProfileLinkCopyResult>("success");
    const [isToastOpen, setIsToastOpen] = useState(false);

    function showCopyResultToast(result: ProfileLinkCopyResult) {
        // Короткое закрытие позволяет повторному нажатию заново запустить время показа toast.
        setIsToastOpen(false);
        setCopyResult(result);
        window.requestAnimationFrame(() => setIsToastOpen(true));
    }

    async function handleCopyProfileLink() {
        // Origin берём из браузера: ссылка автоматически подходит и localhost, и production-домену.
        const profileUrl = new URL(createProfilePath(username), window.location.origin).toString();

        try {
            await navigator.clipboard.writeText(profileUrl);
            showCopyResultToast("success");
        } catch {
            showCopyResultToast("error");
        }
    }

    const hasCopiedSuccessfully = copyResult === "success";

    return (
        <ToastProvider swipeDirection="up">
            <button
                type="button"
                className="min-w-0 truncate rounded-md text-left text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={`Скопировать ссылку на профиль ${profileDisplayName}`}
                title="Скопировать ссылку на профиль"
                onClick={() => void handleCopyProfileLink()}
            >
                @{username}
            </button>

            <Toast
                open={isToastOpen}
                onOpenChange={setIsToastOpen}
                duration={2500}
                className={cn(!hasCopiedSuccessfully && "border-destructive/25")}
            >
                {hasCopiedSuccessfully ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                ) : (
                    <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                )}
                <ToastTitle>
                    {hasCopiedSuccessfully
                        ? "Ссылка на профиль скопирована"
                        : "Не удалось скопировать ссылку"}
                </ToastTitle>
            </Toast>

            <ToastViewport />
        </ToastProvider>
    );
}

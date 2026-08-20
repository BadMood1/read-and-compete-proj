"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// Небольшие обёртки сохраняют доступное поведение Radix и единый внешний вид проекта.
function ToastProvider(props: React.ComponentProps<typeof ToastPrimitive.Provider>) {
    return <ToastPrimitive.Provider data-slot="toast-provider" {...props} />;
}

function Toast({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Root>) {
    return (
        <ToastPrimitive.Root
            data-slot="toast"
            className={cn(
                "pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-lg",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2",
                className,
            )}
            {...props}
        />
    );
}

function ToastTitle({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
    return (
        <ToastPrimitive.Title
            data-slot="toast-title"
            className={cn("font-medium", className)}
            {...props}
        />
    );
}

// Viewport закрепляет уведомления сверху по центру и не занимает место в разметке страницы.
function ToastViewport({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
    return (
        <ToastPrimitive.Viewport
            data-slot="toast-viewport"
            className={cn(
                "pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 outline-none",
                className,
            )}
            {...props}
        />
    );
}

export { Toast, ToastProvider, ToastTitle, ToastViewport };

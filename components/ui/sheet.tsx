"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// Sheet использует доступное модальное поведение Radix, но выглядит как выезжающая панель.
// Тонкие обёртки ниже сохраняют API Radix и добавляют единые data-slot для стилизации.
function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
    return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
    return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal(props: React.ComponentProps<typeof SheetPrimitive.Portal>) {
    return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
    // Затемняет страницу и принимает клик вне панели, по которому Radix закроет Sheet.
    return (
        <SheetPrimitive.Overlay
            data-slot="sheet-overlay"
            className={cn(
                "fixed inset-0 z-50 bg-black/45",
                // Radix меняет data-state, а Tailwind по нему запускает анимацию появления или закрытия.
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                className,
            )}
            {...props}
        />
    );
}

function SheetContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Content>) {
    // Portal переносит overlay и панель к document.body, поэтому их не обрежут родительские блоки.
    return (
        <SheetPortal>
            <SheetOverlay />

            <SheetPrimitive.Content
                data-slot="sheet-content"
                className={cn(
                    // На телефоне панель поднимается снизу и занимает не больше 85% высоты экрана.
                    "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] min-h-0 w-full flex-col rounded-t-3xl border border-b-0 border-border bg-background shadow-xl outline-none",
                    // Те же data-state управляют направлением и длительностью движения самой панели.
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-300 data-[state=closed]:duration-200 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
                    // Начиная с tablet панель меняет направление и выезжает справа.
                    "md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:max-h-none md:max-w-[30rem] md:rounded-none md:rounded-l-3xl md:border-y-0 md:border-r-0 md:border-l",
                    "md:data-[state=open]:slide-in-from-right md:data-[state=closed]:slide-out-to-right md:[--tw-enter-translate-y:0] md:[--tw-exit-translate-y:0]",
                    className,
                )}
                {...props}
            >
                {/* Close стоит первым в tab-порядке, чтобы открытие панели не вызывало клавиатуру телефона. */}
                <SheetPrimitive.Close
                    className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                    <X className="size-4" aria-hidden="true" />
                    <span className="sr-only">Закрыть</span>
                </SheetPrimitive.Close>

                {children}
            </SheetPrimitive.Content>
        </SheetPortal>
    );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot="sheet-header" className={cn("grid gap-1.5", className)} {...props} />;
}

// Title и Description — не просто стили: Radix связывает их с модальным окном для доступности.
function SheetTitle({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
    return (
        <SheetPrimitive.Title
            data-slot="sheet-title"
            className={cn("pr-10 text-lg font-semibold", className)}
            {...props}
        />
    );
}

function SheetDescription({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
    return (
        <SheetPrimitive.Description
            data-slot="sheet-description"
            className={cn("text-sm leading-6 text-muted-foreground", className)}
            {...props}
        />
    );
}

export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger };

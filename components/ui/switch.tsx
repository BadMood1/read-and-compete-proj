"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// Базовый переключатель: Radix отвечает за клавиатуру и aria-состояние,
// а этот компонент задаёт единый внешний вид проекта.
function Switch({
    className,
    ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                // Без внутренней рамки ползунок получает одинаковые отступы в обоих состояниях.
                "group/switch inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 shadow-sm outline-none",
                "transition-[background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
                "focus-visible:ring-3 focus-visible:ring-ring/35",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "data-[state=checked]:bg-primary data-[state=checked]:hover:bg-primary/90",
                "data-[state=unchecked]:bg-input data-[state=unchecked]:hover:bg-muted-foreground/35",
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    "pointer-events-none block size-4 rounded-full bg-card shadow-sm",
                    "transition-transform duration-200 ease-out motion-reduce:transition-none",
                    "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
                )}
            />
        </SwitchPrimitive.Root>
    );
}

export { Switch };

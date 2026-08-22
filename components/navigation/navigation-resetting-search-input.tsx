"use client";

import { type ComponentPropsWithoutRef, useLayoutEffect, useRef } from "react";

type NavigationResettingSearchInputProps = ComponentPropsWithoutRef<"input">;

// Сохраняет подтверждённый запрос из defaultValue, но удаляет неотправленный черновик
// в момент, когда Next.js скрывает текущую страницу через React Activity.
export function NavigationResettingSearchInput(props: NavigationResettingSearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        const input = inputRef.current;

        return () => {
            if (input) {
                input.value = input.defaultValue; // очистка при уходе со страницы
            }
        };
    }, []);

    return <input ref={inputRef} {...props} />;
}

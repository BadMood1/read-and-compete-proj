"use client";

import { LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import type { ComponentProps, MouseEvent, ReactNode, Ref } from "react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ProfileFriendshipActionConfirmationDialogProps = {
    triggerButtonRef: Ref<HTMLButtonElement>;
    triggerLabel: string;
    pendingLabel: string;
    triggerIcon: ReactNode;
    confirmationIcon: ReactNode;
    triggerVariant: ComponentProps<typeof Button>["variant"];
    dialogTitle: string;
    dialogDescription: string;
    confirmationLabel: string;
    isPending: boolean;
    onConfirm: () => Promise<void>;
};

// Показывает кнопку дружбы и запрашивает подтверждение потенциально случайного действия.
// Сам компонент отвечает только за UI: конкретный Server Action передаётся через onConfirm.
export function ProfileFriendshipActionConfirmationDialog({
    triggerButtonRef,
    triggerLabel,
    pendingLabel,
    triggerIcon,
    confirmationIcon,
    triggerVariant,
    dialogTitle,
    dialogDescription,
    confirmationLabel,
    isPending,
    onConfirm,
}: ProfileFriendshipActionConfirmationDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isConfirmInFlightRef = useRef(false);

    async function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
        // AlertDialogAction обычно закрывает окно сразу. Оставляем его открытым,
        // чтобы фокус не ушёл на disabled trigger, пока операция ещё выполняется.
        event.preventDefault();

        if (isConfirmInFlightRef.current || isPending) {
            return;
        }

        isConfirmInFlightRef.current = true;

        try {
            await onConfirm();
        } finally {
            isConfirmInFlightRef.current = false;
            setIsOpen(false);
        }
    }

    return (
        <AlertDialog
            open={isOpen}
            onOpenChange={(nextIsOpen) => {
                // Во время запроса закрытие блокируется, чтобы активный элемент
                // оставался внутри модального окна до появления актуальной кнопки.
                if (!isPending) {
                    setIsOpen(nextIsOpen);
                }
            }}
        >
            <AlertDialogTrigger asChild>
                <Button
                    ref={triggerButtonRef}
                    type="button"
                    variant={triggerVariant}
                    size="lg"
                    className="h-11 w-full rounded-xl px-4 sm:w-auto"
                    disabled={isPending}
                    aria-busy={isPending}
                >
                    {isPending ? (
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                        triggerIcon
                    )}
                    {isPending ? pendingLabel : triggerLabel}
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
                </AlertDialogHeader>

                {/* Короткие действия остаются на одной строке и на мобильном экране. */}
                <AlertDialogFooter className="grid grid-cols-2 sm:flex">
                    <AlertDialogCancel className="min-w-0 px-2" disabled={isPending}>
                        Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="min-w-0 px-2 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                        aria-disabled={isPending}
                        aria-busy={isPending}
                        onClick={handleConfirm}
                    >
                        {isPending ? (
                            <LoaderCircle className="animate-spin" aria-hidden="true" />
                        ) : (
                            confirmationIcon
                        )}
                        {isPending ? (
                            <>
                                {/* На узком экране короткая подпись не выталкивает иконку из кнопки. */}
                                <span className="sm:hidden">{confirmationLabel}</span>
                                <span className="hidden sm:inline">{pendingLabel}</span>
                            </>
                        ) : (
                            confirmationLabel
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

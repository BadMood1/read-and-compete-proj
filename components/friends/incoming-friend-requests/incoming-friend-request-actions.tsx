"use client";

import { LoaderCircle, UserCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import {
    acceptCurrentUserFriendRequest,
    rejectCurrentUserFriendRequest,
    type CurrentUserFriendshipMutationResult,
} from "@/lib/friends/profile-friendship/current-user-friendship-actions";
import { CurrentUserFriendshipState } from "@/lib/friends/profile-friendship/current-user-friendship-state";
import { cn } from "@/lib/utils";

type IncomingFriendRequestActionsProps = {
    senderUserId: string;
    onRequestResolved: () => void;
};

type PendingIncomingFriendRequestAction = "accept" | "reject" | null;

// Оба Server Action имеют одинаковые аргументы и общий публичный формат результата.
type IncomingFriendRequestMutation = (
    senderUserId: string,
) => Promise<CurrentUserFriendshipMutationResult>;

type IncomingFriendRequestMutationErrorMessageProps = {
    errorMessage: string | null;
    isVisible: boolean;
};

// Ошибка остаётся внутри карточки и плавно исчезает, не перекрывая соседние заявки.
function IncomingFriendRequestMutationErrorMessage({
    errorMessage,
    isVisible,
}: IncomingFriendRequestMutationErrorMessageProps) {
    if (!errorMessage) {
        return null;
    }

    return (
        <p
            role="alert"
            className={cn(
                "mt-2 rounded-lg border border-destructive/25 bg-card px-2.5 py-1.5 text-xs text-destructive",
                "transition-opacity duration-200 ease-out motion-reduce:transition-none",
                isVisible ? "opacity-100" : "opacity-0",
            )}
        >
            {errorMessage}
        </p>
    );
}

// Отвечает на одну входящую заявку и синхронизирует оба списка страницы.
export function IncomingFriendRequestActions({
    senderUserId,
    onRequestResolved,
}: IncomingFriendRequestActionsProps) {
    const router = useRouter();
    const [pendingAction, setPendingAction] =
        useState<PendingIncomingFriendRequestAction>(null);
    const [errorMessage, setErrorMessage, isErrorMessageVisible] =
        useAutoDismissErrorMessage();

    // Общая функция не дублирует loading и обработку результата для двух кнопок.
    async function runIncomingFriendRequestMutation(
        actionName: Exclude<PendingIncomingFriendRequestAction, null>,
        mutation: IncomingFriendRequestMutation,
    ) {
        if (pendingAction !== null) {
            return;
        }

        setPendingAction(actionName);
        setErrorMessage(null);

        try {
            const result = await mutation(senderUserId);
            const isNoLongerIncomingRequest =
                result.currentUserFriendshipState !== undefined &&
                result.currentUserFriendshipState !==
                    CurrentUserFriendshipState.INCOMING_FRIEND_REQUEST;

            // После принятия, отклонения или внешнего изменения эта карточка уже неактуальна.
            // Скрываем её сразу, а refresh обновит также соседний список друзей.
            if (isNoLongerIncomingRequest) {
                onRequestResolved();
            }

            // При редкой гонке Server Action может увидеть уже новую входящую заявку.
            // Тогда карточка остаётся, а ошибку показываем только для неуспешного результата.
            if (!result.success && !isNoLongerIncomingRequest) {
                setErrorMessage(result.error);
            }

            router.refresh();
        } catch {
            setErrorMessage("Не удалось ответить на заявку. Попробуйте ещё раз.");
        } finally {
            setPendingAction(null);
        }
    }

    function handleAcceptFriendRequest() {
        void runIncomingFriendRequestMutation("accept", acceptCurrentUserFriendRequest);
    }

    function handleRejectFriendRequest() {
        void runIncomingFriendRequestMutation("reject", rejectCurrentUserFriendRequest);
    }

    const isAcceptingFriendRequest = pendingAction === "accept";
    const isRejectingFriendRequest = pendingAction === "reject";
    const isAnsweringFriendRequest = pendingAction !== null;

    return (
        <div>
            <div className="grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    size="lg"
                    className="h-10 min-w-0 rounded-xl px-2"
                    onClick={handleAcceptFriendRequest}
                    disabled={isAnsweringFriendRequest}
                    aria-label={isAcceptingFriendRequest ? "Принимаем заявку..." : undefined}
                    aria-busy={isAcceptingFriendRequest}
                >
                    {isAcceptingFriendRequest ? (
                        <>
                            <LoaderCircle className="animate-spin" aria-hidden="true" />
                            <span className="sm:hidden">Ждём...</span>
                            <span className="hidden sm:inline">Принимаем...</span>
                        </>
                    ) : (
                        <>
                            <UserCheck aria-hidden="true" />
                            Принять
                        </>
                    )}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-10 min-w-0 rounded-xl px-2"
                    onClick={handleRejectFriendRequest}
                    disabled={isAnsweringFriendRequest}
                    aria-label={isRejectingFriendRequest ? "Отклоняем заявку..." : undefined}
                    aria-busy={isRejectingFriendRequest}
                >
                    {isRejectingFriendRequest ? (
                        <>
                            <LoaderCircle className="animate-spin" aria-hidden="true" />
                            <span className="sm:hidden">Ждём...</span>
                            <span className="hidden sm:inline">Отклоняем...</span>
                        </>
                    ) : (
                        <>
                            <X aria-hidden="true" />
                            Отклонить
                        </>
                    )}
                </Button>
            </div>

            <IncomingFriendRequestMutationErrorMessage
                errorMessage={errorMessage}
                isVisible={isErrorMessageVisible}
            />
        </div>
    );
}

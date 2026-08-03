"use client";

import { Clock3, LoaderCircle, UserCheck, UserPlus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import {
    acceptCurrentUserFriendRequest,
    rejectCurrentUserFriendRequest,
    sendCurrentUserFriendRequest,
} from "@/lib/friends/current-user-friend-request-actions";
import {
    CurrentUserFriendshipState,
    type CurrentUserFriendshipState as CurrentUserFriendshipStateValue,
} from "@/lib/friends/current-user-friendship-state";
import { cn } from "@/lib/utils";

type ProfileFriendshipControlsProps = {
    profileUserId: string;
    initialCurrentUserFriendshipState: CurrentUserFriendshipStateValue;
};

// По имени операции определяем, какой loading-текст сейчас нужно показать.
type CurrentUserFriendshipMutationName = "send" | "accept" | "reject";

// Все три Server Action имеют одинаковые аргументы и результат, поэтому подходят под один тип.
type CurrentUserFriendshipMutation = typeof sendCurrentUserFriendRequest;

type ProfileFriendshipMutationErrorMessageProps = {
    errorMessage: string | null;
    isVisible: boolean;
};

// Единый вид ошибки используется и отправкой, и ответом на входящую заявку.
function ProfileFriendshipMutationErrorMessage({
    errorMessage,
    isVisible,
}: ProfileFriendshipMutationErrorMessageProps) {
    if (!errorMessage) {
        return null;
    }

    return (
        <p
            role="alert"
            className={cn(
                "pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-30 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-destructive/25 bg-card px-2.5 py-1.5 text-xs text-destructive shadow-md",
                "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                isVisible ? "opacity-100" : "opacity-0",
            )}
        >
            {errorMessage}
        </p>
    );
}

// Показывает текущее состояние дружбы и отправляет новую заявку.
export function ProfileFriendshipControls({
    profileUserId,
    initialCurrentUserFriendshipState,
}: ProfileFriendshipControlsProps) {
    // После успешного Server Action обновляем состояние сразу, без ожидания полного рендера страницы.
    const [currentUserFriendshipState, setCurrentUserFriendshipState] =
        useState<CurrentUserFriendshipStateValue>(initialCurrentUserFriendshipState);

    // null означает, что сейчас ни одна операция дружбы не выполняется.
    const [pendingFriendshipMutation, setPendingFriendshipMutation] =
        useState<CurrentUserFriendshipMutationName | null>(null);

    // Ошибка появляется рядом с кнопкой и сама плавно исчезает.
    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    // Общая функция не дублирует loading, обработку результата и ошибок для трёх кнопок.
    async function runCurrentUserFriendshipMutation(
        mutationName: CurrentUserFriendshipMutationName,
        requiredFriendshipState: CurrentUserFriendshipStateValue,
        mutation: CurrentUserFriendshipMutation,
    ) {
        // requiredFriendshipState задаёт сама кнопка: например, принять заявку можно только
        // из INCOMING_FRIEND_REQUEST. Проверка также блокирует параллельную операцию.
        if (
            pendingFriendshipMutation !== null ||
            currentUserFriendshipState !== requiredFriendshipState
        ) {
            return;
        }

        // Включаем loading нужной кнопки и убираем ошибку от предыдущей попытки.
        setPendingFriendshipMutation(mutationName);
        setErrorMessage(null);

        try {
            // Вызываем переданный Server Action с ID владельца открытого профиля.
            const result = await mutation(profileUserId);

            // Ожидаемая серверная ошибка показывается возле кнопки и не меняет состояние UI.
            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }

            // Успешный ответ сразу переключает интерфейс на новое состояние отношений.
            setCurrentUserFriendshipState(result.currentUserFriendshipState);
        } catch {
            // Сюда попадают неожиданные ошибки сети или выполнения Server Action.
            setErrorMessage("Не удалось выполнить действие. Попробуйте ещё раз.");
        } finally {
            // Выполняется при любом результате и снова разрешает нажатия.
            setPendingFriendshipMutation(null);
        }
    }

    // Каждый обработчик задаёт операцию, требуемое исходное состояние и нужный Server Action.
    function handleSendFriendRequest() {
        void runCurrentUserFriendshipMutation(
            "send",
            CurrentUserFriendshipState.NOT_FRIENDS,
            sendCurrentUserFriendRequest,
        );
    }

    function handleAcceptFriendRequest() {
        void runCurrentUserFriendshipMutation(
            "accept",
            CurrentUserFriendshipState.INCOMING_FRIEND_REQUEST,
            acceptCurrentUserFriendRequest,
        );
    }

    function handleRejectFriendRequest() {
        void runCurrentUserFriendshipMutation(
            "reject",
            CurrentUserFriendshipState.INCOMING_FRIEND_REQUEST,
            rejectCurrentUserFriendRequest,
        );
    }

    // --- ВЫБОР КНОПОК ПО ТЕКУЩЕМУ СОСТОЯНИЮ ДРУЖБЫ ---

    // Все хуки находятся выше ранних return и вызываются при каждом рендере в одном порядке.
    if (currentUserFriendshipState === CurrentUserFriendshipState.CURRENT_USER_PROFILE) {
        return null;
    }

    // На входящую заявку можно ответить двумя взаимоисключающими действиями.
    if (currentUserFriendshipState === CurrentUserFriendshipState.INCOMING_FRIEND_REQUEST) {
        const isAcceptingFriendRequest = pendingFriendshipMutation === "accept";
        const isRejectingFriendRequest = pendingFriendshipMutation === "reject";
        const isAnsweringFriendRequest = pendingFriendshipMutation !== null;

        return (
            <div className="relative w-full sm:w-auto">
                <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                        type="button"
                        size="lg"
                        className="h-11 flex-1 rounded-xl px-4 sm:flex-none"
                        onClick={handleAcceptFriendRequest}
                        disabled={isAnsweringFriendRequest}
                    >
                        {isAcceptingFriendRequest ? (
                            <>
                                <LoaderCircle className="animate-spin" aria-hidden="true" />
                                Принимаем...
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
                        className="h-11 flex-1 rounded-xl px-4 sm:flex-none"
                        onClick={handleRejectFriendRequest}
                        disabled={isAnsweringFriendRequest}
                    >
                        {isRejectingFriendRequest ? (
                            <>
                                <LoaderCircle className="animate-spin" aria-hidden="true" />
                                Отклоняем...
                            </>
                        ) : (
                            <>
                                <X aria-hidden="true" />
                                Отклонить
                            </>
                        )}
                    </Button>
                </div>

                <ProfileFriendshipMutationErrorMessage
                    errorMessage={errorMessage}
                    isVisible={isErrorMessageVisible}
                />
            </div>
        );
    }

    // Исходящая заявка пока только отображается; её отмену добавим отдельной операцией.
    if (currentUserFriendshipState === CurrentUserFriendshipState.OUTGOING_FRIEND_REQUEST) {
        return (
            <Button type="button" variant="outline" size="lg" className="h-11 rounded-xl px-4" disabled>
                <Clock3 aria-hidden="true" />
                Заявка отправлена
            </Button>
        );
    }

    // Принятая заявка отображается как готовая дружба.
    if (currentUserFriendshipState === CurrentUserFriendshipState.FRIENDS) {
        return (
            <Button type="button" variant="secondary" size="lg" className="h-11 rounded-xl px-4" disabled>
                <UserCheck aria-hidden="true" />
                Вы друзья
            </Button>
        );
    }

    // Оставшееся состояние — NOT_FRIENDS, поэтому показываем отправку новой заявки.
    return (
        <div className="relative w-full sm:w-auto">
            <Button
                type="button"
                size="lg"
                className="h-11 w-full rounded-xl px-4 sm:w-auto"
                onClick={handleSendFriendRequest}
                disabled={pendingFriendshipMutation !== null}
            >
                {pendingFriendshipMutation === "send" ? (
                    <>
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                        Отправляем...
                    </>
                ) : (
                    <>
                        <UserPlus aria-hidden="true" />
                        Добавить в друзья
                    </>
                )}
            </Button>

            <ProfileFriendshipMutationErrorMessage
                errorMessage={errorMessage}
                isVisible={isErrorMessageVisible}
            />
        </div>
    );
}

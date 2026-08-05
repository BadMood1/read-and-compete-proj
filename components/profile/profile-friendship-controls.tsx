"use client";

import { Clock3, LoaderCircle, UserCheck, UserMinus, UserPlus, X } from "lucide-react";
import { useRef, useState } from "react";

import { ProfileFriendshipActionConfirmationDialog } from "@/components/profile/profile-friendship-action-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import {
    acceptCurrentUserFriendRequest,
    cancelCurrentUserOutgoingFriendRequest,
    rejectCurrentUserFriendRequest,
    removeCurrentUserFriendship,
    sendCurrentUserFriendRequest,
} from "@/lib/friends/current-user-friendship-actions";
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
type CurrentUserFriendshipMutationName = "send" | "accept" | "reject" | "cancel" | "remove";

// Все Server Action имеют одинаковые аргументы и результат, поэтому подходят под один тип.
type CurrentUserFriendshipMutation = typeof sendCurrentUserFriendRequest;

type ProfileFriendshipMutationErrorMessageProps = {
    errorMessage: string | null;
    isVisible: boolean;
};

// Единый вид ошибки используется всеми действиями с заявкой и дружбой.
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

    // После подтверждения кнопка может смениться вместе с состоянием дружбы.
    // Один ref всегда указывает на главное действие уже актуальной ветки интерфейса.
    const primaryFriendshipActionButtonRef = useRef<HTMLButtonElement>(null);

    // Ошибка появляется рядом с кнопкой и сама плавно исчезает.
    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    // Общая функция не дублирует loading, обработку результата и ошибок для всех кнопок.
    async function runCurrentUserFriendshipMutation(
        mutationName: CurrentUserFriendshipMutationName,
        requiredFriendshipState: CurrentUserFriendshipStateValue,
        mutation: CurrentUserFriendshipMutation,
    ) {
        // requiredFriendshipState задаёт сама кнопка: например, принять заявку можно только
        // из INCOMING_FRIEND_REQUEST. Проверка также блокирует параллельную операцию.
        if (pendingFriendshipMutation !== null || currentUserFriendshipState !== requiredFriendshipState) {
            return;
        }

        // Включаем loading нужной кнопки и убираем ошибку от предыдущей попытки.
        setPendingFriendshipMutation(mutationName);
        setErrorMessage(null);

        try {
            // Вызываем переданный Server Action с ID владельца открытого профиля.
            const result = await mutation(profileUserId);

            // Даже error-ответ может содержать актуальное состояние для устаревшей вкладки.
            if (result.currentUserFriendshipState) {
                setCurrentUserFriendshipState(result.currentUserFriendshipState);
            }

            // После синхронизации кнопок отдельно показываем причину неудачной операции.
            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }
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

    // Сохраняет клавиатурный фокус
    function focusPrimaryFriendshipActionAfterMutation() {
        // React сначала применит новое состояние, а на следующем кадре ref уже укажет
        // на новую кнопку, поэтому фокус не потеряется после размонтирования dialog trigger.
        window.requestAnimationFrame(() => {
            primaryFriendshipActionButtonRef.current?.focus();
        });
    }

    async function handleCancelOutgoingFriendRequest() {
        await runCurrentUserFriendshipMutation(
            "cancel",
            CurrentUserFriendshipState.OUTGOING_FRIEND_REQUEST,
            cancelCurrentUserOutgoingFriendRequest,
        );

        focusPrimaryFriendshipActionAfterMutation();
    }

    async function handleRemoveFriendship() {
        await runCurrentUserFriendshipMutation(
            "remove",
            CurrentUserFriendshipState.FRIENDS,
            removeCurrentUserFriendship,
        );

        focusPrimaryFriendshipActionAfterMutation();
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
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                    <Button
                        ref={primaryFriendshipActionButtonRef}
                        type="button"
                        size="lg"
                        className="h-11 min-w-0 rounded-xl px-2 sm:flex-none sm:px-4"
                        onClick={handleAcceptFriendRequest}
                        disabled={isAnsweringFriendRequest}
                        aria-label={isAcceptingFriendRequest ? "Принимаем заявку..." : undefined}
                        aria-busy={isAcceptingFriendRequest}
                    >
                        {isAcceptingFriendRequest ? (
                            <>
                                <LoaderCircle className="animate-spin" aria-hidden="true" />
                                {/* Короткая мобильная подпись оставляет обе кнопки в одной строке на 320 px. */}
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
                        className="h-11 min-w-0 rounded-xl px-2 sm:flex-none sm:px-4"
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

                <ProfileFriendshipMutationErrorMessage
                    errorMessage={errorMessage}
                    isVisible={isErrorMessageVisible}
                />
            </div>
        );
    }

    // Исходящую заявку можно отменить только после явного подтверждения.
    if (currentUserFriendshipState === CurrentUserFriendshipState.OUTGOING_FRIEND_REQUEST) {
        const isCancellingOutgoingFriendRequest = pendingFriendshipMutation === "cancel";

        return (
            <div className="relative w-full sm:w-auto">
                <ProfileFriendshipActionConfirmationDialog
                    triggerButtonRef={primaryFriendshipActionButtonRef}
                    triggerLabel="Заявка отправлена"
                    pendingLabel="Отменяем..."
                    triggerIcon={<Clock3 aria-hidden="true" />}
                    confirmationIcon={<X aria-hidden="true" />}
                    triggerVariant="outline"
                    dialogTitle="Отменить заявку в друзья?"
                    dialogDescription="Заявка исчезнет у получателя. При необходимости вы сможете отправить её снова."
                    confirmationLabel="Отменить"
                    isPending={isCancellingOutgoingFriendRequest}
                    onConfirm={handleCancelOutgoingFriendRequest}
                />

                <ProfileFriendshipMutationErrorMessage
                    errorMessage={errorMessage}
                    isVisible={isErrorMessageVisible}
                />
            </div>
        );
    }

    // Удаление принятой дружбы также требует отдельного подтверждения.
    if (currentUserFriendshipState === CurrentUserFriendshipState.FRIENDS) {
        const isRemovingFriendship = pendingFriendshipMutation === "remove";

        return (
            <div className="relative w-full sm:w-auto">
                <ProfileFriendshipActionConfirmationDialog
                    triggerButtonRef={primaryFriendshipActionButtonRef}
                    triggerLabel="Вы друзья"
                    pendingLabel="Удаляем..."
                    triggerIcon={<UserCheck aria-hidden="true" />}
                    confirmationIcon={<UserMinus aria-hidden="true" />}
                    triggerVariant="secondary"
                    dialogTitle="Удалить пользователя из друзей?"
                    dialogDescription="Принятая дружба будет удалена. Позже вы сможете снова отправить этому пользователю заявку."
                    confirmationLabel="Удалить"
                    isPending={isRemovingFriendship}
                    onConfirm={handleRemoveFriendship}
                />

                <ProfileFriendshipMutationErrorMessage
                    errorMessage={errorMessage}
                    isVisible={isErrorMessageVisible}
                />
            </div>
        );
    }

    // Оставшееся состояние — NOT_FRIENDS, поэтому показываем отправку новой заявки.
    return (
        <div className="relative w-full sm:w-auto">
            <Button
                ref={primaryFriendshipActionButtonRef}
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

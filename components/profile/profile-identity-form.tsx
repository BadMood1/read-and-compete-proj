"use client";

import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { type FormEvent, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import { updateCurrentUserProfileIdentity } from "@/lib/profile/current-user-profile-identity-actions";
import {
    getProfileDisplayNameValidationError,
    normalizeProfileDisplayName,
    PROFILE_DISPLAY_NAME_MAX_LENGTH,
    PROFILE_DISPLAY_NAME_MIN_LENGTH,
} from "@/lib/profile/profile-display-name";
import {
    getProfileUsernameValidationError,
    normalizeProfileUsername,
    PROFILE_USERNAME_MAX_LENGTH,
    PROFILE_USERNAME_MIN_LENGTH,
} from "@/lib/profile/username/profile-username";
import { checkCurrentUserProfileUsernameAvailability } from "@/lib/profile/username/current-user-profile-username-actions";
import { cn } from "@/lib/utils";

type UsernameAvailabilityState = "idle" | "checking" | "available" | "unavailable";

type ProfileIdentity = {
    displayName: string;
    username: string;
};

type ProfileIdentityFormProps = {
    initialDisplayName: string;
    initialUsername: string;
    submitButtonLabel?: string;
    allowUnchangedSubmit?: boolean;
    autoFocus?: boolean;
    onProfileIdentityUpdated: (profileIdentity: ProfileIdentity) => void;
    onCancel?: () => void;
};

// Общая форма используется и при первом входе, и в единой модалке своего профиля.
export function ProfileIdentityForm({
    initialDisplayName,
    initialUsername,
    submitButtonLabel = "Сохранить",
    allowUnchangedSubmit = false,
    autoFocus = false,
    onProfileIdentityUpdated,
    onCancel,
}: ProfileIdentityFormProps) {
    //
    const formId = useId();
    const displayNameInputId = `${formId}-display-name`;
    const displayNameErrorId = `${displayNameInputId}-error`;
    const usernameInputId = `${formId}-username`;
    const usernameStatusId = `${usernameInputId}-status`;

    //
    const [displayName, setDisplayName] = useState(initialDisplayName);
    const [username, setUsername] = useState(initialUsername);
    const [lastSavedIdentity, setLastSavedIdentity] = useState(() => ({
        displayName: normalizeProfileDisplayName(initialDisplayName),
        username: normalizeProfileUsername(initialUsername),
    }));
    const [displayNameError, setDisplayNameError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailabilityState>("available");
    const [isSavingProfileIdentity, setIsSavingProfileIdentity] = useState(false);
    const [formError, setFormError, isFormErrorVisible] = useAutoDismissErrorMessage();

    // Новое изменение увеличивает номер и делает запоздалый ответ предыдущей проверки неактуальным.
    const usernameAvailabilityRequestIdRef = useRef(0);

    const normalizedDisplayName = normalizeProfileDisplayName(displayName);
    const normalizedUsername = normalizeProfileUsername(username);
    const currentDisplayNameValidationError = getProfileDisplayNameValidationError(normalizedDisplayName);
    const currentUsernameValidationError = getProfileUsernameValidationError(normalizedUsername);
    const hasProfileIdentityChanged =
        normalizedDisplayName !== lastSavedIdentity.displayName ||
        normalizedUsername !== lastSavedIdentity.username;
    const canSubmit =
        !currentDisplayNameValidationError &&
        !currentUsernameValidationError &&
        usernameAvailability !== "unavailable" &&
        (allowUnchangedSubmit || hasProfileIdentityChanged);

    // когда input потеряет фокус:
    function handleDisplayNameBlur() {
        setDisplayNameError(currentDisplayNameValidationError);
    }

    async function handleUsernameBlur() {
        if (currentUsernameValidationError) {
            setUsernameError(currentUsernameValidationError);
            setUsernameAvailability("idle");
            return;
        }

        const requestId = ++usernameAvailabilityRequestIdRef.current;
        setUsernameError(null);
        setUsernameAvailability("checking");

        try {
            const result = await checkCurrentUserProfileUsernameAvailability(normalizedUsername);

            // Пользователь уже изменил поле — старый ответ не должен перезаписать новое состояние.
            if (requestId !== usernameAvailabilityRequestIdRef.current) {
                return;
            }

            if (!result.success) {
                setUsernameError(result.error);
                setUsernameAvailability("idle");
                return;
            }

            setUsername(result.username);

            if (!result.isAvailable) {
                setUsernameError("Этот username уже занят.");
                setUsernameAvailability("unavailable");
                return;
            }

            setUsernameAvailability("available");
        } catch {
            if (requestId === usernameAvailabilityRequestIdRef.current) {
                setUsernameError("Не удалось проверить username. Попробуйте ещё раз.");
                setUsernameAvailability("idle");
            }
        }
    }

    async function handleProfileIdentitySubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSavingProfileIdentity) {
            return;
        }

        setDisplayNameError(currentDisplayNameValidationError);

        // Не стираем сообщение «занят», пока пользователь не изменил username.
        if (currentUsernameValidationError) {
            setUsernameError(currentUsernameValidationError);
        } else if (usernameAvailability !== "unavailable") {
            setUsernameError(null);
        }

        if (!canSubmit) {
            return;
        }

        setFormError(null);
        setIsSavingProfileIdentity(true);

        try {
            const result = await updateCurrentUserProfileIdentity({
                displayName,
                username,
            });

            if (!result.success) {
                if (result.errorField === "displayName") {
                    setDisplayNameError(result.error);
                } else if (result.errorField === "username") {
                    setUsernameError(result.error);
                    setUsernameAvailability("unavailable");
                } else {
                    setFormError(result.error);
                }

                return;
            }

            const updatedIdentity = {
                displayName: result.displayName,
                username: result.username,
            };
            setDisplayName(updatedIdentity.displayName);
            setUsername(updatedIdentity.username);
            setLastSavedIdentity(updatedIdentity);
            setUsernameAvailability("available");
            onProfileIdentityUpdated(updatedIdentity);
        } catch {
            setFormError("Не удалось сохранить профиль. Попробуйте ещё раз.");
        } finally {
            setIsSavingProfileIdentity(false);
        }
    }

    return (
        <form onSubmit={handleProfileIdentitySubmit} className="space-y-5">
            <div>
                <label htmlFor={displayNameInputId} className="text-sm font-semibold">
                    Отображаемое имя
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                    Его увидят другие читатели · {PROFILE_DISPLAY_NAME_MIN_LENGTH}–
                    {PROFILE_DISPLAY_NAME_MAX_LENGTH} символов.
                </p>
                <input
                    id={displayNameInputId}
                    name="displayName"
                    type="text"
                    value={displayName}
                    minLength={PROFILE_DISPLAY_NAME_MIN_LENGTH}
                    maxLength={PROFILE_DISPLAY_NAME_MAX_LENGTH}
                    autoComplete="name"
                    autoFocus={autoFocus}
                    disabled={isSavingProfileIdentity}
                    aria-describedby={displayNameError ? displayNameErrorId : undefined}
                    aria-invalid={Boolean(displayNameError)}
                    className="mt-3 h-12 w-full rounded-xl border border-input bg-background px-4 text-base shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-wait disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15"
                    onBlur={handleDisplayNameBlur}
                    onChange={(event) => {
                        setDisplayName(event.target.value);
                        setDisplayNameError(null);
                        setFormError(null);
                    }}
                />
                <div className="min-h-5 pt-1">
                    {displayNameError ? (
                        <p id={displayNameErrorId} className="text-sm text-destructive">
                            {displayNameError}
                        </p>
                    ) : null}
                </div>
            </div>

            <div>
                <label htmlFor={usernameInputId} className="text-sm font-semibold">
                    Username
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                    Он станет частью ссылки на профиль · {PROFILE_USERNAME_MIN_LENGTH}–
                    {PROFILE_USERNAME_MAX_LENGTH} символа.
                </p>
                <div className="relative mt-3">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-muted-foreground">
                        @
                    </span>
                    <input
                        id={usernameInputId}
                        name="username"
                        type="text"
                        value={username}
                        minLength={PROFILE_USERNAME_MIN_LENGTH}
                        maxLength={PROFILE_USERNAME_MAX_LENGTH}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={isSavingProfileIdentity}
                        aria-describedby={usernameStatusId}
                        aria-invalid={Boolean(usernameError)}
                        className="h-12 w-full rounded-xl border border-input bg-background pr-4 pl-9 text-base shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-wait disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15"
                        onBlur={() => void handleUsernameBlur()}
                        onChange={(event) => {
                            usernameAvailabilityRequestIdRef.current += 1;
                            setUsername(event.target.value.replace(/^@+/u, "").toLowerCase());
                            setUsernameError(null);
                            setUsernameAvailability("idle");
                            setFormError(null);
                        }}
                    />
                </div>
                <div id={usernameStatusId} className="min-h-5 pt-1 text-sm" aria-live="polite">
                    {usernameError ? (
                        <p className="text-destructive">{usernameError}</p>
                    ) : usernameAvailability === "checking" ? (
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                            Проверяем...
                        </p>
                    ) : usernameAvailability === "available" ? (
                        <p className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            Username свободен
                        </p>
                    ) : null}
                </div>
            </div>

            {/* Постоянная высота не сдвигает кнопки при временной серверной ошибке. */}
            <div className="min-h-5">
                {formError ? (
                    <p
                        role="alert"
                        className={cn(
                            "text-sm text-destructive transition-opacity duration-200",
                            isFormErrorVisible ? "opacity-100" : "opacity-0",
                        )}
                    >
                        {formError}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {onCancel ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={isSavingProfileIdentity}
                        className="h-11 rounded-xl px-4"
                        onClick={onCancel}
                    >
                        Отмена
                    </Button>
                ) : null}
                <Button
                    type="submit"
                    size="lg"
                    disabled={isSavingProfileIdentity || !canSubmit}
                    aria-busy={isSavingProfileIdentity}
                    className="h-11 rounded-xl px-4"
                >
                    {isSavingProfileIdentity ? (
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                        <Save aria-hidden="true" />
                    )}
                    {isSavingProfileIdentity ? "Сохраняем..." : submitButtonLabel}
                </Button>
            </div>
        </form>
    );
}

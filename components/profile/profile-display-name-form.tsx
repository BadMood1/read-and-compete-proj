"use client";

import { LoaderCircle, Save } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAutoDismissErrorMessage } from "@/hooks/use-auto-dismiss-error-message";
import { updateCurrentUserProfileDisplayName } from "@/lib/profile/profile-display-name-actions";
import {
    normalizeProfileDisplayName,
    PROFILE_DISPLAY_NAME_MAX_LENGTH,
    PROFILE_DISPLAY_NAME_MIN_LENGTH,
} from "@/lib/profile/profile-display-name";
import { cn } from "@/lib/utils";

type ProfileDisplayNameFormProps = {
    initialDisplayName: string;
    submitButtonLabel?: string;
    cancelButtonLabel?: string;
    onDisplayNameUpdated: (updatedDisplayName: string) => void;
    onCancel?: () => void;
    autoFocus?: boolean;
};

// Общая форма используется и при первом входе, и при редактировании своего профиля.
export function ProfileDisplayNameForm({
    initialDisplayName,
    submitButtonLabel = "Сохранить",
    cancelButtonLabel = "Отмена",
    onDisplayNameUpdated,
    onCancel,
    autoFocus = false,
}: ProfileDisplayNameFormProps) {
    // Уникальные ID позволяют безопасно переиспользовать форму в разных оболочках.
    // на случай если случайно окажутся две формы на странице
    const displayNameInputId = useId();
    const displayNameDescriptionId = `${displayNameInputId}-description`;
    const displayNameErrorId = `${displayNameInputId}-error`;
    const [displayName, setDisplayName] = useState(initialDisplayName);
    const [lastSavedDisplayName, setLastSavedDisplayName] = useState(() =>
        normalizeProfileDisplayName(initialDisplayName),
    );
    const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
    const [errorMessage, setErrorMessage, isErrorMessageVisible] = useAutoDismissErrorMessage();

    const normalizedDisplayName = normalizeProfileDisplayName(displayName);
    const hasDisplayNameChanged = normalizedDisplayName !== lastSavedDisplayName;
    const canSubmit =
        normalizedDisplayName.length >= PROFILE_DISPLAY_NAME_MIN_LENGTH &&
        normalizedDisplayName.length <= PROFILE_DISPLAY_NAME_MAX_LENGTH &&
        hasDisplayNameChanged;

    async function handleDisplayNameSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSavingDisplayName || !canSubmit) {
            return;
        }

        setErrorMessage(null);
        setIsSavingDisplayName(true);

        try {
            const result = await updateCurrentUserProfileDisplayName(displayName);

            if (!result.success) {
                setErrorMessage(result.error);
                return;
            }

            // Используем значение сервера: оно уже очищено от лишних пробелов.
            setDisplayName(result.displayName);
            setLastSavedDisplayName(result.displayName);
            onDisplayNameUpdated(result.displayName);
        } catch {
            setErrorMessage("Не удалось изменить имя. Попробуйте ещё раз.");
        } finally {
            setIsSavingDisplayName(false);
        }
    }

    return (
        <form onSubmit={handleDisplayNameSubmit} className="space-y-4">
            <div>
                <label htmlFor={displayNameInputId} className="text-sm font-semibold">
                    Отображаемое имя
                </label>
                <p id={displayNameDescriptionId} className="mt-1 text-sm text-muted-foreground">
                    Это имя увидят другие читатели · от {PROFILE_DISPLAY_NAME_MIN_LENGTH} до{" "}
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
                    disabled={isSavingDisplayName}
                    aria-describedby={
                        errorMessage
                            ? `${displayNameDescriptionId} ${displayNameErrorId}`
                            : displayNameDescriptionId
                    }
                    aria-invalid={Boolean(errorMessage)}
                    className="mt-3 h-12 w-full rounded-xl border border-input bg-background px-4 text-base shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-wait disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15"
                    onChange={(event) => {
                        // После исправления поля старая серверная ошибка больше не актуальна.
                        if (errorMessage) {
                            setErrorMessage(null);
                        }

                        setDisplayName(event.target.value);
                    }}
                />
            </div>

            {/* Постоянная высота не позволяет кнопкам прыгать при появлении ошибки. */}
            <div className="min-h-5">
                {errorMessage ? (
                    <p
                        id={displayNameErrorId}
                        role="alert"
                        className={cn(
                            "text-sm text-destructive",
                            "transition-opacity duration-200 motion-reduce:transition-none",
                            isErrorMessageVisible ? "opacity-100" : "opacity-0",
                        )}
                    >
                        {errorMessage}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {onCancel ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={isSavingDisplayName}
                        className="h-11 rounded-xl px-4"
                        onClick={onCancel}
                    >
                        {cancelButtonLabel}
                    </Button>
                ) : null}

                <Button
                    type="submit"
                    size="lg"
                    disabled={isSavingDisplayName || !canSubmit}
                    aria-busy={isSavingDisplayName}
                    className="h-11 rounded-xl px-4"
                >
                    {isSavingDisplayName ? (
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                        <Save aria-hidden="true" />
                    )}
                    {isSavingDisplayName ? "Сохраняем..." : submitButtonLabel}
                </Button>
            </div>
        </form>
    );
}

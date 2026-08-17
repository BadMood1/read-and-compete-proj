"use client";

import { useRouter } from "next/navigation";

import { ProfileDisplayNameForm } from "@/components/profile/profile-display-name-form";

type ProfileWelcomeDisplayNameEditorProps = {
    initialDisplayName: string;
};

// После сохранения или пропуска завершает короткое знакомство и открывает главную.
export function ProfileWelcomeDisplayNameEditor({
    initialDisplayName,
}: ProfileWelcomeDisplayNameEditorProps) {
    const router = useRouter();

    function continueToApplication() {
        // replace не оставляет welcome в истории, поэтому «Назад» не вернёт пользователя к форме.
        router.replace("/");
    }

    return (
        <ProfileDisplayNameForm
            initialDisplayName={initialDisplayName}
            submitButtonLabel="Сохранить и продолжить"
            cancelButtonLabel="Оставить как есть"
            onDisplayNameUpdated={continueToApplication}
            onCancel={continueToApplication}
            autoFocus
        />
    );
}

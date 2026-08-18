"use client";

import { useRouter } from "next/navigation";

import { ProfileIdentityForm } from "@/components/profile/profile-identity-form";

type ProfileWelcomeIdentityEditorProps = {
    initialDisplayName: string;
    initialUsername: string;
};

// После первого сохранения открывает приложение и не оставляет welcome в истории браузера.
export function ProfileWelcomeIdentityEditor({
    initialDisplayName,
    initialUsername,
}: ProfileWelcomeIdentityEditorProps) {
    const router = useRouter();

    return (
        <ProfileIdentityForm
            initialDisplayName={initialDisplayName}
            initialUsername={initialUsername}
            submitButtonLabel="Сохранить и продолжить"
            allowUnchangedSubmit
            autoFocus
            onProfileIdentityUpdated={() => router.replace("/")}
        />
    );
}

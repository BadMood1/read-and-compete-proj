"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileIdentityForm } from "@/components/profile/profile-identity-form";
import { ProfileLinkCopyUsername } from "@/components/profile/profile-link-copy-username";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createProfilePath } from "@/lib/profile/profile-navigation";

type ProfileIdentityEditorProps = {
    initialDisplayName: string;
    initialUsername: string;
};

type ProfileIdentity = {
    displayName: string;
    username: string;
};

// Один карандаш открывает общую форму имени и username, не меняя высоту шапки профиля.
export function ProfileIdentityEditor({
    initialDisplayName,
    initialUsername,
}: ProfileIdentityEditorProps) {
    const router = useRouter();
    const [profileIdentity, setProfileIdentity] = useState<ProfileIdentity>({
        displayName: initialDisplayName,
        username: initialUsername,
    });
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    function handleProfileIdentityUpdated(updatedProfileIdentity: ProfileIdentity) {
        const hasUsernameChanged = updatedProfileIdentity.username !== profileIdentity.username;

        // Сразу обновляем подписи в клиентской шапке и закрываем уже сохранённую форму.
        setProfileIdentity(updatedProfileIdentity);
        setIsEditorOpen(false);

        if (hasUsernameChanged) {
            // Старый username больше не является адресом профиля, поэтому заменяем текущую запись истории.
            router.replace(createProfilePath(updatedProfileIdentity.username));
        }

        // Обновляем сохранённый layout: Navbar тоже должен получить новые имя и username из сессии.
        router.refresh();
    }

    return (
        <div className="min-w-0">
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <div className="mt-1 flex min-w-0 items-center gap-1 sm:mt-2">
                    <h1 className="min-w-0 wrap-break-word text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
                        {profileIdentity.displayName}
                    </h1>

                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 rounded-full text-muted-foreground hover:scale-105 hover:text-primary"
                            aria-label="Изменить имя и username"
                        >
                            <Pencil aria-hidden="true" />
                        </Button>
                    </DialogTrigger>
                </div>

                <div className="mt-1 flex min-w-0">
                    <ProfileLinkCopyUsername
                        username={profileIdentity.username}
                        profileDisplayName={profileIdentity.displayName}
                    />
                </div>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Изменить профиль</DialogTitle>
                        <DialogDescription>
                            Имя увидят другие читатели, а username используется в ссылке на профиль.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-5">
                        <ProfileIdentityForm
                            initialDisplayName={profileIdentity.displayName}
                            initialUsername={profileIdentity.username}
                            onProfileIdentityUpdated={handleProfileIdentityUpdated}
                            onCancel={() => setIsEditorOpen(false)}
                            autoFocus
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <p className="mt-2 hidden text-sm leading-6 text-muted-foreground sm:block sm:text-base">
                Книжная статистика и читательская активность.
            </p>
        </div>
    );
}

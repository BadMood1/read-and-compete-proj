"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { ProfileDisplayNameForm } from "@/components/profile/profile-display-name-form";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type ProfileDisplayNameEditorProps = {
    initialDisplayName: string;
};

// Модальное редактирование не меняет высоту шапки и не сдвигает соседние элементы.
export function ProfileDisplayNameEditor({ initialDisplayName }: ProfileDisplayNameEditorProps) {
    const [displayName, setDisplayName] = useState(initialDisplayName);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    function handleDisplayNameUpdated(updatedDisplayName: string) {
        setDisplayName(updatedDisplayName);
        setIsEditorOpen(false);
    }

    return (
        <div>
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <div className="mt-2 flex min-w-0 items-center justify-center gap-1.5 sm:justify-start">
                    <h1 className="min-w-0 wrap-break-word text-3xl font-bold tracking-tight sm:text-4xl">
                        {displayName}
                    </h1>

                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 rounded-full text-muted-foreground hover:scale-105 hover:text-primary"
                            aria-label="Изменить отображаемое имя"
                        >
                            <Pencil aria-hidden="true" />
                        </Button>
                    </DialogTrigger>
                </div>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Изменить имя</DialogTitle>
                        <DialogDescription>
                            Изменения сразу появятся в вашем профиле и меню пользователя.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-5">
                        <ProfileDisplayNameForm
                            initialDisplayName={displayName}
                            onDisplayNameUpdated={handleDisplayNameUpdated}
                            onCancel={() => setIsEditorOpen(false)}
                            autoFocus
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                Книжная статистика и последние прочитанные книги.
            </p>
        </div>
    );
}

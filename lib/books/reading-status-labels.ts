import type { ReadingStatus } from "@/app/generated/prisma/enums";

// Переводим значения enum из БД в понятные подписи интерфейса.
export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
    WANT_TO_READ: "Хочу прочитать",
    READING: "Читаю",
    FINISHED: "Прочитано",
    PAUSED: "Отложено",
    DROPPED: "Брошено",
};

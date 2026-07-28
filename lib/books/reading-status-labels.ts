import type { ReadingStatus } from "@/app/generated/prisma/enums";

// Единый порядок статусов для dropdown и фильтров библиотеки.
export const READING_STATUS_ORDER: ReadingStatus[] = [
    "WANT_TO_READ",
    "READING",
    "FINISHED",
    "PAUSED",
    "DROPPED",
];

// Переводим значения enum из БД в понятные подписи интерфейса.
export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
    WANT_TO_READ: "Хочу прочитать",
    READING: "Читаю",
    FINISHED: "Прочитано",
    PAUSED: "Отложено",
    DROPPED: "Брошено",
};

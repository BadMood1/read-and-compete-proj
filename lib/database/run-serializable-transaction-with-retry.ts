import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

const SERIALIZABLE_TRANSACTION_ATTEMPTS = 3;

// Выполняет связанные запросы так, будто параллельные операции шли строго по очереди.
// Если PostgreSQL замечает конфликт, Prisma возвращает P2034 и мы повторяем операцию
// уже с актуальными данными. Остальные ошибки не скрываем.
export async function runSerializableTransactionWithRetry<Result>(
    operation: (transaction: Prisma.TransactionClient) => Promise<Result>,
): Promise<Result> {
    for (let attempt = 1; attempt <= SERIALIZABLE_TRANSACTION_ATTEMPTS; attempt++) {
        try {
            return await prisma.$transaction(operation, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
        } catch (error) {
            const shouldRetryTransaction =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2034" &&
                attempt < SERIALIZABLE_TRANSACTION_ATTEMPTS;

            if (!shouldRetryTransaction) {
                throw error;
            }
        }
    }

    // Цикл либо вернёт результат, либо выбросит последнюю ошибку.
    throw new Error("Не удалось завершить транзакцию после нескольких попыток.");
}

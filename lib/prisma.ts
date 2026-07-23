import "server-only"; // защита от случайного импорта в клиент. компонент
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalForPrisma = global as unknown as {
    prisma: PrismaClient;
};
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
}

const connectionUrl = new URL(connectionString);

// `require` сейчас означает строгую проверку TLS, поэтому фиксируем это явно.
if (connectionUrl.searchParams.get("sslmode") === "require") {
    connectionUrl.searchParams.set("sslmode", "verify-full");
}

const adapter = new PrismaPg({
    connectionString: connectionUrl.toString(),
});
const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;

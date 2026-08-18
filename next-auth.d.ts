import { type DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"] & {
            id: string;
            username: string | null;
        };
    }

    // Auth.js получает это поле из User, загруженного PrismaAdapter.
    interface User {
        username: string | null;
    }
}

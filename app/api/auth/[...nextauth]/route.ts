import { handlers } from "@/auth";

// Auth.js сам обрабатывает вход, выход, сессии и OAuth callback.
export const { GET, POST } = handlers;

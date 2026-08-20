import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    cacheComponents: true,

    // Запрещаем открывать страницы приложения внутри чужого iframe.
    // CSP используется современными браузерами, X-Frame-Options оставлен для совместимости.
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "frame-ancestors 'none';",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                ],
            },
        ];
    },

    images: {
        // Разрешаем оптимизатору только известные источники обложек и OAuth-аватаров.
        remotePatterns: [
            {
                protocol: "https",
                hostname: "books.google.com",
                pathname: "/books/content",
            },
            {
                protocol: "https",
                hostname: "books.google.com",
                pathname: "/books/publisher/content",
            },
            {
                protocol: "https",
                hostname: "books.googleusercontent.com",
                pathname: "/books/content",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                pathname: "/a/**",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
                pathname: "/u/**",
            },
        ],
    },
};

export default nextConfig;

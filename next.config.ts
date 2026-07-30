import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    cacheComponents: true,
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

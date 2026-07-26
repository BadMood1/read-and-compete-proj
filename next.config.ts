import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    cacheComponents: true,
    images: {
        // Разрешаем Next.js загружать только обложки с доменов Google Books.
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
        ],
    },
};

export default nextConfig;

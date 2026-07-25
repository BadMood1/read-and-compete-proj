import { searchGoogleBooks } from "@/lib/books/google-books-api";

// Временный endpoint для ручной проверки Google Books в браузере.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return Response.json(
      { error: "Query must contain at least 2 characters" },
      { status: 400 },
    );
  }

  try {
    const data = await searchGoogleBooks(query);

    return Response.json(data);
  } catch (error) {
    console.error("Google Books test route failed:", error);

    // Не отдаём пользователю технические детали внешнего сервиса.
    return Response.json(
      { error: "Google Books is temporarily unavailable" },
      { status: 503 },
    );
  }
}

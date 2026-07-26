import "server-only";

import { cache } from "react";

import { auth } from "@/auth";

// В рамках одного серверного рендера повторные вызовы используют одну проверку сессии.
// При новом HTTP-запросе React создаст новый временный cache.
export const getCurrentSession = cache(async () => auth());

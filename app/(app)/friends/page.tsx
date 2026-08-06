import { Suspense } from "react";

import {
    FriendsUserSearchSection,
    FriendsUserSearchSectionSkeleton,
} from "@/components/friends/friends-user-search-section";
import { FriendsListSection } from "@/components/friends/friends-list";
import { IncomingFriendRequestsSection } from "@/components/friends/incoming-friend-requests";
import { FriendsPageUserSearchResultsSection } from "@/components/friends/user-search-results";
import {
    getNormalizedFriendsPageSearchQuery,
    type FriendsPageSearchParameters,
} from "@/lib/friends/friends-page/friends-page-search-parameters";

type FriendsPageProps = {
    searchParams: Promise<FriendsPageSearchParameters>;
};

// Страница собирает независимые секции; каждая сама управляет своими данными и загрузкой.
export default function FriendsPage({ searchParams }: FriendsPageProps) {
    // Создаём один Promise и передаём его всем зависимым секциям, не блокируя каркас страницы.
    const searchQueryPromise = getNormalizedFriendsPageSearchQuery(searchParams);

    return (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
            {/* Заголовок нужен структуре страницы и скринридерам, но визуально не занимает место. */}
            <h1 className="sr-only">Друзья</h1>

            {/* searchParams доступны только во время запроса, поэтому строка поиска имеет свой Suspense. */}
            <Suspense fallback={<FriendsUserSearchSectionSkeleton />}>
                <FriendsUserSearchSection searchQueryPromise={searchQueryPromise} />
            </Suspense>

            {/* На desktop оба блока стоят в одной строке и растягиваются до общей высоты. */}
            <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
                <FriendsListSection searchQueryPromise={searchQueryPromise} />
                <IncomingFriendRequestsSection searchQueryPromise={searchQueryPromise} />
            </div>

            <FriendsPageUserSearchResultsSection
                searchQueryPromise={searchQueryPromise}
            />
        </main>
    );
}

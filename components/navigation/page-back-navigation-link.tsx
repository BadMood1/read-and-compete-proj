import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PageBackNavigationLinkProps = {
    href: string;
    label: string;
};

// Единый вид ссылки возврата для страниц книги, профиля и будущих разделов.
export function PageBackNavigationLink({ href, label }: PageBackNavigationLinkProps) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {label}
        </Link>
    );
}

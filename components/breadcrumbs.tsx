import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Breadcrumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>
                  {crumb.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

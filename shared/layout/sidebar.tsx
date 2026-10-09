"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/auth/use-role";
import { NAV_GROUPS, OVERVIEW_ITEM, isNavItemActive } from "./navigation";

type SidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Called after a nav link is clicked (e.g. to close the mobile drawer). */
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useRole();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((group) => group.items.length > 0);

  const renderLink = (item: typeof OVERVIEW_ITEM) => {
    const isActive = isNavItemActive(pathname, item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon className="h-4 w-4" aria-hidden="true" />
        {item.label}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-y-auto border-r bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      {/* Compact brand block */}
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div className="relative h-12 w-12 shrink-0">
          <Image
            src="/logo.svg"
            alt="Lahan Municipality Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold leading-tight tracking-tight text-primary">
            Lahan Municipality
          </h2>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Project Management
          </p>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-5 px-3 py-4">
        <div className="space-y-1">{renderLink(OVERVIEW_ITEM)}</div>

        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              {group.label}
            </p>
            {group.items.map(renderLink)}
          </div>
        ))}
      </nav>
    </div>
  );
}

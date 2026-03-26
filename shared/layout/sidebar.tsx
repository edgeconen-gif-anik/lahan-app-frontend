"use client";
import Link from "next/link";
import Image from "next/image"; // Import Image
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileSignature, 
  Users, 
  Building2 
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: FolderKanban, label: "Projects", href: "/dashboard/projects" },
  { icon: FileSignature, label: "Contracts", href: "/dashboard/contracts" },
  { icon: Users, label: "Committees", href: "/dashboard/committees" },
  { icon: Building2, label: "Companies", href: "/dashboard/companies" },
  { icon: Users, label: "Users", href: "/dashboard/users" },
];

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12 h-full bg-slate-50 dark:bg-slate-950 border-r", className)}>
      <div className="space-y-4 py-4">
        {/* LOGO SECTION */}
        <div className="px-6 py-4 flex flex-col items-center border-b mb-4">
          <div className="relative h-24 w-24 mb-3">
             {/* Ensure logo.svg is in your public folder */}
             <Image 
               src="/logo.svg" 
               alt="Lahan Municipality Logo" 
               fill
               className="object-contain"
               priority
             />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight text-primary">Lahan Municipality</h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">PMS System</p>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="px-3 py-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

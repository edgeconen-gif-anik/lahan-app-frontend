import {
  Building2,
  FileBarChart2,
  FileSignature,
  FolderKanban,
  Fuel,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  adminOnly?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

export const OVERVIEW_ITEM: NavItem = {
  icon: LayoutDashboard,
  label: "Overview",
  href: "/dashboard",
};

/** Single source for the sidebar, the command palette and breadcrumbs. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Work",
    items: [
      { icon: FolderKanban, label: "Projects", href: "/dashboard/projects" },
      { icon: FileSignature, label: "Contracts", href: "/dashboard/contracts" },
      { icon: Fuel, label: "Fuel Logs", href: "/dashboard/fuel" },
    ],
  },
  {
    label: "People & Organisations",
    items: [
      { icon: Users, label: "Committees", href: "/dashboard/committees" },
      { icon: Building2, label: "Companies", href: "/dashboard/companies" },
      { icon: UserCog, label: "Users", href: "/dashboard/users", adminOnly: true },
    ],
  },
  {
    label: "Insights & Admin",
    items: [
      { icon: FileBarChart2, label: "Reports", href: "/dashboard/reports" },
      { icon: Settings, label: "Setup", href: "/dashboard/setup", adminOnly: true },
    ],
  },
];

export function isNavItemActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname === href || pathname.startsWith(`${href}/`);
}

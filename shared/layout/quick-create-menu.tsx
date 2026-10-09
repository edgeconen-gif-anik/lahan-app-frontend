"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRole } from "@/lib/auth/use-role";

export const QUICK_CREATE_ITEMS = [
  { label: "New contract", href: "/dashboard/contracts/new" },
  { label: "New fuel log", href: "/dashboard/fuel/new" },
  { label: "New company", href: "/dashboard/companies/new" },
  { label: "New committee", href: "/dashboard/committees/new" },
  { label: "New project", href: "/dashboard/projects/new", adminOnly: true },
] as const;

export function QuickCreateMenu() {
  const { isAdmin } = useRole();
  const items = QUICK_CREATE_ITEMS.filter(
    (item) => !("adminOnly" in item) || isAdmin,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus />
          <span className="hidden sm:inline">New</span>
          <span className="sr-only sm:hidden">Create new</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

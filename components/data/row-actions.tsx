"use client";

import Link from "next/link";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RowAction = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Skip the action entirely (permissions, state). */
  hidden?: boolean;
};

/**
 * One "⋯" menu per row. Destructive actions are grouped last, behind a
 * separator, so they are never next to the common ones.
 */
export function RowActions({
  actions,
  label,
}: {
  actions: RowAction[];
  /** Names the row for screen readers, e.g. the contract number. */
  label: string;
}) {
  const visible = actions.filter((action) => !action.hidden);
  const safe = visible.filter((action) => !action.destructive);
  const destructive = visible.filter((action) => action.destructive);

  if (visible.length === 0) return null;

  const renderItem = (action: RowAction) => {
    const content = (
      <>
        {action.icon ? <action.icon className="h-4 w-4" aria-hidden="true" /> : null}
        {action.label}
      </>
    );

    return (
      <DropdownMenuItem
        key={action.label}
        asChild={Boolean(action.href) && !action.disabled}
        disabled={action.disabled}
        variant={action.destructive ? "destructive" : "default"}
        onSelect={action.onSelect}
      >
        {action.href && !action.disabled ? (
          <Link href={action.href}>{content}</Link>
        ) : (
          <span>{content}</span>
        )}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${label}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {safe.map(renderItem)}
        {safe.length > 0 && destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map(renderItem)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

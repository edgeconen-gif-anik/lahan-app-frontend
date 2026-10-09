"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  LogOut,
  Menu,
  Monitor,
  Moon,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { Sidebar } from "./sidebar"; // Reuse sidebar for mobile menu

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logoutFromApp } from "@/lib/auth/logout";
import { CommandPalette } from "./command-palette";
import { FiscalYearSwitcher } from "./fiscal-year-switcher";
import { QuickCreateMenu } from "./quick-create-menu";

export function Header() {
  const { data: session } = useSession();
  const { theme = "system", setTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const userInitials = session?.user?.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="flex h-16 items-center gap-2 border-b bg-background px-4 sm:px-6">
      {/* Mobile Menu Trigger */}
      <div className="mr-4 md:hidden">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Main navigation menu
            </SheetDescription>
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <CommandPalette />

      <div className="flex flex-1 items-center justify-end gap-2 pr-3">
        <FiscalYearSwitcher />
        <QuickCreateMenu />
      </div>

      {/* User Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
            aria-label="Open user menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session?.user?.image || ""}
                alt={session?.user?.name || ""}
              />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {session?.user?.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {session?.user?.id ? (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/users/${session.user.id}`}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>My profile</span>
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Appearance
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logoutFromApp("/login")}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

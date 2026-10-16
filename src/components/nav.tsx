"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layout,
  GraduationCap,
  BookOpen,
  FileText,
  Activity,
  ShieldAlert,
  Settings,
  LogOut,
  User,
  Menu,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Layout },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/reviewer", label: "Reviewer", icon: GraduationCap },
  { href: "/quiz", label: "Quizzes", icon: Activity },
  { href: "/flashcards", label: "Flashcards", icon: BookOpen },
  { href: "/planner", label: "Planner", icon: Activity },
  { href: "/tutor", label: "AI Tutor", icon: ShieldAlert },
  { href: "/progress", label: "Progress", icon: Activity },
  { href: "/profile", label: "Profile", icon: Settings },
];

export function Navbar({ user }: { user: { id: string; name?: string | null; email?: string | null; role: string } | null }) {
  const { theme, setTheme, resolved } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-input bg-background/95 backdrop-blur-md">
      <div className="flex h-14 shrink-0 items-center gap-1 bg-background px-4 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="font-bold">S</span>
          </div>
          <Link
            href="/"
            className={cn(
              "font-bold tracking-tight text-lg text-foreground",
              "sm:hidden md:flex"
            )}
          >
            StudyMate AI
          </Link>
        </div>

        <div className="hidden min-w-0 flex-1 md:flex">
          <div className="flex flex-1 items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <DropdownMenu.Root>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 hidden sm:flex">
                  <User className="h-4 w-4" />
                  <span>{user.name || user.email}</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => (window.location.href = "/api/auth/logout")}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu.Root>
          ) : null}

          <Button
            variant={user ? "outline" : "default"}
            size="sm"
            onClick={() => (window.location.href = user ? "/profile" : "/login")}
            className="hidden sm:flex"
          >
            {user ? "Account" : "Sign in"}
          </Button>

          <button
            onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <span className="h-4 w-4">☀️</span> : <span className="h-4 w-4">🌙</span>}
          </button>

          <Button asChild size="icon" variant="ghost" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={`md:hidden border-t border-input bg-background ${mobileOpen ? "" : "hidden"}`}>
        <div className="grid border-y gap-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <div className="border-t pt-2 px-3">
            <Button
              variant={user ? "outline" : "default"}
              className="w-full text-left justify-start"
              onClick={() => (window.location.href = user ? "/profile" : "/login")}
            >
              {user ? "Account" : "Sign in"}
            </Button>
            <button
              onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
              className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium text-muted-foreground bg-transparent hover:bg-accent"
            >
              <span>Theme</span>
              {resolved === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      {!mobileOpen && typeof window !== "undefined" ? null : null}
      <button
        className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </nav>
  );
}



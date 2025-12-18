"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/store";
import {
  LayoutDashboard,
  Map,
  Settings,
  CreditCard,
  Users,
  BarChart3,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/types";

interface SidebarProps {
  role: UserRole;
}

const adminNavItems = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/projects", label: "Project", icon: FolderKanban },
  { href: "/dashboard/admin/maps", label: "Maps", icon: Map },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
];

const developerNavItems = [
  { href: "/dashboard/developer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/developer/projects", label: "Project", icon: FolderKanban },
  { href: "/dashboard/developer/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/developer/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const navItems = role === "admin" ? adminNavItems : developerNavItems;

  const isActivePath = (href: string) =>
    pathname.split(/[?#]/)[0] === href;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* ================= HEADER ================= */}
      <div className="flex h-16 items-center border-b px-4">
        {!isCollapsed ? (
          <div className="flex w-full items-center justify-between">
            {/* Logo + Brand */}
            <div className="flex items-center gap-2">
                <Image
                  src="/img/logo_scapegis.svg"
                alt="Scapegis Logo"
                width={32}
                height={32}
                 priority
                 unoptimized
              />
              <span className="font-kayak text-xl md:text-2xl tracking-wide font-semibold text-[#01123E]">
                Scapegis
              </span>
            </div>

            {/* Collapse */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Collapsed: Logo only */
          <div className="flex w-full justify-center">
            <Image
              src="/img/logo_scapegis.svg"
              alt="Scapegis Logo"
              width={32}
              height={32}
                priority
                unoptimized
            />
          </div>
        )}
      </div>

      {/* Expand Button */}
      {isCollapsed && (
        <div className="border-b px-2 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-full"
            onClick={toggleSidebar}
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : ""}
              className={cn(
                "group relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />

              <span
                className={cn(
                  "whitespace-nowrap transition-all",
                  isCollapsed
                    ? "w-0 overflow-hidden opacity-0"
                    : "opacity-100"
                )}
              >
                {item.label}
              </span>

              {/* Tooltip (collapsed) */}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-full ml-2 rounded-md bg-popover px-2 py-1 text-sm text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Map, 
  MessageSquare, 
  Settings, 
  CreditCard,
  Users,
  BarChart3
} from "lucide-react";
import type { UserRole } from "@/lib/types";

interface SidebarProps {
  role: UserRole;
}

const adminNavItems = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/maps", label: "Maps", icon: Map },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
];

const developerNavItems = [
  { href: "/dashboard/developer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/developer/maps", label: "Maps", icon: Map },
  { href: "/dashboard/developer/chat", label: "AI Assistant", icon: MessageSquare },
  { href: "/dashboard/developer/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/developer/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "admin" ? adminNavItems : developerNavItems;

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <span className="text-lg font-semibold">Scapegis</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserRole } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDashboardRoute(role: UserRole): string {
  // Map user roles to their respective dashboard routes
  const roleRoutes: Record<UserRole, string> = {
    admin: "/dashboard/admin",
    developer: "/dashboard/developer",
    property_developer: "/dashboard/property_developer",
    gis_analyst: "/dashboard/gis_analyst",
    viewer: "/dashboard/viewer"
  };

  return roleRoutes[role] || "/dashboard/developer";
}

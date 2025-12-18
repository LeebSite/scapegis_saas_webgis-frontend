import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserRole } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get dashboard route based on user role
 * @param role - User role (admin or developer)
 * @returns Dashboard route path
 */
export function getDashboardRoute(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    admin: "/dashboard/admin",
    developer: "/dashboard/developer",
  };
  
  return routes[role] || "/dashboard/developer";
}



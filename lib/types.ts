export type UserRole = "admin" | "developer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  plan: "free" | "basic" | "professional" | "enterprise";
  status: "active" | "cancelled" | "expired";
  expiresAt?: Date;
}



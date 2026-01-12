import http from "./http";

export interface LoginRequest {
  email: string;
  password: string;
}

import type { UserRole } from "../types";

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface GoogleLoginResponse {
  authorization_url: string;
}

export interface GoogleCallbackRequest {
  code: string;
  redirect_uri?: string;
}

export interface GoogleCallbackResponse {
  access_token: string;
  user: any;
}

export interface UpdateUserRoleRequest {
  user_id: string;
  role: UserRole;
}

export const authAPI = {
  /**
   * Register a new user
   * POST /auth/register
   */
  register: (data: RegisterRequest) =>
    http.post<LoginResponse>("/auth/register", data),

  /**
   * Login with email and password
   * POST /auth/login
   */
  login: (data: LoginRequest) =>
    http.post<LoginResponse>("/auth/login", data),

  /**
   * Get current user information
   * GET /auth/me
   */
  getMe: () =>
    http.get("/auth/me"),

  /**
   * Update user role (admin only)
   * PUT /auth/users/role
   */
  updateUserRole: (data: UpdateUserRoleRequest) =>
    http.put("/auth/users/role", data),

  /**
   * Get Google OAuth login URL
   * GET /auth/google/login
   */
  getGoogleLoginUrl: () =>
    http.get<GoogleLoginResponse>("/auth/google/login"),

  /**
   * Handle Google OAuth callback
   * POST /auth/google/callback
   */
  /**
   * Handle Google OAuth callback
   * POST /auth/google/callback
   */
  googleCallback: (data: GoogleCallbackRequest) =>
    http.post<GoogleCallbackResponse>("/auth/google/callback", data),

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refreshToken: (refreshToken: string) =>
    http.post<{ access_token: string }>("/auth/refresh", { refresh_token: refreshToken }),

  /**
   * Logout
   * POST /auth/logout
   */
  logout: (refreshToken: string) =>
    http.post<{ message: string }>("/auth/logout", { refresh_token: refreshToken }),

  /**
    * Google OAuth (New)
    * POST /auth/oauth/google
    */
  googleLogin: (idToken: string) =>
    http.post<LoginResponse>("/auth/oauth/google", { id_token: idToken }),
};


import http from "./http";

// ============================================
// Request Types
// ============================================

export interface UpdateUserStatusRequest {
  is_active: boolean;
}

export interface UpdateUserRoleRequest {
  role: "admin" | "developer";
}

// ============================================
// Response Types
// ============================================

export interface UserListResponse {
  id: string;
  email: string;
  name: string;
  role: "admin" | "developer";
  auth_provider: "local" | "google";
  is_active: boolean;
  is_verified: boolean;
  workspace_count: number;
  last_login_at: string | null;
  created_at: string;
}

export interface UserStatisticsResponse {
  total_users: number;
  active_users: number;
  inactive_users: number;
  verified_users: number;
  users_by_role: Record<string, number>;
  users_by_auth_provider: Record<string, number>;
  new_users_last_30_days: number;
  total_workspaces: number;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: string;
  subscription_name: string | null;
  member_count: number;
  project_count: number;
  created_at: string;
}

export interface UserDetailResponse {
  id: string;
  email: string;
  name: string;
  role: "admin" | "developer";
  auth_provider: "local" | "google";
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  workspaces: WorkspaceSummary[];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  message: string;
}

// ============================================
// API Functions
// ============================================

export const adminAPI = {
  /**
   * Get all users (admin only)
   * GET /admin/users
   */
  getAllUsers: () =>
    http.get<UserListResponse[]>("/admin/users"),

  /**
   * Get user statistics for dashboard overview (admin only)
   * GET /admin/users/statistics
   */
  getUserStatistics: () =>
    http.get<UserStatisticsResponse>("/admin/users/statistics"),

  /**
   * Get user detail by ID (admin only)
   * GET /admin/users/{user_id}
   */
  getUserDetail: (userId: string) =>
    http.get<UserDetailResponse>(`/admin/users/${userId}`),

  /**
   * Update user status (admin only)
   * PUT /admin/users/{user_id}/status
   */
  updateUserStatus: (userId: string, data: UpdateUserStatusRequest) =>
    http.put<MessageResponse>(`/admin/users/${userId}/status`, data),

  /**
   * Update user role (admin only)
   * PUT /admin/users/{user_id}/role
   */
  updateUserRole: (userId: string, data: UpdateUserRoleRequest) =>
    http.put<MessageResponse>(`/admin/users/${userId}/role`, data),

  /**
   * Delete user from system (admin only)
   * DELETE /admin/users/{user_id}
   */
  deleteUser: (userId: string) =>
    http.delete<MessageResponse>(`/admin/users/${userId}`),
};

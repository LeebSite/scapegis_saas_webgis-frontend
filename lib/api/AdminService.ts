import http from "./http";

export interface UpdateUserStatusRequest {
  is_active: boolean;
}

export interface UpdateUserRoleRequest {
  role: "admin" | "developer";
}

export interface UserDetail {
  id: string;
  email: string;
  name: string;
  role: "admin" | "developer";
  is_active: boolean;
  created_at: string;
  subscription?: any;
}

export interface MessageResponse {
  message: string;
}

export const adminAPI = {
  /**
   * Get all users (admin only)
   * GET /admin/users
   */
  getAllUsers: () =>
    http.get<UserDetail[]>("/admin/users"),

  /**
   * Get user detail by ID (admin only)
   * GET /admin/users/{user_id}
   */
  getUserDetail: (userId: string) =>
    http.get<UserDetail>(`/admin/users/${userId}`),

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
};


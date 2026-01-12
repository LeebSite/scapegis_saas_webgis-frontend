/**
 * API Services Index
 * 
 * This file exports all API services for easy import throughout the application.
 * 
 * Usage:
 * import { authAPI, adminAPI, aiAPI, subscriptionAPI } from '@/lib/api';
 */

export { authAPI } from "./AuthService";
export { adminAPI } from "./AdminService";
export { aiAPI } from "./AIService";
export { subscriptionAPI } from "./SubscriptionService";
export { workspaceAPI } from "./WorkspaceService";
export { invitationAPI } from "./InvitationService";
export { projectAPI } from "./ProjectService";
export { layerAPI } from "./LayerService";

// Re-export types
export type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  GoogleLoginResponse,
  GoogleCallbackRequest,
  GoogleCallbackResponse,
} from "./AuthService";

export type {
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
  UserDetail,
  MessageResponse,
} from "./AdminService";

export type {
  ChatRequest,
  ChatResponse,
  SpatialAnalysisRequest,
  SpatialAnalysisResponse,
} from "./AIService";

export type {
  SubscriptionRequestResult,
} from "./SubscriptionService";


import http from "./http";
import type { Project, Layer } from "../types";

export interface CreateProjectRequest {
    workspace_id: string;
    name: string;
    description?: string;
}

export const projectAPI = {
    /**
     * Get all projects for a workspace
     * GET /workspaces/{id}/projects
     */
    getProjects: (workspaceId: string) =>
        http.get<Project[]>(`/workspaces/${workspaceId}/projects`),

    /**
     * Create a new project
     * POST /projects
     */
    createProject: (data: CreateProjectRequest) =>
        http.post<Project>("/projects", data),

    /**
     * Get project by ID
     * GET /projects/{id}
     */
    getProject: (projectId: string) =>
        http.get<Project>(`/projects/${projectId}`),

    /**
     * Update a project
     * PUT /projects/{id}
     */
    updateProject: (projectId: string, data: Partial<CreateProjectRequest>) =>
        http.put<Project>(`/projects/${projectId}`, data),

    /**
     * Delete a project
     * DELETE /projects/{id}
     */
    deleteProject: (projectId: string) =>
        http.delete<{ message: string }>(`/projects/${projectId}`),

    /**
     * Get layers assigned to a project
     * GET /projects/{id}/layers
     */
    getProjectLayers: (projectId: string) =>
        http.get<Layer[]>(`/projects/${projectId}/layers`),

    /**
     * Assign a layer to a project
     * POST /projects/{id}/layers
     */
    assignLayer: (projectId: string, layerId: string) =>
        http.post<{ message: string }>(`/projects/${projectId}/layers`, { layer_id: layerId }),

    /**
     * Remove a layer from a project
     * DELETE /projects/{id}/layers/{layerId}
     */
    removeLayer: (projectId: string, layerId: string) =>
        http.delete<{ message: string }>(`/projects/${projectId}/layers/${layerId}`),
};

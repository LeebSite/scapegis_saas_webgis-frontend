"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "@/lib/api/AdminService";
import type {
    UserListResponse,
    UserStatisticsResponse,
    UserDetailResponse,
} from "@/lib/api/AdminService";
import { toast } from "sonner";

// Query Keys
export const adminQueryKeys = {
    all: ["admin"] as const,
    users: () => [...adminQueryKeys.all, "users"] as const,
    statistics: () => [...adminQueryKeys.all, "statistics"] as const,
    userDetail: (userId: string) => [...adminQueryKeys.all, "user", userId] as const,
};

// Hooks for Queries
export function useUsers() {
    return useQuery({
        queryKey: adminQueryKeys.users(),
        queryFn: async () => {
            const response = await adminAPI.getAllUsers();
            return response.data;
        },
        staleTime: 30000, // 30 seconds
    });
}

export function useStatistics() {
    return useQuery({
        queryKey: adminQueryKeys.statistics(),
        queryFn: async () => {
            const response = await adminAPI.getUserStatistics();
            return response.data;
        },
        staleTime: 60000, // 1 minute
    });
}

export function useUserDetail(userId: string | null) {
    return useQuery({
        queryKey: userId ? adminQueryKeys.userDetail(userId) : ["user", "null"],
        queryFn: async () => {
            if (!userId) return undefined;
            const response = await adminAPI.getUserDetail(userId);
            return response.data;
        },
        enabled: !!userId,
    });
}

// Hooks for Mutations
export function useUpdateUserStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
            const response = await adminAPI.updateUserStatus(userId, { is_active: isActive });
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch users list
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(variables.userId) });
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.statistics() });

            toast.success("User status updated successfully");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Failed to update user status";
            toast.error(message);
        },
    });
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "developer" }) => {
            const response = await adminAPI.updateUserRole(userId, { role });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(variables.userId) });
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.statistics() });

            toast.success("User role updated successfully");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Failed to update user role";
            toast.error(message);
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await adminAPI.deleteUser(userId);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.statistics() });

            toast.success("User deleted successfully");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Failed to delete user";
            toast.error(message);
        },
    });
}

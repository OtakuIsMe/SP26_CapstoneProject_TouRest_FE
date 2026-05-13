import axiosClient from "../http/axios-client";

export type NotificationEntityType = "Booking" | "Service" | "Package" | "Itinerary" | "Refund" | "Other";

export interface NotificationDTO {
    id: string;
    title: string;
    message: string;
    entityType: NotificationEntityType;
    entityId: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    getMyNotifications: (): Promise<ApiResponse<NotificationDTO[]>> =>
        axiosClient.get("/notifications"),

    getUnreadCount: (): Promise<ApiResponse<number>> =>
        axiosClient.get("/notifications/unread-count"),

    markAsRead: (id: string): Promise<ApiResponse<string>> =>
        axiosClient.put(`/notifications/${id}/read`),

    markAllAsRead: (): Promise<ApiResponse<string>> =>
        axiosClient.put("/notifications/read-all"),
};

import type { NotificationDTO, NotificationEntityType } from "@/libs/services/notification.service";

export type NotifType = "booking" | "tour" | "system" | "payment";

export function entityTypeToNotifType(entityType: NotificationEntityType): NotifType {
    switch (entityType) {
        case "Booking":   return "booking";
        case "Refund":    return "payment";
        case "Itinerary":
        case "Package":
        case "Service":   return "tour";
        default:          return "system";
    }
}

export function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)   return "Just now";
    if (m < 60)  return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h} hr ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Yesterday";
    return `${d} days ago`;
}

export const NOTIF_COLOR: Record<NotifType, { bg: string; color: string }> = {
    booking: { bg: "#eff6ff", color: "#3b82f6" },
    tour:    { bg: "#f0fdf4", color: "#22c55e" },
    system:  { bg: "#fffbeb", color: "#f59e0b" },
    payment: { bg: "#f5f3ff", color: "#8b5cf6" },
};

export function getNotificationRoute(
    notification: NotificationDTO,
    role?: string | null,
): string | null {
    const { entityType, entityId } = notification;

    switch (entityType) {
        case "Booking":
        case "Refund":
            if (role === "customer" || !role) return `/profile/bookings/${entityId}`;
            return null;
        case "Itinerary":
            if (role === "agency") return "/agency/jobs";
            if (role === "provider") return "/provider/jobs";
            if (role === "admin") return "/admin/schedule";
            return null;
        case "Package":
        case "Service":
            if (role === "provider") return "/provider/packages";
            if (role === "agency") return "/agency/tours";
            return null;
        default:
            return null;
    }
}

"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    notificationService,
    type NotificationDTO,
} from "@/libs/services/notification.service";
import {
    startNotificationHub,
    stopNotificationHub,
} from "@/libs/services/signalr.service";
import { StorageKeys } from "@/constants/storage";
import { getNotificationRoute } from "@/utils/notification.utils";

interface ToastItem {
    id: string;
    title: string;
    message: string;
}

interface NotificationContextValue {
    notifs: NotificationDTO[];
    unreadCount: number;
    toast: ToastItem | null;
    isConnected: boolean;
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    handleNotificationClick: (notification: NotificationDTO) => Promise<void>;
    dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function getRoleFromCookie(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|;\s*)role=([^;]*)/);
    return match?.[1] ?? null;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifs, setNotifs] = useState<NotificationDTO[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toast, setToast] = useState<ToastItem | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const roleRef = useRef<string | null>(null);

    const dismissToast = useCallback(() => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(null);
    }, []);

    const showToast = useCallback((notification: NotificationDTO) => {
        dismissToast();
        setToast({
            id: notification.id,
            title: notification.title,
            message: notification.message,
        });
        toastTimer.current = setTimeout(() => setToast(null), 4500);
    }, [dismissToast]);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await notificationService.getMyNotifications();
            if (res.data) setNotifs(res.data);
        } catch {
            // ignore
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await notificationService.getUnreadCount();
            if (res.data !== undefined) setUnreadCount(res.data);
        } catch {
            // ignore
        }
    }, []);

    const markRead = useCallback(async (id: string) => {
        setNotifs(prev => {
            const target = prev.find(n => n.id === id);
            if (!target || target.isRead) return prev;
            setUnreadCount(c => Math.max(0, c - 1));
            return prev.map(n => (n.id === id ? { ...n, isRead: true } : n));
        });
        try {
            await notificationService.markAsRead(id);
        } catch {
            // ignore
        }
    }, []);

    const markAllRead = useCallback(async () => {
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await notificationService.markAllAsRead();
        } catch {
            // ignore
        }
    }, []);

    const handleNotificationClick = useCallback(async (notification: NotificationDTO) => {
        await markRead(notification.id);
        const role = roleRef.current ?? getRoleFromCookie();
        const route = getNotificationRoute(notification, role);
        if (route) window.location.href = route;
    }, [markRead]);

    const handleRealtimeNotification = useCallback((payload: unknown) => {
        const notification = payload as NotificationDTO;
        if (!notification?.id) return;

        setNotifs(prev => {
            if (prev.some(n => n.id === notification.id)) return prev;
            return [notification, ...prev];
        });

        if (!notification.isRead) {
            setUnreadCount(c => c + 1);
            showToast(notification);
        }
    }, [showToast]);

    useEffect(() => {
        roleRef.current = getRoleFromCookie();

        const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
        if (!token) return;

        fetchUnreadCount();

        let cancelled = false;

        startNotificationHub(handleRealtimeNotification).then(conn => {
            if (!cancelled) setIsConnected(!!conn);
        });

        const onStorage = (e: StorageEvent) => {
            if (e.key === StorageKeys.ACCESS_TOKEN) {
                if (e.newValue) {
                    startNotificationHub(handleRealtimeNotification).then(conn => {
                        setIsConnected(!!conn);
                        fetchUnreadCount();
                    });
                } else {
                    stopNotificationHub();
                    setIsConnected(false);
                    setNotifs([]);
                    setUnreadCount(0);
                }
            }
        };

        window.addEventListener("storage", onStorage);

        return () => {
            cancelled = true;
            window.removeEventListener("storage", onStorage);
            stopNotificationHub();
            dismissToast();
        };
    }, [fetchUnreadCount, handleRealtimeNotification, dismissToast]);

    return (
        <NotificationContext.Provider
            value={{
                notifs,
                unreadCount,
                toast,
                isConnected,
                fetchNotifications,
                fetchUnreadCount,
                markRead,
                markAllRead,
                handleNotificationClick,
                dismissToast,
            }}
        >
            {children}
            {toast && (
                <div
                    role="status"
                    onClick={dismissToast}
                    style={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 9999,
                        maxWidth: 360,
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: "#111827",
                        color: "#fff",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                        cursor: "pointer",
                        animation: "fadeIn 0.2s ease",
                    }}
                >
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                        {toast.title}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}>
                        {toast.message}
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotifications(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error("useNotifications must be used within NotificationProvider");
    }
    return ctx;
}

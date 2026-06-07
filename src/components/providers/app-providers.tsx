"use client";

import { NotificationProvider } from "@/contexts/notification.context";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return <NotificationProvider>{children}</NotificationProvider>;
}

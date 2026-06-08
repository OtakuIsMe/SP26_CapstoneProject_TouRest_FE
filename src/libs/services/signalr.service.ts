import * as signalR from "@microsoft/signalr";
import { StorageKeys } from "@/constants/storage";

const HUB_PATH = "/notificationHub";

let connection: signalR.HubConnection | null = null;
let starting: Promise<void> | null = null;

function getHubUrl(): string {
    const base = process.env.NEXT_PUBLIC_TOUREST_API_URL ?? "";
    return `${base}${HUB_PATH}`;
}

export function getNotificationConnection(): signalR.HubConnection | null {
    return connection;
}

export async function startNotificationHub(
    onNotification: (notification: unknown) => void,
): Promise<signalR.HubConnection | null> {
    if (typeof window === "undefined") return null;

    const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
    if (!token) return null;

    if (connection?.state === signalR.HubConnectionState.Connected) {
        return connection;
    }

    if (starting) {
        await starting;
        return connection;
    }

    if (!connection) {
        connection = new signalR.HubConnectionBuilder()
            .withUrl(getHubUrl(), {
                accessTokenFactory: () => localStorage.getItem(StorageKeys.ACCESS_TOKEN) ?? "",
                withCredentials: true,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Information)
            .build();

        connection.on("ReceiveNotification", onNotification);

        connection.onreconnected(() => {
            const freshToken = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
            if (!freshToken) {
                stopNotificationHub();
            }
        });
    }

    starting = connection.start().finally(() => {
        starting = null;
    });

    try {
        await starting;
        return connection;
    } catch (err) {
        console.error("[SignalR] Failed to connect to notification hub:", err);
        connection = null;
        return null;
    }
}

export async function stopNotificationHub(): Promise<void> {
    if (!connection) return;
    try {
        await connection.stop();
    } catch {
        // ignore disconnect errors
    } finally {
        connection = null;
        starting = null;
    }
}

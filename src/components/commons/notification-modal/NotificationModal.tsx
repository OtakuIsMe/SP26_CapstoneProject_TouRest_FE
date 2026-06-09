"use client";

import { useEffect } from "react";
import type { NotificationDTO } from "@/libs/services/notification.service";
import { NOTIF_COLOR, entityTypeToNotifType, timeAgo } from "@/utils/notification.utils";
import styles from "./NotificationModal.module.scss";

const ICON: Record<string, React.ReactNode> = {
    booking: (
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    ),
    tour: (
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
    ),
    system: (
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    ),
    payment: (
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
    ),
};

interface Props {
    notification: NotificationDTO;
    onClose: () => void;
    onView?: () => void;
}

export default function NotificationModal({ notification, onClose, onView }: Props) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    const type = entityTypeToNotifType(notification.entityType);
    const cfg  = NOTIF_COLOR[type];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Close button */}
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>

                {/* Icon */}
                <div className={styles.iconWrap} style={{ background: cfg.bg, color: cfg.color }}>
                    {ICON[type] ?? ICON.system}
                </div>

                {/* Content */}
                <h3 className={styles.title}>{notification.title}</h3>
                <p className={styles.message}>{notification.message}</p>
                <span className={styles.time}>{timeAgo(notification.createdAt)}</span>

                {/* Actions */}
                <div className={styles.actions}>
                    <button className={styles.btnClose} onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

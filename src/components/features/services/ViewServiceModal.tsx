"use client";

import { useEffect, useRef } from "react";
import { ServiceDTO } from "@/types/service.type";
import styles from "./view-service-modal.module.scss";

const STATUS_COLOR: Record<string, string> = {
    Active:       styles.statusActive,
    Inactive:     styles.statusInactive,
    Discontinued: styles.statusDiscontinued,
};

function fmtDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return [h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : ""].filter(Boolean).join(" ");
}

interface Props {
    service: ServiceDTO | null;
    onClose: () => void;
    onEdit?: () => void;
}

export default function ViewServiceModal({ service, onClose, onEdit }: Props) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!service) return;
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", h);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", h);
            document.body.style.overflow = "";
        };
    }, [service, onClose]);

    if (!service) return null;

    const hasDiscount = service.basePrice > service.price;
    const discountPct = hasDiscount
        ? Math.round(((service.basePrice - service.price) / service.basePrice) * 100)
        : 0;

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={styles.modal} role="dialog" aria-modal="true">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.iconWrap}>
                            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className={styles.title}>{service.name}</h2>
                            <span className={`${styles.badge} ${STATUS_COLOR[service.status] ?? styles.statusInactive}`}>
                                {service.status}
                            </span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Stats row */}
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                                </svg>
                            </span>
                            <span className={styles.statLabel}>Price</span>
                            <span className={styles.statValue}>
                                {service.price.toLocaleString("vi-VN")}đ
                                {hasDiscount && (
                                    <span className={styles.discountBadge}>-{discountPct}%</span>
                                )}
                            </span>
                            {hasDiscount && (
                                <span className={styles.basePrice}>
                                    {service.basePrice.toLocaleString("vi-VN")}đ
                                </span>
                            )}
                        </div>

                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M12 7v5l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <span className={styles.statLabel}>Duration</span>
                            <span className={styles.statValue}>{fmtDuration(service.durationMinutes)}</span>
                        </div>

                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <span className={styles.statLabel}>Created</span>
                            <span className={styles.statValue}>
                                {service.createdAt
                                    ? new Date(service.createdAt).toLocaleDateString("en-GB")
                                    : "—"}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {service.description && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Description</h3>
                            <p className={styles.description}>{service.description}</p>
                        </div>
                    )}

                    {/* Details grid */}
                    <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Service ID</span>
                            <span className={styles.detailValue} title={service.id}>
                                {service.id.slice(0, 8)}…
                            </span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Duration (min)</span>
                            <span className={styles.detailValue}>{service.durationMinutes}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Sale Price</span>
                            <span className={styles.detailValue}>{service.price.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Base Price</span>
                            <span className={styles.detailValue}>{service.basePrice.toLocaleString("vi-VN")}đ</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button className={styles.btnClose} onClick={onClose}>Close</button>
                    {onEdit && (
                        <button className={styles.btnEdit} onClick={onEdit}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Edit Service
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

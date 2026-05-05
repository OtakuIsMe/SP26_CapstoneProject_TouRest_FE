"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { userService } from "@/libs/services/user.service";
import { UserDTO } from "@/types/user.type";
import styles from "./view-user-modal.module.scss";

const ROLE_CLS: Record<string, string> = {
    admin:    styles.roleAdmin,
    customer: styles.roleCustomer,
    agency:   styles.roleAgency,
    provider: styles.roleProvider,
};

const STATUS_CLS: Record<string, string> = {
    Active:   styles.statusActive,
    Inactive: styles.statusInactive,
    Locked:   styles.statusLocked,
};

interface Props {
    userId: string | null;
    onClose: () => void;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className={styles.infoRow}>
            <span className={styles.infoIcon}>{icon}</span>
            <div className={styles.infoContent}>
                <span className={styles.infoLabel}>{label}</span>
                <span className={styles.infoValue}>{value}</span>
            </div>
        </div>
    );
}

export default function ViewUserModal({ userId, onClose }: Props) {
    const overlayRef           = useRef<HTMLDivElement>(null);
    const [user, setUser]      = useState<UserDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]    = useState("");

    useEffect(() => {
        if (!userId) { setUser(null); return; }
        setLoading(true);
        setError("");
        userService.getById(userId)
            .then(res => setUser(res.data))
            .catch(() => setError("Failed to load user details."))
            .finally(() => setLoading(false));
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [userId, onClose]);

    if (!userId) return null;

    const initial = user?.username?.[0]?.toUpperCase() ?? "?";

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>User Details</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {loading && (
                        <div className={styles.center}>
                            <span className={styles.spinner} />
                        </div>
                    )}

                    {error && !loading && (
                        <div className={styles.center}>
                            <p className={styles.errorText}>{error}</p>
                        </div>
                    )}

                    {user && !loading && (
                        <>
                            {/* Profile section */}
                            <div className={styles.profile}>
                                <div className={styles.avatarWrap}>
                                    {user.imageUrl ? (
                                        <Image
                                            src={user.imageUrl}
                                            alt={user.username}
                                            width={72}
                                            height={72}
                                            className={styles.avatarImg}
                                            unoptimized
                                        />
                                    ) : (
                                        <div className={styles.avatarFallback}>{initial}</div>
                                    )}
                                </div>
                                <div className={styles.profileMeta}>
                                    <div className={styles.profileTop}>
                                        <span className={styles.profileName}>{user.username}</span>
                                        <span className={`${styles.roleBadge} ${ROLE_CLS[user.role] ?? styles.roleCustomer}`}>
                                            {user.role.toUpperCase()}
                                        </span>
                                        <span className={`${styles.statusBadge} ${STATUS_CLS[user.status] ?? ""}`}>
                                            {user.status}
                                        </span>
                                    </div>
                                    {user.fullName && (
                                        <span className={styles.profileFullName}>{user.fullName}</span>
                                    )}
                                    <span className={styles.profileJoined}>
                                        Joined {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.divider} />

                            {/* Info grid */}
                            <div className={styles.infoGrid}>
                                <InfoRow
                                    label="Email"
                                    value={user.email}
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="m2 7 10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                    }
                                />
                                <InfoRow
                                    label="Phone"
                                    value={user.phone}
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                    }
                                />
                                <InfoRow
                                    label="Date of Birth"
                                    value={user.dateOfBirth
                                        ? new Date(user.dateOfBirth).toLocaleDateString("en-GB")
                                        : undefined}
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                    }
                                />
                                <InfoRow
                                    label="Address"
                                    value={user.addressDetail}
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/>
                                            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
                                        </svg>
                                    }
                                />
                                <InfoRow
                                    label="City"
                                    value={user.cityId}
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                            <path d="M3 21h18M3 7l9-4 9 4M4 21V7M20 21V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            <path d="M9 21v-4h6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                    }
                                />
                                <InfoRow
                                    label="District"
                                    value={user.districtId}
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                            <path d="M3 21h18M3 7l9-4 9 4M4 21V7M20 21V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            <path d="M9 21v-4h6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                    }
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

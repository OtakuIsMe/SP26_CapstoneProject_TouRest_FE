"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./manage-layout.module.scss";
import type { Role } from "./manage-sidebar";
import { authService } from "@/libs/services/auth.service";
import { walletService, type WalletDTO } from "@/libs/services/wallet.service";
import { StorageKeys } from "@/constants/storage";
import { useNotifications } from "@/contexts/notification.context";
import {
    entityTypeToNotifType,
    timeAgo,
    NOTIF_COLOR,
    type NotifType,
} from "@/utils/notification.utils";

// Dùng chung cho cả 3 role — tên trang theo pathname
const TITLES: Record<string, string> = {
    "/dashboard":             "Dashboard",
    "/dashboard/orders":      "Orders",
    "/dashboard/bookings":    "Bookings",
    "/dashboard/tours":       "Tours",
    "/dashboard/agencies":    "Agencies",
    "/dashboard/providers":   "Providers",
    "/dashboard/users":       "Users",
    "/dashboard/customers":   "Customers",
    "/dashboard/content":     "Content",
    "/dashboard/services":    "Services",
    "/dashboard/jobs":        "Jobs",
    "/dashboard/invoices":    "Invoices",
    "/dashboard/transactions":"Transactions",
    "/dashboard/reports":     "Reports",
    "/dashboard/analytics":   "Analytics",
    "/dashboard/discounts":   "Discounts",
    "/dashboard/settings":    "Settings",
    "/dashboard/help":        "Help & Support",
    "/admin/schedule":        "Schedule",
    "/agency/dashboard":      "Dashboard",
    "/agency/tours":          "Tours",
    "/agency/jobs":           "Jobs",
    "/agency/bookings":       "Bookings",
    "/agency/customers":      "Customers",
    "/agency/content":        "Content",
    "/agency/invoices":       "Invoices",
    "/agency/transactions":   "Transactions",
    "/agency/reports":        "Reports",
    "/agency/analytics":      "Analytics",
    "/agency/discounts":      "Discounts",
    "/provider/dashboard":    "Dashboard",
    "/provider/services":     "Services",
    "/provider/packages":     "Packages",
    "/provider/customers":    "Customers",
    "/provider/jobs":         "Jobs",
    "/provider/bookings":     "Bookings",
};

const BellIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const CalIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
);
const WidgetIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M14 17.5h7M17.5 14v7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
);
const ExportIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const AVATAR:      Record<Role, string> = { admin: "AD", agency: "AG", provider: "PR" };
const AVATAR_NAME: Record<Role, string> = { admin: "Admin", agency: "Agency", provider: "Provider" };

const NOTIF_ICON: Record<NotifType, React.ReactNode> = {
    booking: (
        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    ),
    tour: (
        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
    ),
    system: (
        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    ),
    payment: (
        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
    ),
};

export default function ManageHeader({ role }: { role: Role }) {
    const pathname = usePathname();
    const router   = useRouter();
    const title    = TITLES[pathname] ?? "Dashboard";
    const isDashboard = pathname === "/dashboard";

    const {
        notifs,
        unreadCount,
        fetchNotifications,
        markAllRead,
        handleNotificationClick,
    } = useNotifications();

    const [avatarOpen,   setAvatarOpen]   = useState(false);
    const [notifOpen,    setNotifOpen]    = useState(false);
    const [activeTab,    setActiveTab]    = useState<"all" | "unread">("all");
    const [wallet,       setWallet]       = useState<WalletDTO | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);
    const notifRef  = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (notifOpen) fetchNotifications();
    }, [notifOpen, fetchNotifications]);

    useEffect(() => {
        if (!avatarOpen || wallet || walletLoading) return;
        setWalletLoading(true);
        walletService.getMyWallet()
            .then(res => { if (res.data) setWallet(res.data); })
            .catch(() => {})
            .finally(() => setWalletLoading(false));
    }, [avatarOpen, wallet, walletLoading]);

    const displayedNotifs = activeTab === "unread" ? notifs.filter(n => !n.isRead) : notifs;

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (avatarRef.current && !avatarRef.current.contains(e.target as Node))
                setAvatarOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node))
                setNotifOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    async function handleLogout() {
        setAvatarOpen(false);
        try { await authService.logout(); } catch { }
        localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
        document.cookie = "role=; path=/; max-age=0";
        router.push("/signin");
    }

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <h1 className={styles.headerTitle}>{title}</h1>
            </div>

            <div className={styles.headerRight}>
                {isDashboard && (
                    <>
                        <div className={styles.headerDateRange}>
                            <CalIcon />
                            Jan 1, 2026 – Mar 1, 2026
                        </div>
                        <button className={styles.headerPeriod}>Last 30 days ▾</button>
                        <button className={styles.headerBtnOutline}>
                            <WidgetIcon /> Add widget
                        </button>
                        <button className={styles.headerBtnPrimary}>
                            <ExportIcon /> Export
                        </button>
                    </>
                )}

                <div className={styles.notifWrap} ref={notifRef}>
                    <button
                        className={styles.headerNotif}
                        aria-label="Notifications"
                        onClick={() => { setNotifOpen(o => !o); setAvatarOpen(false); }}
                    >
                        <BellIcon />
                        {unreadCount > 0 && (
                            <span className={styles.notifBadge}>
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className={styles.notifDropdown}>
                            <div className={styles.notifDropHeader}>
                                <span className={styles.notifDropTitle}>Notifications</span>
                                {unreadCount > 0 && (
                                    <button className={styles.notifMarkAll} onClick={markAllRead}>
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className={styles.notifTabs}>
                                <span
                                    className={`${styles.notifTab} ${activeTab === "all" ? styles.notifTabActive : ""}`}
                                    onClick={() => setActiveTab("all")}
                                >All</span>
                                <span
                                    className={`${styles.notifTab} ${activeTab === "unread" ? styles.notifTabActive : ""}`}
                                    onClick={() => setActiveTab("unread")}
                                >Unread {unreadCount > 0 && <b>{unreadCount}</b>}</span>
                            </div>

                            <div className={styles.notifList}>
                                {displayedNotifs.length === 0 ? (
                                    <div style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                                        No notifications
                                    </div>
                                ) : displayedNotifs.map(n => {
                                    const type = entityTypeToNotifType(n.entityType);
                                    const cfg  = NOTIF_COLOR[type];
                                    return (
                                        <div
                                            key={n.id}
                                            className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : ""}`}
                                            onClick={() => handleNotificationClick(n)}
                                        >
                                            <div className={styles.notifItemIcon} style={{ background: cfg.bg, color: cfg.color }}>
                                                {NOTIF_ICON[type]}
                                            </div>
                                            <div className={styles.notifItemBody}>
                                                <p className={styles.notifItemTitle}>{n.title}</p>
                                                <p className={styles.notifItemDesc}>{n.message}</p>
                                                <span className={styles.notifItemTime}>{timeAgo(n.createdAt)}</span>
                                            </div>
                                            {!n.isRead && <span className={styles.notifDotSmall} />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={styles.notifDropFooter}>
                                <button className={styles.notifViewAll}>View all notifications</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.avatarWrap} ref={avatarRef}>
                    <div
                        className={styles.headerAvatar}
                        onClick={() => { setAvatarOpen(o => !o); setNotifOpen(false); }}
                    >
                        <div className={styles.avatarCircle}>{AVATAR[role]}</div>
                        <span className={styles.avatarName}>{AVATAR_NAME[role]}</span>
                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12" style={{ color: "#9ca3af", flexShrink: 0 }}>
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>

                    {avatarOpen && (
                        <div className={styles.avatarDropdown}>
                            <div className={styles.avatarDropHeader}>
                                <div className={styles.avatarCircleLg}>{AVATAR[role]}</div>
                                <div>
                                    <p className={styles.avatarDropName}>{AVATAR_NAME[role]}</p>
                                    <p className={styles.avatarDropRole}>{role}</p>
                                </div>
                            </div>
                            <div className={styles.avatarBalance}>
                                <div className={styles.avatarBalanceLabel}>Wallet balance</div>
                                <div className={styles.avatarBalanceAmount}>
                                    {walletLoading ? "Loading…" : wallet ? `₫${wallet.balance.toLocaleString("vi-VN")}` : "—"}
                                </div>
                                {wallet?.pendingBalance ? (
                                    <div className={styles.avatarBalancePending}>
                                        Pending +{wallet.pendingBalance.toLocaleString("vi-VN")}₫
                                    </div>
                                ) : null}
                            </div>
                            <div className={styles.avatarDropDivider} />
                            <button className={styles.avatarDropItem}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                </svg>
                                Profile
                            </button>
                            <button className={styles.avatarDropItem}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/>
                                </svg>
                                Settings
                            </button>
                            <div className={styles.avatarDropDivider} />
                            <button className={`${styles.avatarDropItem} ${styles.avatarDropLogout}`} onClick={handleLogout}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

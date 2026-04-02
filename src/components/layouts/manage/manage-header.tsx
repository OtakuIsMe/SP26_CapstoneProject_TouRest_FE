"use client";

import { usePathname } from "next/navigation";
import styles from "./manage-layout.module.scss";
import type { Role } from "./manage-sidebar";

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

export default function ManageHeader({ role }: { role: Role }) {
    const pathname = usePathname();
    const title = TITLES[pathname] ?? "Dashboard";
    const isDashboard = pathname === "/dashboard";

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

                <button className={styles.headerNotif} aria-label="Notifications">
                    <BellIcon />
                    <span className={styles.notifDot} />
                </button>

                <div className={styles.headerAvatar}>
                    <div className={styles.avatarCircle}>{AVATAR[role]}</div>
                    <span className={styles.avatarName}>{AVATAR_NAME[role]}</span>
                </div>
            </div>
        </header>
    );
}

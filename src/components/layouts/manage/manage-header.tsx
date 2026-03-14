"use client";

import { usePathname } from "next/navigation";
import styles from "./manage-layout.module.scss";
import type { Role } from "./manage-sidebar";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/users": "Users",
    "/dashboard/reports": "Reports",
    "/dashboard/tours": "Tours",
    "/dashboard/jobs": "Jobs",
};

function getPageTitle(pathname: string): string {
    return PAGE_TITLES[pathname] ?? "Dashboard";
}

export default function ManageHeader({ role }: { role: Role }) {
    const pathname = usePathname();
    const pageTitle = getPageTitle(pathname);

    const initials = role.slice(0, 2).toUpperCase();

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <span className={styles.headerBreadcrumb}>TouRest</span>
                <span className={styles.headerSep}>/</span>
                <span className={styles.headerTitle}>{pageTitle}</span>
            </div>

            <div className={styles.headerRight}>
                {/* Notification bell */}
                <button className={styles.headerNotif} aria-label="Notifications">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span className={styles.notifDot} />
                </button>

                {/* Avatar */}
                <div className={styles.headerAvatar}>
                    <div className={styles.avatarCircle}>{initials}</div>
                    <span className={styles.avatarName}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                </div>
            </div>
        </header>
    );
}

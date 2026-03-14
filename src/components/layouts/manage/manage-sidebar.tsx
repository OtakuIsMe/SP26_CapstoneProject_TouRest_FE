"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./manage-layout.module.scss";

export type Role = "admin" | "agency" | "provider";

type MenuItem = {
    label: string;
    href: string;
    icon: React.ReactNode;
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const DashboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
);

const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="7" r="3.25" stroke="currentColor" strokeWidth="1.7" />
        <path d="M2.5 20c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M16 11c1.66 0 3 1.34 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M18.5 20c0-1.93-.78-3.68-2.04-4.95" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M21.5 20h-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);

const ReportsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 20h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <rect x="4" y="12" width="3.5" height="8" rx="1" stroke="currentColor" strokeWidth="1.7" />
        <rect x="10.25" y="7" width="3.5" height="13" rx="1" stroke="currentColor" strokeWidth="1.7" />
        <rect x="16.5" y="3" width="3.5" height="17" rx="1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
);

const ToursIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
);

const JobsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);

const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);

// ─── Menu Config ──────────────────────────────────────────────────────────────
const MENU_CONFIG: Record<Role, MenuItem[]> = {
    admin: [
        { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
        { label: "Users", href: "/dashboard/users", icon: <UsersIcon /> },
        { label: "Reports", href: "/dashboard/reports", icon: <ReportsIcon /> },
    ],
    agency: [
        { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
        { label: "Users", href: "/dashboard/users", icon: <UsersIcon /> },
        { label: "Tours", href: "/dashboard/tours", icon: <ToursIcon /> },
    ],
    provider: [
        { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
        { label: "Users", href: "/dashboard/users", icon: <UsersIcon /> },
        { label: "Jobs", href: "/dashboard/jobs", icon: <JobsIcon /> },
    ],
};

const ROLE_LABEL: Record<Role, string> = {
    admin: "Admin",
    agency: "Agency",
    provider: "Provider",
};

const ROLE_BADGE_CLASS: Record<Role, string> = {
    admin: styles.roleAdmin,
    agency: styles.roleAgency,
    provider: styles.roleProvider,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ManageSidebar({ role }: { role: Role }) {
    const pathname = usePathname();
    const menuItems = MENU_CONFIG[role];

    function isActive(href: string) {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    }

    return (
        <aside className={styles.sidebar}>
            {/* Logo */}
            <Link href="/dashboard" className={styles.sidebarLogo}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                        fill="currentColor"
                    />
                </svg>
                TouRest
            </Link>

            {/* Role Badge */}
            <span className={`${styles.sidebarRoleBadge} ${ROLE_BADGE_CLASS[role]}`}>
                {ROLE_LABEL[role]}
            </span>

            {/* Navigation */}
            <nav className={styles.sidebarNav}>
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ""}`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div className={styles.sidebarFooter}>
                <button className={styles.logoutBtn}>
                    <LogoutIcon />
                    Log out
                </button>
            </div>
        </aside>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/libs/services/auth.service";
import { StorageKeys } from "@/constants/storage";
import styles from "./manage-layout.module.scss";

export type Role = "admin" | "agency" | "provider";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = {
    Dashboard: () => <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/></svg>,
    Orders:    () => <svg viewBox="0 0 24 24" fill="none"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
    Tours:     () => <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7"/></svg>,
    Agencies:  () => <svg viewBox="0 0 24 24" fill="none"><path d="M3 21V7l9-4 9 4v14" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
    Providers: () => <svg viewBox="0 0 24 24" fill="none"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.7"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    Customers: () => <svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
    Content:   () => <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
    Finance:   () => <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.7"/></svg>,
    Analytics: () => <svg viewBox="0 0 24 24" fill="none"><path d="M3 20h18M4 20V10l5-5 4 4 5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    Discounts: () => <svg viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>,
    Jobs:      () => <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    Requests:  () => <svg viewBox="0 0 24 24" fill="none"><path d="M18 8h1a4 4 0 010 8h-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M6 1v3M10 1v3M14 1v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
    Packages:  () => <svg viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
    Services:  () => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
    Settings:  () => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.7"/></svg>,
    Help:      () => <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
    Logout:    () => <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
};

// ─── Menu config — tất cả dùng /dashboard/* ───────────────────────────────────
type NavItem  = { label: string; href: string; icon: React.ReactNode; badge?: number };
type NavGroup = { items: NavItem[] };
type FinGroup = { isFinance: true; sub: { label: string; href: string }[] };
type Entry    = NavGroup | FinGroup;

const isFin = (e: Entry): e is FinGroup => "isFinance" in e;

const MENU: Record<Role, Entry[]> = {
    admin: [
        { items: [
            { label: "Dashboard", href: "/admin/dashboard", icon: <Ico.Dashboard /> },
            { label: "Orders",    href: "/admin/orders",    icon: <Ico.Orders />,    badge: 46 },
            { label: "Tours",     href: "/admin/tours",     icon: <Ico.Tours />,     badge: 12 },
            { label: "Agencies",  href: "/admin/agencies",  icon: <Ico.Agencies />  },
            { label: "Providers", href: "/admin/providers", icon: <Ico.Providers /> },
            { label: "Requests",  href: "/admin/requests",  icon: <Ico.Requests />  },
            { label: "Users",     href: "/admin/users",     icon: <Ico.Customers /> },
            { label: "Content",   href: "/admin/content",   icon: <Ico.Content />   },
        ]},
        { isFinance: true, sub: [
            { label: "Invoices",     href: "/admin/invoices"     },
            { label: "Transactions", href: "/admin/transactions" },
            { label: "Reports",      href: "/admin/reports"      },
        ]},
        { items: [
            { label: "Analytics", href: "/admin/analytics", icon: <Ico.Analytics /> },
            { label: "Discounts", href: "/admin/discounts", icon: <Ico.Discounts /> },
        ]},
    ],
    agency: [
        { items: [
            { label: "Dashboard", href: "/agency/dashboard", icon: <Ico.Dashboard /> },
            { label: "Bookings",  href: "/agency/bookings",  icon: <Ico.Orders />,    badge: 8 },
            { label: "Tours",     href: "/agency/tours",     icon: <Ico.Tours />    },
            { label: "Customers", href: "/agency/customers", icon: <Ico.Customers /> },
            { label: "Content",   href: "/agency/content",   icon: <Ico.Content />   },
        ]},
        { isFinance: true, sub: [
            { label: "Invoices",     href: "/agency/invoices"     },
            { label: "Transactions", href: "/agency/transactions" },
            { label: "Reports",      href: "/agency/reports"      },
        ]},
        { items: [
            { label: "Analytics", href: "/agency/analytics", icon: <Ico.Analytics /> },
            { label: "Discounts", href: "/agency/discounts", icon: <Ico.Discounts /> },
        ]},
    ],
    provider: [
        { items: [
            { label: "Dashboard", href: "/provider/dashboard", icon: <Ico.Dashboard /> },
            { label: "Bookings",  href: "/provider/bookings",  icon: <Ico.Orders />, badge: 5 },
            { label: "Services",  href: "/provider/services",  icon: <Ico.Services /> },
            { label: "Packages",  href: "/provider/packages",  icon: <Ico.Packages /> },
            { label: "Customers", href: "/provider/customers", icon: <Ico.Customers /> },
            { label: "Jobs",      href: "/provider/jobs",      icon: <Ico.Jobs />    },
        ]},
        { isFinance: true, sub: [
            { label: "Invoices",     href: "/provider/invoices"     },
            { label: "Transactions", href: "/provider/transactions" },
            { label: "Reports",      href: "/provider/reports"      },
        ]},
        { items: [
            { label: "Analytics", href: "/provider/analytics", icon: <Ico.Analytics /> },
        ]},
    ],
};

const LOGO_SVG = (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ color: "#3b82f6" }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
const BASE: Record<Role, string> = {
    admin:    "/admin/dashboard",
    agency:   "/agency/dashboard",
    provider: "/provider/dashboard",
};

export default function ManageSidebar({ role }: { role: Role }) {
    const pathname = usePathname();
    const router = useRouter();
    const base = BASE[role];

    async function handleLogout() {
        try { await authService.logout(); } catch { }
        localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
        document.cookie = "role=; path=/; max-age=0";
        router.push("/signin");
    }
    const [finOpen, setFinOpen] = useState(() =>
        ["/invoices", "/transactions", "/reports"].some(p => pathname.includes(p))
    );

    const isActive = (href: string) =>
        href === base ? pathname === base : pathname.startsWith(href);

    const isFinActive = (sub: { href: string }[]) =>
        sub.some(s => pathname.startsWith(s.href));

    return (
        <aside className={styles.sidebar}>
            {/* ── Logo ── */}
            <Link href={base} className={styles.sidebarLogo}>
                {LOGO_SVG}
                <span className={styles.logoTou}>Tou</span>
                <span className={styles.logoRest}>Rest</span>
            </Link>

            {/* ── Nav ── */}
            <nav className={styles.sidebarNav}>
                {MENU[role].map((entry, i) => {
                    if (isFin(entry)) {
                        const active = isFinActive(entry.sub);
                        return (
                            <div key={i}>
                                <div className={styles.navDivider} />
                                <button
                                    className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                                    onClick={() => setFinOpen(o => !o)}
                                >
                                    <Ico.Finance />
                                    Finances
                                    <span className={`${styles.navArrow} ${finOpen ? styles.navArrowOpen : ""}`}>▾</span>
                                </button>
                                {finOpen && (
                                    <div className={styles.subMenu}>
                                        {entry.sub.map(s => (
                                            <Link
                                                key={s.href}
                                                href={s.href}
                                                className={`${styles.subItem} ${pathname === s.href ? styles.subItemActive : ""}`}
                                            >
                                                {s.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                <div className={styles.navDivider} />
                            </div>
                        );
                    }
                    return (
                        <div key={i}>
                            {entry.items.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ""}`}
                                >
                                    {item.icon}
                                    {item.label}
                                    {item.badge !== undefined && (
                                        <span className={styles.navBadge}>{item.badge}</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    );
                })}
            </nav>

            {/* ── Footer ── */}
            <div className={styles.sidebarFooter}>
                <Link href="/dashboard/settings" className={styles.footerItem}><Ico.Settings /> Settings</Link>
                <Link href="/dashboard/help" className={styles.footerItem}><Ico.Help /> Help & Support</Link>
                <button className={styles.logoutBtn} onClick={handleLogout}><Ico.Logout /> Log out</button>
            </div>

            {/* ── Upgrade card ── */}
            <div className={styles.upgradeCard}>
                <span className={styles.upgradeIcon}>⚡</span>
                <p className={styles.upgradeTitle}>Upgrade to Premium!</p>
                <p className={styles.upgradeSub}>Upgrade your account and unlock all of the benefits.</p>
                <button className={styles.upgradeBtn}>Upgrade premium</button>
            </div>
        </aside>
    );
}

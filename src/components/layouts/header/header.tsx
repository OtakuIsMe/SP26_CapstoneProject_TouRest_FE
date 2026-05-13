"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/libs/services/auth.service";
import { notificationService, NotificationDTO, NotificationEntityType } from "@/libs/services/notification.service";
import { StorageKeys } from "@/constants/storage";
import styles from "./header.module.scss";

// ── Notification helpers ──────────────────────────────────────────────────────
type NotifType = "booking" | "tour" | "system" | "payment";

function entityTypeToNotifType(entityType: NotificationEntityType): NotifType {
    switch (entityType) {
        case "Booking":   return "booking";
        case "Refund":    return "payment";
        case "Itinerary":
        case "Package":
        case "Service":   return "tour";
        default:          return "system";
    }
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)   return "Just now";
    if (m < 60)  return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h} hr ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Yesterday";
    return `${d} days ago`;
}

const NOTIF_COLOR: Record<NotifType, { bg: string; color: string }> = {
    booking: { bg: "#eff6ff", color: "#3b82f6" },
    tour:    { bg: "#f0fdf4", color: "#16a34a" },
    system:  { bg: "#fffbeb", color: "#d97706" },
    payment: { bg: "#f5f3ff", color: "#7c3aed" },
};

const NOTIF_ICON: Record<NotifType, React.ReactNode> = {
    booking: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    tour:    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
    system:  <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    payment: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/></svg>,
};

const navItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Popular Destinations", href: "/destinations" },
  { label: "Our Packages", href: "/packages" },
  { label: "Help", href: "/report" },
];

interface HeaderProps {
  variant?: "transparent" | "solid";
}

export default function Header({ variant = "transparent" }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn,    setLoggedIn]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifs,      setNotifs]      = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getMyNotifications();
      if (res.data) setNotifs(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res.data !== undefined) setUnreadCount(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
    setLoggedIn(!!token);
    if (token) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchUnreadCount]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    const notif = notifs.find(n => n.id === id);
    if (!notif || notif.isRead) return;
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    try { await notificationService.markAsRead(id); } catch { /* ignore */ }
  }

  async function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await notificationService.markAllAsRead(); } catch { /* ignore */ }
  }

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
    document.cookie = "role=; path=/; max-age=0";
    setLoggedIn(false);
    setMenuOpen(false);
    router.push("/signin");
  }

  return (
    <header className={`${styles.header} ${variant === "solid" ? styles.headerSolid : ""}`}>
      <Link href="/" className={styles.logo}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            fill="currentColor"
          />
        </svg>
        TouRest
      </Link>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.actions}>
        {loggedIn ? (
          <>
            {/* ── Notification bell ── */}
            <div className={styles.notifWrap} ref={notifRef}>
              <button
                type="button"
                className={styles.notifBtn}
                aria-label="Notifications"
                onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
                      <button type="button" className={styles.notifMarkAll} onClick={markAllRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className={styles.notifList}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                        No notifications yet
                      </div>
                    ) : notifs.map(n => {
                      const type = entityTypeToNotifType(n.entityType);
                      const cfg  = NOTIF_COLOR[type];
                      return (
                        <div
                          key={n.id}
                          className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : ""}`}
                          onClick={() => markRead(n.id)}
                        >
                          <div className={styles.notifIcon} style={{ background: cfg.bg, color: cfg.color }}>
                            {NOTIF_ICON[type]}
                          </div>
                          <div className={styles.notifBody}>
                            <p className={styles.notifTitle}>{n.title}</p>
                            <p className={styles.notifDesc}>{n.message}</p>
                            <span className={styles.notifTime}>{timeAgo(n.createdAt)}</span>
                          </div>
                          {!n.isRead && <span className={styles.notifDot} />}
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.notifFooter}>
                    <button type="button" className={styles.notifViewAll}>View all notifications</button>
                  </div>
                </div>
              )}
            </div>

          <div className={styles.avatarWrapper} ref={menuRef}>
            <button
              className={styles.avatar}
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
            >
              <img src="/avatar.png" alt="User" />
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                <Link href="/profile" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Profile
                </Link>
                <Link href="/settings" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Settings
                </Link>
                <div className={styles.dropdownDivider} />
                <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleLogout} type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
          </>
        ) : (
          <Link href="/signin" className={styles.signInBtn}>Sign In</Link>
        )}
      </div>
    </header>
  );
}

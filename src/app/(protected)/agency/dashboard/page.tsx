"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import { agencyService } from "@/libs/services/agency.service";
import type { AgencyDashboardStats, GuideWorkload, RecentBooking, UpcomingSchedule } from "@/types/dashboard.type";

// ── Helpers ───────────────────────────────────────────────────────────────────
const now   = new Date();
const today = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const Y     = now.getFullYear();
const curMo = now.getMonth();

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BOOKING_BARS_BASE = [42, 68, 55, 90, 72, 110, 95, 130, 118, 145, 128, 160];

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
    confirmed: { bg: "#d1fae5", color: "#065f46", label: "Confirmed" },
    pending:   { bg: "#fef3c7", color: "#92400e", label: "Pending"   },
    cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#22c55e","#f59e0b","#ef4444","#6366f1","#ec4899","#14b8a6"];
function avatarColor(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function fmtMoney(n: number): string {
    return "₫" + n.toLocaleString("vi-VN");
}

function fmtD(s: string): string {
    return new Date(s.includes("T") ? s : s + "T00:00:00")
        .toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// ── Static icon config ────────────────────────────────────────────────────────
const STAT_ICONS = [
    {
        label: "Active Tours", iconBg: "#eff6ff", iconColor: "#3b82f6",
        icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
    },
    {
        label: "Schedules Today", iconBg: "#f0fdf4", iconColor: "#22c55e",
        icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="16" r="2" fill="currentColor"/></svg>,
    },
    {
        label: "Monthly Bookings", iconBg: "#fffbeb", iconColor: "#f59e0b",
        icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    },
    {
        label: "Monthly Revenue", iconBg: "#f5f3ff", iconColor: "#8b5cf6",
        icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgencyDashboard() {
    const [stats,     setStats]     = useState<AgencyDashboardStats | null>(null);
    const [schedules, setSchedules] = useState<UpcomingSchedule[]>([]);
    const [bookings,  setBookings]  = useState<RecentBooking[]>([]);
    const [guides,    setGuides]    = useState<GuideWorkload[]>([]);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        Promise.all([
            agencyService.getDashboardStats(),
            agencyService.getUpcomingSchedules(),
            agencyService.getRecentBookings(),
            agencyService.getGuideWorkload(),
        ]).then(([sRes, scRes, bRes, gRes]) => {
            if (sRes?.data)  setStats(sRes.data);
            if (scRes?.data) setSchedules(scRes.data);
            if (bRes?.data)  setBookings(bRes.data);
            if (gRes?.data)  setGuides(gRes.data);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const bookingBars = BOOKING_BARS_BASE.map((v, i) =>
        i === curMo && stats ? stats.monthlyBookings : v,
    );
    const maxBar = Math.max(...bookingBars, 1);

    const statsData = stats
        ? [
            { ...STAT_ICONS[0], value: String(stats.activeTours),   delta: `+${stats.activeToursChangeThisMonth} this month`,           up: stats.activeToursChangeThisMonth >= 0 },
            { ...STAT_ICONS[1], value: String(stats.schedulesToday), delta: `${stats.schedulesTodayConfirmed} confirmed · ${stats.schedulesTodayPending} pending`, up: true },
            { ...STAT_ICONS[2], value: String(stats.monthlyBookings),delta: `+${stats.monthlyBookingsChangeVsLastMonth} vs last month`,  up: stats.monthlyBookingsChangeVsLastMonth >= 0 },
            { ...STAT_ICONS[3], value: `₫${Math.round(stats.monthlyRevenue / 1_000_000)}M`, delta: `${stats.monthlyRevenueChangePercent >= 0 ? "+" : ""}${stats.monthlyRevenueChangePercent.toFixed(1)}% vs last month`, up: stats.monthlyRevenueChangePercent >= 0 },
          ]
        : STAT_ICONS.map(s => ({ ...s, value: "—", delta: "loading…", up: true }));

    return (
        <div className={styles.page}>

            {/* ── Welcome banner ── */}
            <div className={styles.welcome}>
                <div className={styles.welcomeText}>
                    <h2>Welcome back, Agency 👋</h2>
                    <p>Here&apos;s what&apos;s happening with your tours today — {today}</p>
                </div>
                <div className={styles.welcomeActions}>
                    <button className={`${styles.welcomeBtn} ${styles.outline}`}>View Reports</button>
                    <button className={`${styles.welcomeBtn} ${styles.primary}`}>+ New Tour</button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className={styles.statsRow}>
                {statsData.map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: s.iconBg, color: s.iconColor }}>
                            {s.icon}
                        </div>
                        <div className={styles.statBody}>
                            <p className={styles.statLabel}>{s.label}</p>
                            <p className={styles.statValue}>{s.value}</p>
                            <span className={`${styles.statDelta} ${s.up ? styles.deltaUp : styles.deltaDown}`}>
                                {s.up
                                    ? <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    : <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                }
                                {s.delta}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Mid row ── */}
            <div className={styles.midRow}>

                {/* Booking volume bar chart */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Booking Volume — {Y}</h3>
                        <button className={styles.cardLink}>View revenue →</button>
                    </div>
                    <div className={styles.chartWrap}>
                        <div className={styles.chartBars}>
                            {bookingBars.map((val, i) => {
                                const isCurrentMonth = i === curMo;
                                const isPast = i < curMo;
                                return (
                                    <div key={i} className={styles.barCol}>
                                        {isCurrentMonth && <span className={styles.barTopVal}>{val}</span>}
                                        <div
                                            className={styles.bar}
                                            style={{
                                                height: `${(val / maxBar) * 100}%`,
                                                background: isCurrentMonth ? "#3b82f6" : isPast ? "#dbeafe" : "#e5e7eb",
                                            }}
                                        />
                                        <span className={styles.barLabel}>{MONTHS_SHORT[i]}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles.chartLegend}>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#3b82f6" }}/> Current month</div>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#dbeafe" }}/> Past months</div>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#e5e7eb" }}/> Upcoming</div>
                        </div>
                    </div>
                </div>

                {/* Upcoming schedules */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Upcoming Schedules</h3>
                        <button className={styles.cardLink}>View all</button>
                    </div>
                    <div className={styles.tourList}>
                        {loading ? (
                            <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Loading…</p>
                        ) : schedules.length === 0 ? (
                            <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No upcoming schedules</p>
                        ) : schedules.map(s => {
                            const dt  = new Date(s.startTime);
                            const cfg = STATUS_CFG[(s.status ?? "pending").toLowerCase()] ?? STATUS_CFG.pending;
                            return (
                                <div key={s.id} className={styles.tourItem}>
                                    <div className={styles.tourDate}>
                                        <span className={styles.tourDateDay}>{dt.getDate()}</span>
                                        <span className={styles.tourDateMon}>{MONTHS_SHORT[dt.getMonth()]}</span>
                                    </div>
                                    <div className={styles.tourInfo}>
                                        <p className={styles.tourName}>{s.itineraryName}</p>
                                        <p className={styles.tourMeta}>
                                            {s.tourGuideName
                                                ? <><span style={{ color: "#22c55e" }}>●</span> {s.tourGuideName} · {s.pax} pax</>
                                                : <><span style={{ color: "#f59e0b" }}>⚠</span> No guide · {s.pax} pax</>
                                            }
                                        </p>
                                    </div>
                                    <span className={styles.tourBadge} style={{ background: cfg.bg, color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Bottom row ── */}
            <div className={styles.bottomRow}>

                {/* Recent bookings */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Recent Bookings</h3>
                        <button className={styles.cardLink}>View all</button>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>ID</th>
                                <th className={styles.th}>Customer</th>
                                <th className={styles.th}>Tour</th>
                                <th className={styles.th}>Date</th>
                                <th className={styles.th}>Amount</th>
                                <th className={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className={styles.td} style={{ textAlign: "center", color: "#9ca3af" }}>Loading…</td></tr>
                            ) : bookings.length === 0 ? (
                                <tr><td colSpan={6} className={styles.td} style={{ textAlign: "center", color: "#9ca3af" }}>No recent bookings</td></tr>
                            ) : bookings.map(b => {
                                const cfg = STATUS_CFG[(b.status ?? "pending").toLowerCase()] ?? STATUS_CFG.pending;
                                return (
                                    <tr key={b.bookingCode} className={styles.tr}>
                                        <td className={styles.td}><span className={styles.bookingId}>#{b.bookingCode}</span></td>
                                        <td className={styles.td}>
                                            <div className={styles.customerCell}>
                                                <div className={styles.customerAvatar} style={{ background: avatarColor(b.customerName) }}>
                                                    {b.customerName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                                </div>
                                                {b.customerName}
                                            </div>
                                        </td>
                                        <td className={`${styles.td} ${styles.tdLight}`}>{b.tourName}</td>
                                        <td className={`${styles.td} ${styles.tdLight}`}>{fmtD(b.bookingDate)}</td>
                                        <td className={styles.td} style={{ fontWeight: 600 }}>{fmtMoney(b.amount)}</td>
                                        <td className={styles.td}>
                                            <span className={styles.badge} style={{ background: cfg.bg, color: cfg.color }}>
                                                {cfg.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Guide workload */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Guide Workload</h3>
                        <button className={styles.cardLink}>Assign guides →</button>
                    </div>
                    <div className={styles.destList}>
                        {loading ? (
                            <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Loading…</p>
                        ) : guides.length === 0 ? (
                            <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No guide data</p>
                        ) : guides.map(g => {
                            const pct   = Math.min((g.activeTours / 4) * 100, 100);
                            const color = g.activeTours >= 3 ? "#ef4444" : g.activeTours >= 2 ? "#f59e0b" : "#22c55e";
                            return (
                                <div key={g.guideId} className={styles.guideItem}>
                                    <div className={styles.guideAvatar} style={{ background: avatarColor(g.guideName) }}>
                                        {g.guideName.split(" ").filter(Boolean).slice(-2).map(w => w[0]).join("")}
                                    </div>
                                    <div className={styles.guideBody}>
                                        <div className={styles.guideTop}>
                                            <span className={styles.guideName}>{g.guideName}</span>
                                            <span className={styles.guideCount} style={{ color }}>{g.activeTours} active</span>
                                        </div>
                                        <div className={styles.destBar}>
                                            <div className={styles.destFill} style={{ width: `${pct}%`, background: color }}/>
                                        </div>
                                        <span className={styles.guideTotal}>{g.completedTotal} completed total</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

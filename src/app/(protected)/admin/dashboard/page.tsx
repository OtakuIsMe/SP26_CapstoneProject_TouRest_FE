"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/libs/services/admin.service";
import { AdminDashboardStats, AdminTrend, PendingApproval, TopAgency } from "@/types/dashboard.type";
import styles from "./page.module.scss";

const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function monthToIndex(m: string): number {
    const n = parseInt(m, 10);
    if (!isNaN(n)) return Math.max(0, Math.min(11, n - 1));
    const short = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const full  = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    const lc = m.toLowerCase();
    const si = short.findIndex(s => lc.startsWith(s));
    if (si !== -1) return si;
    const fi = full.indexOf(lc);
    return fi !== -1 ? fi : 0;
}

function fmtRevM(v: number): string {
    if (v >= 1_000_000_000) return `₫${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000)     return `₫${Math.round(v / 1_000_000)}M`;
    return `₫${v.toLocaleString()}`;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
}

function avatarColor(name: string): string {
    const colors = ["#3b82f6","#8b5cf6","#f59e0b","#22c55e","#ef4444","#06b6d4","#ec4899"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return colors[h % colors.length];
}

const TYPE_CFG: Record<string, { bg: string; color: string }> = {
    Agency:   { bg: "#eff6ff", color: "#2563eb" },
    Provider: { bg: "#f0fdf4", color: "#16a34a" },
};

const PLATFORM_HEALTH = [
    { label: "System Uptime",   value: "99.8%", color: "#22c55e", pct: 99 },
    { label: "API Response",    value: "142ms",  color: "#3b82f6", pct: 85 },
    { label: "Failed Payments", value: "0.3%",  color: "#22c55e", pct: 97 },
];

const CW = 400, CH = 100;

function pts(data: number[], maxVal: number) {
    return data.map((v, i) => {
        const x = (i / (data.length - 1)) * CW;
        const y = CH - (v / maxVal) * CH * 0.9;
        return `${x},${y}`;
    }).join(" ");
}

function areaPath(data: number[], maxVal: number) {
    const top = data.map((v, i) => {
        const x = (i / (data.length - 1)) * CW;
        const y = CH - (v / maxVal) * CH * 0.9;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
    return `${top} L${CW},${CH} L0,${CH} Z`;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [stats, setStats]           = useState<AdminDashboardStats | null>(null);
    const [trend, setTrend]           = useState<AdminTrend | null>(null);
    const [approvals, setApprovals]   = useState<PendingApproval[]>([]);
    const [topAgencies, setTopAgencies] = useState<TopAgency[]>([]);
    const [loading, setLoading]       = useState(true);

    useEffect(() => {
        const year = new Date().getFullYear();
        Promise.all([
            adminService.getDashboardStats(),
            adminService.getDashboardTrend(year),
            adminService.getPendingApprovals(),
            adminService.getTopAgencies(5),
        ]).then(([s, t, a, ag]) => {
            if (s.data)  setStats(s.data);
            if (t.data)  setTrend(t.data);
            if (a.data)  setApprovals(a.data);
            if (ag.data) setTopAgencies(ag.data);
        }).finally(() => setLoading(false));
    }, []);

    // build 12-element arrays from real trend data
    const bookingsArr: number[] = Array(12).fill(0);
    const revenueArr:  number[] = Array(12).fill(0);
    if (trend) {
        trend.monthlyTrends.forEach(mt => {
            const i = monthToIndex(mt.month);
            bookingsArr[i] = mt.bookingsCount;
            revenueArr[i]  = mt.revenue / 10_000_000; // scale to ×10M₫
        });
    }
    const maxVal = Math.max(...bookingsArr, ...revenueArr, 1);

    const statCards = [
        {
            label: "Registered Agencies",
            value: stats ? stats.registeredAgencies.toLocaleString() : "—",
            delta: stats ? `+${stats.newAgenciesThisMonth} this month` : "",
            up: true,
            iconBg: "#eff6ff", iconColor: "#3b82f6",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M3 21V7l9-4 9 4v14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
            ),
        },
        {
            label: "Registered Providers",
            value: stats ? stats.registeredProviders.toLocaleString() : "—",
            delta: stats ? `+${stats.newProvidersThisMonth} this month` : "",
            up: true,
            iconBg: "#f0fdf4", iconColor: "#22c55e",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
        },
        {
            label: "Platform Bookings",
            value: stats ? stats.platformBookings.toLocaleString() : "—",
            delta: stats ? `+${stats.newBookingsThisMonth} this month` : "",
            up: true,
            iconBg: "#fffbeb", iconColor: "#f59e0b",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 14l2.5 2.5L16 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
        },
        {
            label: "Platform Revenue",
            value: stats ? fmtRevM(stats.platformRevenue) : "—",
            delta: stats ? `${stats.revenuePercentageChange >= 0 ? "+" : ""}${stats.revenuePercentageChange.toFixed(1)}% vs last month` : "",
            up: stats ? stats.revenuePercentageChange >= 0 : true,
            iconBg: "#f5f3ff", iconColor: "#8b5cf6",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
            ),
        },
    ];

    return (
        <div className={styles.page}>

            {/* ── Welcome banner ── */}
            <div className={styles.welcome}>
                <div className={styles.welcomeText}>
                    <h2>Platform Overview</h2>
                    <p>TouRest Admin · {today}</p>
                </div>
                <div className={styles.welcomeActions}>
                    <button className={`${styles.welcomeBtn} ${styles.outline}`}>
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Pending Reviews
                        <span className={styles.welcomeBadge}>{stats?.pendingReviewsCount ?? "—"}</span>
                    </button>
                    <button className={`${styles.welcomeBtn} ${styles.primary}`}>Platform Reports</button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className={styles.statsRow}>
                {statCards.map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: s.iconBg, color: s.iconColor }}>
                            {s.icon}
                        </div>
                        <div className={styles.statBody}>
                            <p className={styles.statLabel}>{s.label}</p>
                            <p className={styles.statValue}>{s.value}</p>
                            {s.delta && (
                                <span className={`${styles.statDelta} ${s.up ? styles.deltaUp : styles.deltaDown}`}>
                                    {s.up
                                        ? <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        : <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    }
                                    {s.delta}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Mid row ── */}
            <div className={styles.midRow}>

                {/* Booking & revenue trend */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Booking & Revenue Trend</h3>
                        <span className={styles.cardLink}>{trend?.year ?? new Date().getFullYear()}</span>
                    </div>
                    <div className={styles.chartBody}>
                        <div className={styles.chartMeta}>
                            <div>
                                <p className={styles.chartMetaNum} style={{ color: "#6366f1" }}>
                                    {trend ? trend.totalBookingsYtd.toLocaleString() : "—"}
                                </p>
                                <p className={styles.chartMetaSub}>Total bookings YTD</p>
                            </div>
                            <div className={styles.chartLegend}>
                                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#6366f1" }}/>Bookings</span>
                                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#f59e0b" }}/>Revenue (×10M₫)</span>
                            </div>
                        </div>
                        <div className={styles.chartWrap}>
                            <svg viewBox={`0 0 ${CW} ${CH}`} className={styles.chartSvg} preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="admGrad1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15"/>
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                                    </linearGradient>
                                    <linearGradient id="admGrad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12"/>
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
                                    </linearGradient>
                                </defs>
                                {[25, 50, 75].map(v => (
                                    <line key={v} x1="0" y1={CH - (v/100)*CH*0.9} x2={CW} y2={CH - (v/100)*CH*0.9}
                                        stroke="#f3f4f6" strokeWidth="1"/>
                                ))}
                                <path d={areaPath(revenueArr, maxVal)} fill="url(#admGrad2)"/>
                                <path d={areaPath(bookingsArr, maxVal)} fill="url(#admGrad1)"/>
                                <polyline points={pts(revenueArr, maxVal)} fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="5 3"/>
                                <polyline points={pts(bookingsArr, maxVal)} fill="none" stroke="#6366f1" strokeWidth="2.2"/>
                            </svg>
                        </div>
                        <div className={styles.chartXAxis}>
                            {MONTHS.map(m => <span key={m}>{m}</span>)}
                        </div>
                    </div>
                </div>

                {/* Pending approvals */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Pending Approvals</h3>
                        <span className={styles.pendingCount}>{approvals.length}</span>
                    </div>
                    <div className={styles.pendingList}>
                        {loading && <p className={styles.emptyMsg}>Loading…</p>}
                        {!loading && approvals.length === 0 && (
                            <p className={styles.emptyMsg}>No pending approvals</p>
                        )}
                        {approvals.map(item => {
                            const typeKey = item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase();
                            const cfg = TYPE_CFG[typeKey] ?? TYPE_CFG["Agency"];
                            const initials = (item.shortName || item.name.split(" ").map(w => w[0]).join("")).slice(0, 2).toUpperCase();
                            return (
                                <div key={item.requestId} className={styles.pendingItem}>
                                    <div className={styles.pendingAvatar} style={{ background: avatarColor(item.name) }}>
                                        {initials}
                                    </div>
                                    <div className={styles.pendingInfo}>
                                        <p className={styles.pendingName}>{item.name}</p>
                                        <div className={styles.pendingMeta}>
                                            <span className={styles.pendingType} style={{ background: cfg.bg, color: cfg.color }}>{typeKey}</span>
                                            <span className={styles.pendingTime}>{timeAgo(item.submittedAt)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.pendingActions}>
                                        <button className={styles.approveBtn}>✓</button>
                                        <button className={styles.rejectBtn}>✕</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className={styles.pendingFooter}>
                        <button className={styles.cardLink}>View all requests →</button>
                    </div>
                </div>
            </div>

            {/* ── Bottom row ── */}
            <div className={styles.bottomRow}>

                {/* Top agencies table */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Top Agencies by Revenue</h3>
                        <button className={styles.cardLink}>View all</button>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Agency</th>
                                <th className={styles.th}>Tours</th>
                                <th className={styles.th}>Bookings</th>
                                <th className={styles.th}>Revenue</th>
                                <th className={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={5} className={styles.td} style={{ textAlign: "center", color: "#9ca3af" }}>Loading…</td></tr>
                            )}
                            {!loading && topAgencies.length === 0 && (
                                <tr><td colSpan={5} className={styles.td} style={{ textAlign: "center", color: "#9ca3af" }}>No data</td></tr>
                            )}
                            {topAgencies.map((a, i) => {
                                const isActive = a.status?.toLowerCase() === "active";
                                return (
                                    <tr key={a.agencyId} className={styles.tr}>
                                        <td className={styles.td}>
                                            <div className={styles.agencyCell}>
                                                <div className={styles.agencyRank}>{i + 1}</div>
                                                <span className={styles.agencyName}>{a.agencyName}</span>
                                            </div>
                                        </td>
                                        <td className={styles.td} style={{ color: "#6b7280" }}>{a.toursCount}</td>
                                        <td className={styles.td} style={{ fontWeight: 600 }}>{a.bookingsCount}</td>
                                        <td className={styles.td} style={{ fontWeight: 700, color: "#6366f1" }}>{fmtRevM(a.totalRevenue)}</td>
                                        <td className={styles.td}>
                                            <span className={styles.badge} style={{
                                                background: isActive ? "#d1fae5" : "#fee2e2",
                                                color: isActive ? "#065f46" : "#991b1b",
                                            }}>
                                                {isActive ? "Active" : a.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Platform health (stays mock — no API) */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Platform Health</h3>
                        <span className={styles.healthDot}/>
                    </div>
                    <div className={styles.healthList}>
                        {PLATFORM_HEALTH.map(h => (
                            <div key={h.label} className={styles.healthItem}>
                                <div className={styles.healthTop}>
                                    <span className={styles.healthLabel}>{h.label}</span>
                                    <span className={styles.healthVal} style={{ color: h.color }}>{h.value}</span>
                                </div>
                                <div className={styles.healthBar}>
                                    <div className={styles.healthFill} style={{ width: `${h.pct}%`, background: h.color }}/>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.healthDivider}/>

                    <div className={styles.quickActions}>
                        <p className={styles.quickTitle}>Quick Actions</p>
                        {[
                            { label: "Review Agency Applications",   count: stats?.newAgenciesThisMonth ?? 0, color: "#3b82f6" },
                            { label: "Review Provider Applications", count: stats?.newProvidersThisMonth ?? 0, color: "#22c55e" },
                            { label: "Pending Reviews",              count: stats?.pendingReviewsCount ?? 0,   color: "#f59e0b" },
                        ].map(q => (
                            <button key={q.label} className={styles.quickItem}>
                                <span className={styles.quickDot} style={{ background: q.color }}/>
                                <span className={styles.quickLabel}>{q.label}</span>
                                <span className={styles.quickCount} style={{ background: q.color + "20", color: q.color }}>{q.count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

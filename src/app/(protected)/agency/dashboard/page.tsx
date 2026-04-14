"use client";

import styles from "./page.module.scss";

// ── Mock data ─────────────────────────────────────────────────────────────────
const STATS = [
    {
        label: "Total Tours",
        value: "48",
        delta: "+5 this month",
        up: true,
        iconColor: "#eff6ff",
        iconAccent: "#3b82f6",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        ),
    },
    {
        label: "Active Bookings",
        value: "127",
        delta: "+18 this week",
        up: true,
        iconColor: "#f0fdf4",
        iconAccent: "#22c55e",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M8 14l2.5 2.5L16 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        label: "Total Revenue",
        value: "₫284M",
        delta: "+12.4% vs last month",
        up: true,
        iconColor: "#fffbeb",
        iconAccent: "#f59e0b",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        ),
    },
    {
        label: "Total Customers",
        value: "1,042",
        delta: "+34 this month",
        up: true,
        iconColor: "#f5f3ff",
        iconAccent: "#8b5cf6",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        ),
    },
];

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CHART_DATA = [42, 68, 55, 90, 72, 110, 95, 130, 118, 145, 128, 160];

const UPCOMING = [
    { day: 13, mon: "Apr", name: "Ha Long Bay Explorer", pax: 24, status: "confirmed", statusColor: "#d1fae5", statusText: "#065f46" },
    { day: 15, mon: "Apr", name: "Sapa Cultural Trek",   pax: 12, status: "pending",   statusColor: "#fef3c7", statusText: "#92400e" },
    { day: 18, mon: "Apr", name: "Hoi An Heritage Walk", pax: 30, status: "confirmed", statusColor: "#d1fae5", statusText: "#065f46" },
    { day: 21, mon: "Apr", name: "Mekong Delta Cruise",  pax: 18, status: "confirmed", statusColor: "#d1fae5", statusText: "#065f46" },
    { day: 25, mon: "Apr", name: "Phu Quoc Beach Escape",pax: 20, status: "pending",   statusColor: "#fef3c7", statusText: "#92400e" },
];

const BOOKINGS = [
    { id: "#BK-1042", customer: "Nguyen Van A", tour: "Ha Long Bay Explorer", date: "Apr 13", pax: 4, amount: "₫12,400,000", status: "confirmed", avatarBg: "#3b82f6" },
    { id: "#BK-1041", customer: "Tran Thi B",   tour: "Sapa Cultural Trek",   date: "Apr 15", pax: 2, amount: "₫6,200,000",  status: "pending",   avatarBg: "#8b5cf6" },
    { id: "#BK-1040", customer: "Le Van C",      tour: "Hoi An Heritage Walk", date: "Apr 18", pax: 6, amount: "₫18,600,000", status: "confirmed", avatarBg: "#22c55e" },
    { id: "#BK-1039", customer: "Pham Thi D",    tour: "Mekong Delta Cruise",  date: "Apr 21", pax: 3, amount: "₫9,300,000",  status: "cancelled", avatarBg: "#f59e0b" },
    { id: "#BK-1038", customer: "Hoang Van E",   tour: "Phu Quoc Beach",       date: "Apr 25", pax: 5, amount: "₫15,500,000", status: "confirmed", avatarBg: "#ef4444" },
];

const DESTINATIONS = [
    { name: "Ha Long Bay", count: 38, pct: 95, color: "#3b82f6" },
    { name: "Sapa",        count: 24, pct: 60, color: "#8b5cf6" },
    { name: "Hoi An",      count: 20, pct: 50, color: "#22c55e" },
    { name: "Phu Quoc",    count: 16, pct: 40, color: "#f59e0b" },
    { name: "Mekong Delta",count: 10, pct: 25, color: "#ef4444" },
];

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
    confirmed: { bg: "#d1fae5", color: "#065f46", label: "Confirmed" },
    pending:   { bg: "#fef3c7", color: "#92400e", label: "Pending"   },
    cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

const maxBar = Math.max(...CHART_DATA);

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgencyDashboard() {
    return (
        <div className={styles.page}>

            {/* ── Welcome banner ── */}
            <div className={styles.welcome}>
                <div className={styles.welcomeText}>
                    <h2>Welcome back, Agency 👋</h2>
                    <p>Here's what's happening with your tours today — April 11, 2026</p>
                </div>
                <div className={styles.welcomeActions}>
                    <button className={`${styles.welcomeBtn} ${styles.outline}`}>View Reports</button>
                    <button className={`${styles.welcomeBtn} ${styles.primary}`}>+ New Tour</button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className={styles.statsRow}>
                {STATS.map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: s.iconColor, color: s.iconAccent }}>
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

            {/* ── Mid row: revenue chart + upcoming tours ── */}
            <div className={styles.midRow}>
                {/* Revenue chart */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Revenue Overview</h3>
                        <button className={styles.cardLink}>2026 ▾</button>
                    </div>
                    <div className={styles.chartWrap}>
                        <div className={styles.chartBars}>
                            {CHART_DATA.map((val, i) => (
                                <div key={i} className={styles.barCol}>
                                    <div
                                        className={styles.bar}
                                        style={{
                                            height: `${(val / maxBar) * 100}%`,
                                            background: i === 3 ? "#3b82f6" : i < 3 ? "#dbeafe" : "#bfdbfe",
                                        }}
                                        title={`${MONTHS_SHORT[i]}: ₫${val}M`}
                                    />
                                    <span className={styles.barLabel}>{MONTHS_SHORT[i]}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.chartLegend}>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ background: "#3b82f6" }} />
                                Current month
                            </div>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ background: "#dbeafe" }} />
                                Past months
                            </div>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ background: "#bfdbfe" }} />
                                Upcoming
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming tours */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Upcoming Tours</h3>
                        <button className={styles.cardLink}>View all</button>
                    </div>
                    <div className={styles.tourList}>
                        {UPCOMING.map((t, i) => (
                            <div key={i} className={styles.tourItem}>
                                <div className={styles.tourDate}>
                                    <span className={styles.tourDateDay}>{t.day}</span>
                                    <span className={styles.tourDateMon}>{t.mon}</span>
                                </div>
                                <div className={styles.tourInfo}>
                                    <p className={styles.tourName}>{t.name}</p>
                                    <p className={styles.tourMeta}>{t.pax} passengers</p>
                                </div>
                                <span
                                    className={styles.tourBadge}
                                    style={{ background: t.statusColor, color: t.statusText }}
                                >
                                    {t.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom row: recent bookings + top destinations ── */}
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
                            {BOOKINGS.map(b => {
                                const cfg = STATUS_CFG[b.status];
                                return (
                                    <tr key={b.id} className={styles.tr}>
                                        <td className={styles.td}><span className={styles.bookingId}>{b.id}</span></td>
                                        <td className={styles.td}>
                                            <div className={styles.customerCell}>
                                                <div className={styles.customerAvatar} style={{ background: b.avatarBg }}>
                                                    {b.customer.split(" ").map(w => w[0]).join("").slice(0,2)}
                                                </div>
                                                {b.customer}
                                            </div>
                                        </td>
                                        <td className={`${styles.td} ${styles.tdLight}`}>{b.tour}</td>
                                        <td className={`${styles.td} ${styles.tdLight}`}>{b.date}</td>
                                        <td className={styles.td} style={{ fontWeight: 600 }}>{b.amount}</td>
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

                {/* Top destinations */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Top Destinations</h3>
                        <button className={styles.cardLink}>This year</button>
                    </div>
                    <div className={styles.destList}>
                        {DESTINATIONS.map(d => (
                            <div key={d.name} className={styles.destItem}>
                                <div className={styles.destTop}>
                                    <span className={styles.destName}>{d.name}</span>
                                    <span className={styles.destCount}>{d.count} tours</span>
                                </div>
                                <div className={styles.destBar}>
                                    <div className={styles.destFill} style={{ width: `${d.pct}%`, background: d.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}

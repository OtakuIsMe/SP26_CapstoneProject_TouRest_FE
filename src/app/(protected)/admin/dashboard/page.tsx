"use client";

import styles from "./page.module.scss";

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

// ── Mock data ─────────────────────────────────────────────────────────────────
const STATS = [
    {
        label: "Registered Agencies",
        value: "23",
        delta: "+2 this month",
        up: true,
        iconBg: "#eff6ff",
        iconColor: "#3b82f6",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M3 21V7l9-4 9 4v14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        label: "Registered Providers",
        value: "18",
        delta: "+1 this month",
        up: true,
        iconBg: "#f0fdf4",
        iconColor: "#22c55e",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        label: "Platform Bookings",
        value: "3,847",
        delta: "+284 this month",
        up: true,
        iconBg: "#fffbeb",
        iconColor: "#f59e0b",
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
        value: "₫2.8B",
        delta: "+18.4% vs last month",
        up: true,
        iconBg: "#f5f3ff",
        iconColor: "#8b5cf6",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        ),
    },
];

const PENDING_APPROVALS = [
    { id: "a1", name: "Saigon Medical Tours",    type: "Agency",   submitted: "1 day ago",  bg: "#3b82f6" },
    { id: "a2", name: "Hanoi Wellness Retreat",   type: "Agency",   submitted: "2 days ago", bg: "#8b5cf6" },
    { id: "p1", name: "VN Dental Care Ltd.",      type: "Provider", submitted: "3 hours ago",bg: "#f59e0b" },
    { id: "p2", name: "Mekong Spa & Rehab",       type: "Provider", submitted: "3 days ago", bg: "#22c55e" },
];

const TYPE_CFG: Record<string, { bg: string; color: string }> = {
    Agency:   { bg: "#eff6ff", color: "#2563eb" },
    Provider: { bg: "#f0fdf4", color: "#16a34a" },
};

const TOP_AGENCIES = [
    { name: "Ha Long Medical Tours",   tours: 12, bookings: 284, revenue: "₫842M", active: true  },
    { name: "Sapa Adventure Health",   tours: 8,  bookings: 196, revenue: "₫621M", active: true  },
    { name: "Hoi An Wellness Agency",  tours: 10, bookings: 174, revenue: "₫539M", active: true  },
    { name: "Mekong Delta Care",       tours: 6,  bookings: 142, revenue: "₫428M", active: true  },
    { name: "Phu Quoc Medical Escape", tours: 9,  bookings: 128, revenue: "₫384M", active: false },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BOOKING_DATA  = [32, 45, 38, 56, 48, 65, 58, 74, 68, 88, 78, 94];
const REVENUE_DATA  = [28, 42, 36, 62, 44, 70, 64, 82, 76, 96, 86, 110];

const CW = 400, CH = 100;
const maxVal = Math.max(...BOOKING_DATA, ...REVENUE_DATA);

function pts(data: number[]) {
    return data.map((v, i) => {
        const x = (i / (data.length - 1)) * CW;
        const y = CH - (v / maxVal) * CH * 0.9;
        return `${x},${y}`;
    }).join(" ");
}

function areaPath(data: number[]) {
    const top = data.map((v, i) => {
        const x = (i / (data.length - 1)) * CW;
        const y = CH - (v / maxVal) * CH * 0.9;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
    return `${top} L${CW},${CH} L0,${CH} Z`;
}

const PLATFORM_HEALTH = [
    { label: "System Uptime",      value: "99.8%",  color: "#22c55e", pct: 99 },
    { label: "API Response",       value: "142ms",  color: "#3b82f6", pct: 85 },
    { label: "Pending Reviews",    value: "4",      color: "#f59e0b", pct: 40 },
    { label: "Failed Payments",    value: "0.3%",   color: "#22c55e", pct: 97 },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
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
                        <span className={styles.welcomeBadge}>4</span>
                    </button>
                    <button className={`${styles.welcomeBtn} ${styles.primary}`}>Platform Reports</button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className={styles.statsRow}>
                {STATS.map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: s.iconBg, color: s.iconColor }}>
                            {s.icon}
                        </div>
                        <div className={styles.statBody}>
                            <p className={styles.statLabel}>{s.label}</p>
                            <p className={styles.statValue}>{s.value}</p>
                            <span className={`${styles.statDelta} ${s.up ? styles.deltaUp : styles.deltaDown}`}>
                                {s.up
                                    ? <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    : <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                }
                                {s.delta}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Mid row ── */}
            <div className={styles.midRow}>

                {/* Booking volume trend */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Booking & Revenue Trend</h3>
                        <button className={styles.cardLink}>2026 ▾</button>
                    </div>
                    <div className={styles.chartBody}>
                        <div className={styles.chartMeta}>
                            <div>
                                <p className={styles.chartMetaNum} style={{ color: "#6366f1" }}>3,847</p>
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
                                <path d={areaPath(REVENUE_DATA)} fill="url(#admGrad2)"/>
                                <path d={areaPath(BOOKING_DATA)} fill="url(#admGrad1)"/>
                                <polyline points={pts(REVENUE_DATA)} fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="5 3"/>
                                <polyline points={pts(BOOKING_DATA)} fill="none" stroke="#6366f1" strokeWidth="2.2"/>
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
                        <span className={styles.pendingCount}>{PENDING_APPROVALS.length}</span>
                    </div>
                    <div className={styles.pendingList}>
                        {PENDING_APPROVALS.map(item => {
                            const cfg = TYPE_CFG[item.type];
                            return (
                                <div key={item.id} className={styles.pendingItem}>
                                    <div className={styles.pendingAvatar} style={{ background: item.bg }}>
                                        {item.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                    </div>
                                    <div className={styles.pendingInfo}>
                                        <p className={styles.pendingName}>{item.name}</p>
                                        <div className={styles.pendingMeta}>
                                            <span className={styles.pendingType} style={{ background: cfg.bg, color: cfg.color }}>{item.type}</span>
                                            <span className={styles.pendingTime}>{item.submitted}</span>
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
                            {TOP_AGENCIES.map((a, i) => (
                                <tr key={i} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div className={styles.agencyCell}>
                                            <div className={styles.agencyRank}>{i + 1}</div>
                                            <span className={styles.agencyName}>{a.name}</span>
                                        </div>
                                    </td>
                                    <td className={styles.td} style={{ color: "#6b7280" }}>{a.tours}</td>
                                    <td className={styles.td} style={{ fontWeight: 600 }}>{a.bookings}</td>
                                    <td className={styles.td} style={{ fontWeight: 700, color: "#6366f1" }}>{a.revenue}</td>
                                    <td className={styles.td}>
                                        <span className={styles.badge} style={{
                                            background: a.active ? "#d1fae5" : "#fee2e2",
                                            color: a.active ? "#065f46" : "#991b1b",
                                        }}>
                                            {a.active ? "Active" : "Suspended"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Platform health */}
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
                            { label: "Review Agency Applications",   count: 2, color: "#3b82f6" },
                            { label: "Review Provider Applications", count: 2, color: "#22c55e" },
                            { label: "Flagged Bookings",             count: 1, color: "#ef4444" },
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

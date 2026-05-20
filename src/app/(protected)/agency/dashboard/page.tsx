"use client";

import styles from "./page.module.scss";

// ── Helpers ───────────────────────────────────────────────────────────────────
const now     = new Date();
const today   = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const Y       = now.getFullYear();
const M       = now.getMonth() + 1;
const TD      = now.getDate();

function mkd(day: number, m = M, y = Y) {
    const d = new Date(y, m - 1, day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const STATS = [
    {
        label: "Active Tours",
        value: "12",
        delta: "+2 this month",
        up: true,
        iconBg: "#eff6ff",
        iconColor: "#3b82f6",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
        ),
    },
    {
        label: "Schedules Today",
        value: "3",
        delta: "2 confirmed · 1 pending",
        up: true,
        iconBg: "#f0fdf4",
        iconColor: "#22c55e",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="2" fill="currentColor"/>
            </svg>
        ),
    },
    {
        label: "Monthly Bookings",
        value: "284",
        delta: "+38 vs last month",
        up: true,
        iconBg: "#fffbeb",
        iconColor: "#f59e0b",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        ),
    },
    {
        label: "Monthly Revenue",
        value: "₫284M",
        delta: "+12.4% vs last month",
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

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BOOKING_BARS = [42, 68, 55, 90, 72, 110, 95, 130, 118, 145, 128, 160];
const maxBar = Math.max(...BOOKING_BARS);
const curMo  = now.getMonth();

const UPCOMING_SCHEDULES = [
    { day: TD,     mon: MONTHS_SHORT[now.getMonth()], name: "Ha Long Bay & Wellness Retreat", pax: 18, guide: "Nguyễn Văn Hùng",  status: "confirmed" },
    { day: TD,     mon: MONTHS_SHORT[now.getMonth()], name: "Sapa Mountain Health Trek",      pax: 9,  guide: "Trần Thị Lan",     status: "confirmed" },
    { day: TD + 2, mon: MONTHS_SHORT[now.getMonth()], name: "Hoi An Heritage & Spa Tour",    pax: 12, guide: null,               status: "pending"   },
    { day: TD + 2, mon: MONTHS_SHORT[now.getMonth()], name: "Phu Quoc Island Escape",        pax: 7,  guide: null,               status: "pending"   },
    { day: TD + 5, mon: MONTHS_SHORT[now.getMonth()], name: "Hanoi Cultural Dental Tour",    pax: 4,  guide: "Hoàng Văn Nam",    status: "confirmed" },
];

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
    confirmed: { bg: "#d1fae5", color: "#065f46", label: "Confirmed" },
    pending:   { bg: "#fef3c7", color: "#92400e", label: "Pending"   },
    cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

const RECENT_BOOKINGS = [
    { id: "#BK-1042", customer: "Nguyen Van A", tour: "Ha Long Bay Explorer",  date: mkd(TD - 1), pax: 4, amount: "₫12,400,000", status: "confirmed", avatarBg: "#3b82f6" },
    { id: "#BK-1041", customer: "Tran Thi B",   tour: "Sapa Cultural Trek",    date: mkd(TD - 1), pax: 2, amount: "₫6,200,000",  status: "pending",   avatarBg: "#8b5cf6" },
    { id: "#BK-1040", customer: "Le Van C",      tour: "Hoi An Heritage Walk",  date: mkd(TD - 2), pax: 6, amount: "₫18,600,000", status: "confirmed", avatarBg: "#22c55e" },
    { id: "#BK-1039", customer: "Pham Thi D",    tour: "Mekong Delta Cruise",   date: mkd(TD - 3), pax: 3, amount: "₫9,300,000",  status: "cancelled", avatarBg: "#f59e0b" },
    { id: "#BK-1038", customer: "Hoang Van E",   tour: "Phu Quoc Beach Escape", date: mkd(TD - 4), pax: 5, amount: "₫15,500,000", status: "confirmed", avatarBg: "#ef4444" },
];

const GUIDES = [
    { name: "Nguyễn Văn Hùng", active: 2, total: 14, avatarBg: "#6366f1" },
    { name: "Trần Thị Lan",    active: 1, total: 9,  avatarBg: "#ec4899" },
    { name: "Phạm Minh Đức",   active: 3, total: 21, avatarBg: "#f59e0b" },
    { name: "Lê Thị Hoa",      active: 2, total: 17, avatarBg: "#10b981" },
    { name: "Hoàng Văn Nam",   active: 1, total: 6,  avatarBg: "#3b82f6" },
];

function fmtD(s: string) {
    return new Date(s + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgencyDashboard() {
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

                {/* Revenue bar chart */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Booking Volume — {Y}</h3>
                        <button className={styles.cardLink}>View revenue →</button>
                    </div>
                    <div className={styles.chartWrap}>
                        <div className={styles.chartBars}>
                            {BOOKING_BARS.map((val, i) => {
                                const isCurrentMonth = i === curMo;
                                const isPast = i < curMo;
                                return (
                                    <div key={i} className={styles.barCol}>
                                        {isCurrentMonth && (
                                            <span className={styles.barTopVal}>{val}</span>
                                        )}
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
                        {UPCOMING_SCHEDULES.map((t, i) => {
                            const cfg = STATUS_CFG[t.status];
                            const hasGuide = !!t.guide;
                            return (
                                <div key={i} className={styles.tourItem}>
                                    <div className={styles.tourDate}>
                                        <span className={styles.tourDateDay}>{t.day}</span>
                                        <span className={styles.tourDateMon}>{t.mon}</span>
                                    </div>
                                    <div className={styles.tourInfo}>
                                        <p className={styles.tourName}>{t.name}</p>
                                        <p className={styles.tourMeta}>
                                            {hasGuide
                                                ? <><span style={{ color: "#22c55e" }}>●</span> {t.guide} · {t.pax} pax</>
                                                : <><span style={{ color: "#f59e0b" }}>⚠</span> No guide · {t.pax} pax</>
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
                            {RECENT_BOOKINGS.map(b => {
                                const cfg = STATUS_CFG[b.status];
                                return (
                                    <tr key={b.id} className={styles.tr}>
                                        <td className={styles.td}><span className={styles.bookingId}>{b.id}</span></td>
                                        <td className={styles.td}>
                                            <div className={styles.customerCell}>
                                                <div className={styles.customerAvatar} style={{ background: b.avatarBg }}>
                                                    {b.customer.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                                </div>
                                                {b.customer}
                                            </div>
                                        </td>
                                        <td className={`${styles.td} ${styles.tdLight}`}>{b.tour}</td>
                                        <td className={`${styles.td} ${styles.tdLight}`}>{fmtD(b.date)}</td>
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

                {/* Guide workload */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Guide Workload</h3>
                        <button className={styles.cardLink}>Assign guides →</button>
                    </div>
                    <div className={styles.destList}>
                        {GUIDES.map(g => {
                            const pct = Math.min((g.active / 4) * 100, 100);
                            const color = g.active >= 3 ? "#ef4444" : g.active >= 2 ? "#f59e0b" : "#22c55e";
                            return (
                                <div key={g.name} className={styles.guideItem}>
                                    <div className={styles.guideAvatar} style={{ background: g.avatarBg }}>
                                        {g.name.split(" ").filter(Boolean).slice(-2).map(w => w[0]).join("")}
                                    </div>
                                    <div className={styles.guideBody}>
                                        <div className={styles.guideTop}>
                                            <span className={styles.guideName}>{g.name}</span>
                                            <span className={styles.guideCount} style={{ color }}>
                                                {g.active} active
                                            </span>
                                        </div>
                                        <div className={styles.destBar}>
                                            <div className={styles.destFill} style={{ width: `${pct}%`, background: color }}/>
                                        </div>
                                        <span className={styles.guideTotal}>{g.total} completed total</span>
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

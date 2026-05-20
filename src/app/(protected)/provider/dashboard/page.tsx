"use client";

import styles from "./page.module.scss";

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const curMo = new Date().getMonth();

// ── Mock data ─────────────────────────────────────────────────────────────────
const STATS = [
    {
        label: "Active Services",
        value: "12",
        delta: "+2 this month",
        up: true,
        iconBg: "#f0fdf4",
        iconColor: "#14b8a6",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        ),
    },
    {
        label: "Active Packages",
        value: "8",
        delta: "4 agencies subscribed",
        up: true,
        iconBg: "#eff6ff",
        iconColor: "#3b82f6",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        ),
    },
    {
        label: "Pending Requests",
        value: "5",
        delta: "3 new today",
        up: false,
        iconBg: "#fffbeb",
        iconColor: "#f59e0b",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M18 8h1a4 4 0 010 8h-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M6 1v3M10 1v3M14 1v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
        ),
    },
    {
        label: "Monthly Revenue",
        value: "₫48M",
        delta: "+22% vs last month",
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

const JOB_DATA = [8, 14, 11, 19, 16, 23, 20, 28, 24, 32, 29, 36];
const maxJob = Math.max(...JOB_DATA);

const PENDING_REQUESTS = [
    { id: "rq1", agency: "Ha Long Medical Tours",    service: "Airport Transfer",   pax: 24, date: "Today 10:30",    urgent: true,  avatarBg: "#3b82f6" },
    { id: "rq2", agency: "Sapa Adventure Health",    service: "Medical Check-up",   pax: 12, date: "Today 14:00",    urgent: true,  avatarBg: "#8b5cf6" },
    { id: "rq3", agency: "Hoi An Wellness Agency",   service: "Spa & Massage",      pax: 8,  date: "Tomorrow 09:00", urgent: false, avatarBg: "#22c55e" },
    { id: "rq4", agency: "Mekong Delta Care",        service: "Dental Consultation", pax: 4,  date: "Tomorrow 11:30", urgent: false, avatarBg: "#f59e0b" },
    { id: "rq5", agency: "Phu Quoc Medical Escape",  service: "Lab Tests Package",   pax: 16, date: "In 2 days",      urgent: false, avatarBg: "#14b8a6" },
];

const ACTIVE_PACKAGES = [
    { name: "Medical Check-up Bundle",   services: 4, agencies: 3, revenue: "₫18M", pct: 90, color: "#22c55e" },
    { name: "Dental Care Package",       services: 3, agencies: 2, revenue: "₫12M", pct: 75, color: "#3b82f6" },
    { name: "Spa & Wellness Suite",      services: 5, agencies: 4, revenue: "₫10M", pct: 60, color: "#8b5cf6" },
    { name: "Airport Transfer Pack",     services: 2, agencies: 3, revenue: "₫5M",  pct: 40, color: "#f59e0b" },
    { name: "Lab & Diagnostics Bundle",  services: 6, agencies: 1, revenue: "₫3M",  pct: 20, color: "#ef4444" },
];

const TOP_AGENCIES = [
    { name: "Ha Long Medical Tours",   jobs: 38, revenue: "₫18.4M", avatarBg: "#3b82f6" },
    { name: "Hoi An Wellness Agency",  jobs: 26, revenue: "₫12.1M", avatarBg: "#22c55e" },
    { name: "Sapa Adventure Health",   jobs: 22, revenue: "₫10.8M", avatarBg: "#8b5cf6" },
    { name: "Mekong Delta Care",       jobs: 14, revenue: "₫6.7M",  avatarBg: "#f59e0b" },
    { name: "Phu Quoc Medical Escape", jobs: 11, revenue: "₫5.2M",  avatarBg: "#14b8a6" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProviderDashboard() {
    return (
        <div className={styles.page}>

            {/* ── Welcome banner ── */}
            <div className={styles.welcome}>
                <div className={styles.welcomeText}>
                    <h2>Welcome back, Provider 👋</h2>
                    <p>Manage your services and agency requests — {today}</p>
                </div>
                <div className={styles.welcomeActions}>
                    <button className={`${styles.welcomeBtn} ${styles.outline}`}>
                        View Requests
                        {PENDING_REQUESTS.length > 0 && (
                            <span className={styles.welcomeBadge}>{PENDING_REQUESTS.length}</span>
                        )}
                    </button>
                    <button className={`${styles.welcomeBtn} ${styles.primary}`}>+ New Package</button>
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

                {/* Jobs completed bar chart */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Jobs Completed — {new Date().getFullYear()}</h3>
                        <button className={styles.cardLink}>View report →</button>
                    </div>
                    <div className={styles.chartWrap}>
                        <div className={styles.chartBars}>
                            {JOB_DATA.map((val, i) => {
                                const isCurrent = i === curMo;
                                const isPast = i < curMo;
                                return (
                                    <div key={i} className={styles.barCol}>
                                        {isCurrent && (
                                            <span className={styles.barTopVal}>{val}</span>
                                        )}
                                        <div
                                            className={styles.bar}
                                            style={{
                                                height: `${(val / maxJob) * 100}%`,
                                                background: isCurrent ? "#14b8a6" : isPast ? "#99f6e4" : "#e5e7eb",
                                            }}
                                        />
                                        <span className={styles.barLabel}>{MONTHS_SHORT[i]}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles.chartLegend}>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#14b8a6" }}/> Current month</div>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#99f6e4" }}/> Past months</div>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#e5e7eb" }}/> Upcoming</div>
                        </div>
                    </div>
                </div>

                {/* Pending requests */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Pending Requests</h3>
                        <span className={styles.urgentCount}>{PENDING_REQUESTS.filter(r => r.urgent).length} urgent</span>
                    </div>
                    <div className={styles.requestList}>
                        {PENDING_REQUESTS.map(r => (
                            <div key={r.id} className={`${styles.requestItem} ${r.urgent ? styles.requestUrgent : ""}`}>
                                <div className={styles.requestAvatar} style={{ background: r.avatarBg }}>
                                    {r.agency.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                </div>
                                <div className={styles.requestInfo}>
                                    <div className={styles.requestTop}>
                                        <p className={styles.requestAgency}>{r.agency}</p>
                                        {r.urgent && <span className={styles.urgentBadge}>Urgent</span>}
                                    </div>
                                    <p className={styles.requestService}>{r.service} · {r.pax} pax</p>
                                    <p className={styles.requestDate}>{r.date}</p>
                                </div>
                                <div className={styles.requestActions}>
                                    <button className={styles.acceptBtn}>Accept</button>
                                    <button className={styles.declineBtn}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom row ── */}
            <div className={styles.bottomRow}>

                {/* Active packages */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Active Packages</h3>
                        <button className={styles.cardLink}>Manage packages →</button>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Package</th>
                                <th className={styles.th}>Services</th>
                                <th className={styles.th}>Agencies</th>
                                <th className={styles.th}>Revenue</th>
                                <th className={styles.th}>Demand</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ACTIVE_PACKAGES.map((p, i) => (
                                <tr key={i} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div className={styles.pkgCell}>
                                            <span className={styles.pkgDot} style={{ background: p.color }}/>
                                            <span className={styles.pkgName}>{p.name}</span>
                                        </div>
                                    </td>
                                    <td className={styles.td} style={{ color: "#6b7280" }}>{p.services}</td>
                                    <td className={styles.td} style={{ color: "#6b7280" }}>{p.agencies}</td>
                                    <td className={styles.td} style={{ fontWeight: 700, color: "#14b8a6" }}>{p.revenue}</td>
                                    <td className={styles.td}>
                                        <div className={styles.demandWrap}>
                                            <div className={styles.demandBar}>
                                                <div className={styles.demandFill} style={{ width: `${p.pct}%`, background: p.color }}/>
                                            </div>
                                            <span className={styles.demandPct} style={{ color: p.color }}>{p.pct}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Top requesting agencies */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Top Agencies</h3>
                        <button className={styles.cardLink}>This month</button>
                    </div>
                    <div className={styles.agencyList}>
                        {TOP_AGENCIES.map((a, i) => (
                            <div key={a.name} className={styles.agencyItem}>
                                <span className={styles.agencyRankNum}>{i + 1}</span>
                                <div className={styles.agencyAva} style={{ background: a.avatarBg }}>
                                    {a.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                </div>
                                <div className={styles.agencyInfo}>
                                    <p className={styles.agencyName}>{a.name}</p>
                                    <p className={styles.agencyMeta}>{a.jobs} jobs this month</p>
                                </div>
                                <span className={styles.agencyRev}>{a.revenue}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

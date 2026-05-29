"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import { providerService } from "@/libs/services/provider.service";
import type { ProviderDashboardStats, ProviderPendingRequest, ProviderActivePackage, ProviderTopAgency } from "@/types/dashboard.type";

// ── Helpers ───────────────────────────────────────────────────────────────────
const today     = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const curMo     = new Date().getMonth();
const curYear   = new Date().getFullYear();

function monthToIndex(m: string): number {
    const n = parseInt(m, 10);
    if (!isNaN(n)) return Math.max(0, Math.min(11, n - 1));
    const si = MONTHS_SHORT.findIndex(s => s.toLowerCase() === m.slice(0, 3).toLowerCase());
    return si >= 0 ? si : 0;
}

function fmtScheduledTime(s: string): string {
    const d = new Date(s);
    const diffMs = d.getTime() - Date.now();
    const diffH  = Math.round(diffMs / 3_600_000);
    if (diffH < 0)   return "Past";
    if (diffH < 24)  return `Today ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffH < 48)  return `Tomorrow ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    return `In ${Math.floor(diffH / 24)} days`;
}

const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#22c55e","#f59e0b","#ef4444","#6366f1","#ec4899","#14b8a6"];
function avatarColor(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Static icon config ────────────────────────────────────────────────────────
const STAT_ICONS = [
    {
        label: "Active Services", iconBg: "#f0fdf4", iconColor: "#14b8a6",
        icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    },
    {
        label: "Active Packages", iconBg: "#eff6ff", iconColor: "#3b82f6",
        icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    },
    {
        label: "Pending Requests", iconBg: "#fffbeb", iconColor: "#f59e0b",
        icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M18 8h1a4 4 0 010 8h-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M6 1v3M10 1v3M14 1v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    },
    {
        label: "Monthly Revenue", iconBg: "#f5f3ff", iconColor: "#8b5cf6",
        icon: <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    },
] as const;

const PKG_COLORS = ["#22c55e","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#6366f1","#14b8a6","#ec4899"];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProviderDashboard() {
    const [stats,    setStats]    = useState<ProviderDashboardStats | null>(null);
    const [jobBars,  setJobBars]  = useState<number[]>(new Array(12).fill(0));
    const [requests, setRequests] = useState<ProviderPendingRequest[]>([]);
    const [packages, setPackages] = useState<ProviderActivePackage[]>([]);
    const [agencies, setAgencies] = useState<ProviderTopAgency[]>([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        providerService.getMe().then(meRes => {
            if (!meRes?.data) { setLoading(false); return; }
            const pid = meRes.data.id;
            Promise.all([
                providerService.getDashboardStats(pid),
                providerService.getJobsTrend(pid, curYear),
                providerService.getPendingRequests(pid),
                providerService.getActivePackages(pid),
                providerService.getTopAgencies(pid),
            ]).then(([sRes, tRes, rRes, pkgRes, agRes]) => {
                if (sRes?.data) setStats(sRes.data);
                if (tRes?.data) {
                    const bars = new Array(12).fill(0);
                    tRes.data.monthlyTrends.forEach(t => { bars[monthToIndex(t.month)] = t.jobsCount; });
                    setJobBars(bars);
                }
                if (rRes?.data) setRequests(rRes.data);
                if (pkgRes?.data) setPackages(pkgRes.data);
                if (agRes?.data) setAgencies(agRes.data);
            }).catch(() => {}).finally(() => setLoading(false));
        }).catch(() => setLoading(false));
    }, []);

    const maxJob = Math.max(...jobBars, 1);
    const urgentCount = requests.filter(r => r.isUrgent).length;

    const statsData = stats
        ? [
            { ...STAT_ICONS[0], value: String(stats.activeServices),      delta: `+${stats.activeServicesChangeThisMonth} this month`,    up: stats.activeServicesChangeThisMonth >= 0 },
            { ...STAT_ICONS[1], value: String(stats.activePackages),       delta: `${stats.agenciesSubscribedCount} agencies subscribed`,  up: true },
            { ...STAT_ICONS[2], value: String(stats.pendingRequestsCount), delta: `${stats.newPendingRequestsToday} new today`,            up: false },
            { ...STAT_ICONS[3], value: `₫${Math.round(stats.monthlyRevenue / 1_000_000)}M`, delta: `+${stats.revenuePercentageChange}% vs last month`, up: stats.revenuePercentageChange >= 0 },
          ]
        : STAT_ICONS.map(s => ({ ...s, value: "—", delta: "loading…", up: true }));

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
                        {requests.length > 0 && (
                            <span className={styles.welcomeBadge}>{requests.length}</span>
                        )}
                    </button>
                    <button className={`${styles.welcomeBtn} ${styles.primary}`}>+ New Package</button>
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

                {/* Jobs completed bar chart */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Jobs Completed — {curYear}</h3>
                        <button className={styles.cardLink}>View report →</button>
                    </div>
                    <div className={styles.chartWrap}>
                        <div className={styles.chartBars}>
                            {jobBars.map((val, i) => {
                                const isCurrent = i === curMo;
                                const isPast    = i < curMo;
                                return (
                                    <div key={i} className={styles.barCol}>
                                        {isCurrent && <span className={styles.barTopVal}>{val}</span>}
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
                        <span className={styles.urgentCount}>{urgentCount} urgent</span>
                    </div>
                    <div className={styles.requestList}>
                        {loading ? (
                            <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Loading…</p>
                        ) : requests.length === 0 ? (
                            <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No pending requests</p>
                        ) : requests.map(r => (
                            <div key={r.requestId} className={`${styles.requestItem} ${r.isUrgent ? styles.requestUrgent : ""}`}>
                                <div className={styles.requestAvatar} style={{ background: avatarColor(r.agencyName) }}>
                                    {r.agencyShortName || r.agencyName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                </div>
                                <div className={styles.requestInfo}>
                                    <div className={styles.requestTop}>
                                        <p className={styles.requestAgency}>{r.agencyName}</p>
                                        {r.isUrgent && <span className={styles.urgentBadge}>Urgent</span>}
                                    </div>
                                    <p className={styles.requestService}>{r.packageOrServiceName} · {r.pax} pax</p>
                                    <p className={styles.requestDate}>{fmtScheduledTime(r.scheduledTime)}</p>
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
                            {packages.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>No active packages</td></tr>
                            ) : packages.map((p, i) => {
                                const color = PKG_COLORS[i % PKG_COLORS.length];
                                const revM = (p.revenue / 1_000_000).toFixed(1).replace(/\.0$/, "");
                                return (
                                    <tr key={p.packageId} className={styles.tr}>
                                        <td className={styles.td}>
                                            <div className={styles.pkgCell}>
                                                <span className={styles.pkgDot} style={{ background: color }}/>
                                                <span className={styles.pkgName}>{p.name}</span>
                                            </div>
                                        </td>
                                        <td className={styles.td} style={{ color: "#6b7280" }}>{p.servicesCount}</td>
                                        <td className={styles.td} style={{ color: "#6b7280" }}>{p.agenciesCount}</td>
                                        <td className={styles.td} style={{ fontWeight: 700, color: "#14b8a6" }}>₫{revM}M</td>
                                        <td className={styles.td}>
                                            <div className={styles.demandWrap}>
                                                <div className={styles.demandBar}>
                                                    <div className={styles.demandFill} style={{ width: `${p.demandPercent}%`, background: color }}/>
                                                </div>
                                                <span className={styles.demandPct} style={{ color }}>{p.demandPercent}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
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
                        {agencies.length === 0 ? (
                            <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No data this month</p>
                        ) : agencies.map((a, i) => {
                            const revM = (a.revenueThisMonth / 1_000_000).toFixed(1).replace(/\.0$/, "");
                            return (
                                <div key={a.agencyId} className={styles.agencyItem}>
                                    <span className={styles.agencyRankNum}>{i + 1}</span>
                                    <div className={styles.agencyAva} style={{ background: avatarColor(a.name) }}>
                                        {a.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                                    </div>
                                    <div className={styles.agencyInfo}>
                                        <p className={styles.agencyName}>{a.name}</p>
                                        <p className={styles.agencyMeta}>{a.jobsThisMonth} jobs this month</p>
                                    </div>
                                    <span className={styles.agencyRev}>₫{revM}M</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

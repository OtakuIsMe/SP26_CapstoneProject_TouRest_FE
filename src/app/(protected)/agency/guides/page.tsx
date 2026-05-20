"use client";

import { useState, useMemo } from "react";
import styles from "./page.module.scss";

// ── Types ──────────────────────────────────────────────────────────────────────
type RunStatus = "confirmed" | "pending" | "completed" | "cancelled";

interface TourRun {
    id: string;
    tourName: string;
    tourCode: string;
    startDate: string;
    endDate: string;
    departureTime: string;
    guide: string | null;
    guideId: string | null;
    slots: number;
    booked: number;
    status: RunStatus;
    destination: string;
}

interface Guide {
    id: string;
    name: string;
    email: string;
    activeRuns: number;
    completedRuns: number;
}

// ── Config ─────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<RunStatus, { label: string; color: string; bg: string; border: string }> = {
    confirmed: { label: "Confirmed", color: "#065f46", bg: "#d1fae5", border: "#10b981" },
    pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7", border: "#f59e0b" },
    completed: { label: "Completed", color: "#1e40af", bg: "#dbeafe", border: "#3b82f6" },
    cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2", border: "#ef4444" },
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const now = new Date();
const Y = now.getFullYear();
const M = now.getMonth() + 1;
const TD = now.getDate();

function mkd(day: number, m = M, y = Y) {
    const d = new Date(y, m - 1, day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MOCK_GUIDES: Guide[] = [
    { id: "g1", name: "Nguyễn Văn Hùng", email: "hung.nv@agency.vn",   activeRuns: 2, completedRuns: 14 },
    { id: "g2", name: "Trần Thị Lan",    email: "lan.tt@agency.vn",    activeRuns: 1, completedRuns: 9  },
    { id: "g3", name: "Phạm Minh Đức",   email: "duc.pm@agency.vn",    activeRuns: 3, completedRuns: 21 },
    { id: "g4", name: "Lê Thị Hoa",      email: "hoa.lt@agency.vn",    activeRuns: 2, completedRuns: 17 },
    { id: "g5", name: "Hoàng Văn Nam",   email: "nam.hv@agency.vn",    activeRuns: 1, completedRuns: 6  },
    { id: "g6", name: "Vũ Thị Mai",      email: "mai.vt@agency.vn",    activeRuns: 0, completedRuns: 3  },
    { id: "g7", name: "Bùi Thị Thu",     email: "thu.bt@agency.vn",    activeRuns: 1, completedRuns: 11 },
    { id: "g8", name: "Đỗ Quang Minh",   email: "minh.dq@agency.vn",  activeRuns: 0, completedRuns: 2  },
];

const INITIAL_RUNS: TourRun[] = [
    { id: "r1", tourName: "Ha Long Bay & Wellness Retreat", tourCode: "HLBW-01",
      startDate: mkd(TD), endDate: mkd(TD + 3), departureTime: "07:00 AM",
      guide: "Nguyễn Văn Hùng", guideId: "g1", slots: 20, booked: 18, status: "confirmed", destination: "Ha Long Bay, Quảng Ninh" },
    { id: "r2", tourName: "Sapa Mountain Health Trek", tourCode: "SMHT-02",
      startDate: mkd(TD), endDate: mkd(TD + 2), departureTime: "06:30 AM",
      guide: "Trần Thị Lan", guideId: "g2", slots: 15, booked: 9, status: "confirmed", destination: "Sapa, Lào Cai" },
    { id: "r3", tourName: "Hoi An Heritage & Spa Tour", tourCode: "HHAS-03",
      startDate: mkd(TD + 2), endDate: mkd(TD + 5), departureTime: "08:00 AM",
      guide: "Phạm Minh Đức", guideId: "g3", slots: 12, booked: 12, status: "confirmed", destination: "Hội An, Quảng Nam" },
    { id: "r4", tourName: "Phu Quoc Island Medical Escape", tourCode: "PQIM-04",
      startDate: mkd(TD + 2), endDate: mkd(TD + 6), departureTime: "09:30 AM",
      guide: null, guideId: null, slots: 20, booked: 7, status: "pending", destination: "Phú Quốc, Kiên Giang" },
    { id: "r5", tourName: "Hanoi Cultural Dental Tour", tourCode: "HCDT-05",
      startDate: mkd(TD + 5), endDate: mkd(TD + 7), departureTime: "07:30 AM",
      guide: null, guideId: null, slots: 10, booked: 4, status: "pending", destination: "Hà Nội" },
    { id: "r6", tourName: "Ha Long Bay & Wellness Retreat", tourCode: "HLBW-06",
      startDate: mkd(TD + 8), endDate: mkd(TD + 11), departureTime: "07:00 AM",
      guide: "Nguyễn Văn Hùng", guideId: "g1", slots: 20, booked: 14, status: "confirmed", destination: "Ha Long Bay, Quảng Ninh" },
    { id: "r7", tourName: "Sapa Mountain Health Trek", tourCode: "SMHT-07",
      startDate: mkd(TD + 10), endDate: mkd(TD + 12), departureTime: "06:30 AM",
      guide: null, guideId: null, slots: 15, booked: 0, status: "pending", destination: "Sapa, Lào Cai" },
    { id: "r10", tourName: "Hanoi Cultural Dental Tour", tourCode: "HCDT-10",
      startDate: mkd(TD + 15), endDate: mkd(TD + 17), departureTime: "07:30 AM",
      guide: null, guideId: null, slots: 10, booked: 2, status: "pending", destination: "Hà Nội" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(s: string) {
    return new Date(s + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(-2).map(w => w[0].toUpperCase()).join("");
}

const AVATAR_COLORS = [
    "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"
];
function avatarColor(id: string) {
    const idx = parseInt(id.replace(/\D/g, ""), 10) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AgencyGuidesPage() {
    const [runs, setRuns] = useState<TourRun[]>(INITIAL_RUNS);
    const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("all");
    const [search, setSearch] = useState("");
    const [assignTarget, setAssignTarget] = useState<TourRun | null>(null);
    const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
    const [guideSearch, setGuideSearch] = useState("");

    const filtered = useMemo(() => {
        return runs.filter(r => {
            if (filter === "assigned" && !r.guide) return false;
            if (filter === "unassigned" && r.guide) return false;
            if (search && !r.tourName.toLowerCase().includes(search.toLowerCase()) &&
                !r.tourCode.toLowerCase().includes(search.toLowerCase()) &&
                !r.destination.toLowerCase().includes(search.toLowerCase())) return false;
            return r.status !== "completed" && r.status !== "cancelled";
        });
    }, [runs, filter, search]);

    const filteredGuides = useMemo(() => {
        if (!guideSearch) return MOCK_GUIDES;
        const q = guideSearch.toLowerCase();
        return MOCK_GUIDES.filter(g =>
            g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q)
        );
    }, [guideSearch]);

    const stats = useMemo(() => {
        const upcoming = runs.filter(r => r.status !== "completed" && r.status !== "cancelled");
        return {
            total:      upcoming.length,
            assigned:   upcoming.filter(r => r.guide).length,
            unassigned: upcoming.filter(r => !r.guide).length,
            guides:     MOCK_GUIDES.length,
        };
    }, [runs]);

    function openAssign(run: TourRun) {
        setAssignTarget(run);
        setSelectedGuide(run.guideId);
        setGuideSearch("");
    }

    function confirmAssign() {
        if (!assignTarget) return;
        const guide = MOCK_GUIDES.find(g => g.id === selectedGuide) ?? null;
        setRuns(prev => prev.map(r =>
            r.id === assignTarget.id
                ? { ...r, guide: guide?.name ?? null, guideId: guide?.id ?? null }
                : r
        ));
        setAssignTarget(null);
        setSelectedGuide(null);
    }

    function unassignGuide(runId: string) {
        setRuns(prev => prev.map(r =>
            r.id === runId ? { ...r, guide: null, guideId: null } : r
        ));
    }

    return (
        <div className={styles.page}>

            {/* ── Stats row ── */}
            <div className={styles.statsRow}>
                {[
                    { label: "Upcoming Schedules", value: stats.total,      color: "#6366f1", bg: "#eef2ff" },
                    { label: "Assigned",            value: stats.assigned,   color: "#059669", bg: "#d1fae5" },
                    { label: "Unassigned",          value: stats.unassigned, color: "#d97706", bg: "#fef3c7" },
                    { label: "Tour Guides",         value: stats.guides,     color: "#2563eb", bg: "#dbeafe" },
                ].map(s => (
                    <div key={s.label} className={styles.statCard} style={{ background: s.bg }}>
                        <span className={styles.statNum} style={{ color: s.color }}>{s.value}</span>
                        <span className={styles.statLabel}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className={styles.toolbar}>
                <div className={styles.filterTabs}>
                    {(["all", "assigned", "unassigned"] as const).map(f => (
                        <button
                            key={f}
                            className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === "all" ? "All Schedules" : f === "assigned" ? "Assigned" : "Unassigned"}
                            {f === "unassigned" && stats.unassigned > 0 && (
                                <span className={styles.filterBadge}>{stats.unassigned}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className={styles.searchWrap}>
                    <svg viewBox="0 0 24 24" fill="none" className={styles.searchIcon}>
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search schedules…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Schedule grid ── */}
            {filtered.length === 0 ? (
                <div className={styles.emptyState}>
                    <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#d1d5db" strokeWidth="1.5"/>
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p>No schedules found</p>
                </div>
            ) : (
                <div className={styles.scheduleGrid}>
                    {filtered.map(run => {
                        const cfg = STATUS_CFG[run.status];
                        const pct = Math.round(run.booked / run.slots * 100);
                        const guide = run.guide ? MOCK_GUIDES.find(g => g.id === run.guideId) : null;

                        return (
                            <div key={run.id} className={styles.scheduleCard} style={{ borderTopColor: cfg.border }}>
                                {/* Card header */}
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardHeaderLeft}>
                                        <span className={styles.cardCode}>{run.tourCode}</span>
                                        <span className={styles.cardStatus} style={{ background: cfg.bg, color: cfg.color }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <div className={styles.cardOccBadge} style={{
                                        color: pct >= 90 ? "#dc2626" : pct >= 60 ? "#d97706" : "#16a34a",
                                        background: pct >= 90 ? "#fee2e2" : pct >= 60 ? "#fef3c7" : "#dcfce7",
                                    }}>
                                        {run.booked}/{run.slots}
                                    </div>
                                </div>

                                <h3 className={styles.cardName}>{run.tourName}</h3>

                                {/* Meta */}
                                <div className={styles.cardMeta}>
                                    <div className={styles.cardMetaItem}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/>
                                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
                                        </svg>
                                        {run.destination}
                                    </div>
                                    <div className={styles.cardMetaItem}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                        {fmtDate(run.startDate)} → {fmtDate(run.endDate)}
                                    </div>
                                    <div className={styles.cardMetaItem}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                        Departure {run.departureTime}
                                    </div>
                                </div>

                                {/* Occupancy bar */}
                                <div className={styles.occBar}>
                                    <div className={styles.occFill} style={{
                                        width: `${pct}%`,
                                        background: pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e",
                                    }}/>
                                </div>

                                {/* Guide section */}
                                <div className={styles.guideSection}>
                                    {run.guide && guide ? (
                                        <div className={styles.assignedGuide}>
                                            <div className={styles.guideAvatar} style={{ background: avatarColor(guide.id) }}>
                                                {initials(guide.name)}
                                            </div>
                                            <div className={styles.guideInfo}>
                                                <span className={styles.guideName}>{guide.name}</span>
                                                <span className={styles.guideEmail}>{guide.email}</span>
                                            </div>
                                            <div className={styles.guideActions}>
                                                <button className={styles.changeBtn} onClick={() => openAssign(run)}>
                                                    Change
                                                </button>
                                                <button className={styles.unassignBtn} onClick={() => unassignGuide(run.id)}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.unassignedRow}>
                                            <div className={styles.unassignedBadge}>
                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                                </svg>
                                                No guide assigned
                                            </div>
                                            <button className={styles.assignBtn} onClick={() => openAssign(run)}>
                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                                </svg>
                                                Assign Guide
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ════════════ ASSIGN MODAL ════════════ */}
            {assignTarget && (
                <div className={styles.modalOverlay} onClick={() => setAssignTarget(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className={styles.modalHeader}>
                            <div>
                                <h2 className={styles.modalTitle}>Assign Tour Guide</h2>
                                <p className={styles.modalSub}>
                                    <span className={styles.modalCode}>{assignTarget.tourCode}</span>
                                    {assignTarget.tourName}
                                </p>
                            </div>
                            <button className={styles.modalClose} onClick={() => setAssignTarget(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>

                        {/* Schedule info */}
                        <div className={styles.modalInfo}>
                            <div className={styles.modalInfoItem}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                {fmtDate(assignTarget.startDate)} → {fmtDate(assignTarget.endDate)}
                            </div>
                            <div className={styles.modalInfoItem}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/>
                                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
                                </svg>
                                {assignTarget.destination}
                            </div>
                            <div className={styles.modalInfoItem}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                {assignTarget.booked}/{assignTarget.slots} booked
                            </div>
                        </div>

                        {/* Guide search */}
                        <div className={styles.guideSearchWrap}>
                            <svg viewBox="0 0 24 24" fill="none" className={styles.guideSearchIcon}>
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                            <input
                                type="text"
                                className={styles.guideSearchInput}
                                placeholder="Search guides by name or email…"
                                value={guideSearch}
                                onChange={e => setGuideSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Guide list */}
                        <div className={styles.guideList}>
                            {filteredGuides.length === 0 ? (
                                <p className={styles.guideEmpty}>No guides found</p>
                            ) : filteredGuides.map(guide => {
                                const isSelected = selectedGuide === guide.id;
                                const isCurrent  = assignTarget.guideId === guide.id;
                                const busy = guide.activeRuns >= 3;

                                return (
                                    <button
                                        key={guide.id}
                                        className={`${styles.guideCard} ${isSelected ? styles.guideCardSelected : ""} ${busy ? styles.guideCardBusy : ""}`}
                                        onClick={() => setSelectedGuide(isSelected ? null : guide.id)}
                                        disabled={busy && !isCurrent}
                                    >
                                        {/* Selection indicator */}
                                        <div className={`${styles.guideCardCheck} ${isSelected ? styles.guideCardCheckActive : ""}`}>
                                            {isSelected && (
                                                <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </div>

                                        <div className={styles.guideCardAvatar} style={{ background: avatarColor(guide.id) }}>
                                            {initials(guide.name)}
                                        </div>

                                        <div className={styles.guideCardBody}>
                                            <div className={styles.guideCardTop}>
                                                <span className={styles.guideCardName}>{guide.name}</span>
                                                {isCurrent && (
                                                    <span className={styles.currentBadge}>Current</span>
                                                )}
                                                {busy && !isCurrent && (
                                                    <span className={styles.busyBadge}>Busy</span>
                                                )}
                                            </div>
                                            <span className={styles.guideCardEmail}>{guide.email}</span>
                                            <div className={styles.guideCardStats}>
                                                <span className={styles.guideStatItem} style={{ color: guide.activeRuns >= 3 ? "#dc2626" : "#d97706" }}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                    </svg>
                                                    {guide.activeRuns} active
                                                </span>
                                                <span className={styles.guideStatItem} style={{ color: "#6b7280" }}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/>
                                                    </svg>
                                                    {guide.completedRuns} done
                                                </span>
                                            </div>

                                            {/* Workload bar */}
                                            <div className={styles.workloadBar}>
                                                <div
                                                    className={styles.workloadFill}
                                                    style={{
                                                        width: `${Math.min(guide.activeRuns / 5 * 100, 100)}%`,
                                                        background: guide.activeRuns >= 3 ? "#ef4444" : guide.activeRuns >= 2 ? "#f59e0b" : "#22c55e",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className={styles.modalFooter}>
                            {selectedGuide && (
                                <span className={styles.selectedHint}>
                                    Selected: {MOCK_GUIDES.find(g => g.id === selectedGuide)?.name}
                                </span>
                            )}
                            <div className={styles.modalFooterBtns}>
                                <button className={styles.cancelBtn} onClick={() => setAssignTarget(null)}>
                                    Cancel
                                </button>
                                <button
                                    className={styles.confirmBtn}
                                    onClick={confirmAssign}
                                    disabled={!selectedGuide}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M16 11l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Confirm Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import JobCard from "@/components/commons/job-card/job-card";
import { agencyService } from "@/libs/services/agency.service";
import { useSubRole } from "@/hooks/useSubRole";
import type { AgencyScheduleDTO } from "@/types/itinerary.type";
import styles from "./page.module.scss";

// ── Types ──────────────────────────────────────────────────────────────────────
type RunStatus = "confirmed" | "pending" | "completed" | "cancelled";

interface TourRun {
    id: string;
    tourName: string;
    tourCode: string;
    startDate: string;   // "YYYY-MM-DD"
    endDate: string;
    departureTime: string;
    guide: string;
    slots: number;
    booked: number;
    status: RunStatus;
    destination: string;
    notes?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<RunStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    confirmed: { label: "Confirmed", color: "#065f46", bg: "#d1fae5", border: "#10b981", dot: "#22c55e" },
    pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7", border: "#f59e0b", dot: "#f59e0b" },
    completed: { label: "Completed", color: "#1e40af", bg: "#dbeafe", border: "#3b82f6", dot: "#3b82f6" },
    cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2", border: "#ef4444", dot: "#ef4444" },
};

const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseDate  = (s: string) => new Date(s + "T00:00:00");
const isSameDay  = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const inRange    = (d: Date, s: Date, e: Date) => d >= s && d <= e;

function fmtDate(s: string) {
    return new Date(s + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toDateStr(dt: string): string {
    const d = new Date(dt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(dt: string): string {
    const d = new Date(dt);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
}

function normalizeStatus(s: string): RunStatus {
    const lower = s?.toLowerCase() ?? "pending";
    if (lower === "ongoing") return "confirmed";
    if (lower === "confirmed" || lower === "pending" || lower === "completed" || lower === "cancelled")
        return lower as RunStatus;
    return "pending";
}

function mapToTourRun(s: AgencyScheduleDTO): TourRun {
    return {
        id:            s.id,
        tourName:      s.itineraryName,
        tourCode:      s.id.slice(0, 8).toUpperCase(),
        startDate:     toDateStr(s.startTime),
        endDate:       toDateStr(s.endTime),
        departureTime: fmtTime(s.startTime),
        guide:         s.guideName ?? "Chưa phân công",
        slots:         s.spot,
        booked:        s.spot - s.spotLeft,
        status:        normalizeStatus(s.status),
        destination:   "",
    };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgencySchedulePage() {
    const today = useMemo(() => new Date(), []);

    const [curYear,  setCurYear]  = useState(today.getFullYear());
    const [curMonth, setCurMonth] = useState(today.getMonth());
    const [statusFilter, setStatusFilter] = useState<"all" | RunStatus>("all");
    const [popup,    setPopup]    = useState<{ date: Date; runs: TourRun[]; x: number; y: number } | null>(null);
    const [detail,   setDetail]   = useState<TourRun | null>(null);
    const [runs,     setRuns]     = useState<TourRun[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const popupRef  = useRef<HTMLDivElement>(null);

    const { is: isRole, ready: roleReady } = useSubRole("agency");

    // Fetch schedules based on sub-role
    useEffect(() => {
        if (!roleReady) return;
        setLoading(true);
        const fetch = isRole("tour_guide")
            ? agencyService.getMyGuideSchedules()
            : agencyService.getAgencySchedules();

        fetch
            .then(res => { if (res?.data) setRuns(res.data.map(mapToTourRun)); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [roleReady, isRole]);

    // Close popup on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node))
                setPopup(null);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Guide accept / reject ─────────────────────────────────────────────────
    async function handleAccept(scheduleId: string) {
        setActionLoading(true);
        try {
            await agencyService.acceptSchedule(scheduleId);
            setRuns(prev => prev.map(r =>
                r.id === scheduleId ? { ...r, status: "confirmed" } : r
            ));
            setDetail(prev => prev?.id === scheduleId ? { ...prev, status: "confirmed" } : prev);
        } catch { /* ignore */ } finally {
            setActionLoading(false);
        }
    }

    async function handleReject(scheduleId: string) {
        setActionLoading(true);
        try {
            await agencyService.rejectSchedule(scheduleId);
            // Schedule gets unassigned — remove it from the guide's list
            setRuns(prev => prev.filter(r => r.id !== scheduleId));
            setDetail(null);
        } catch { /* ignore */ } finally {
            setActionLoading(false);
        }
    }

    // ── Calendar grid ──────────────────────────────────────────────────────────
    const cells = useMemo(() => {
        const firstDay = new Date(curYear, curMonth, 1).getDay();
        const daysInMo = new Date(curYear, curMonth + 1, 0).getDate();
        const prevDays = new Date(curYear, curMonth, 0).getDate();
        const arr: { day: number; thisMonth: boolean; date: Date }[] = [];
        for (let i = 0; i < firstDay; i++) {
            const day = prevDays - firstDay + 1 + i;
            arr.push({ day, thisMonth: false, date: new Date(curYear, curMonth - 1, day) });
        }
        for (let i = 1; i <= daysInMo; i++)
            arr.push({ day: i, thisMonth: true, date: new Date(curYear, curMonth, i) });
        const rem = 42 - arr.length;
        for (let i = 1; i <= rem; i++)
            arr.push({ day: i, thisMonth: false, date: new Date(curYear, curMonth + 1, i) });
        return arr;
    }, [curYear, curMonth]);

    function prevMonth() {
        if (curMonth === 0) { setCurYear(y => y - 1); setCurMonth(11); }
        else setCurMonth(m => m - 1);
    }
    function nextMonth() {
        if (curMonth === 11) { setCurYear(y => y + 1); setCurMonth(0); }
        else setCurMonth(m => m + 1);
    }

    const todayColIndex = today.getDay();
    const isCurrentMonthView = curYear === today.getFullYear() && curMonth === today.getMonth();

    function runsOnDate(date: Date): TourRun[] {
        return runs.filter(r => inRange(date, parseDate(r.startDate), parseDate(r.endDate)));
    }

    // ── Right panel: upcoming runs ─────────────────────────────────────────────
    const upcomingRuns = useMemo(() => {
        return runs
            .filter(r => {
                if (statusFilter === "all") return r.status !== "completed" && r.status !== "cancelled";
                return r.status === statusFilter;
            })
            .sort((a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime());
    }, [runs, statusFilter]);

    const stats = useMemo(() => ({
        total:     runs.length,
        confirmed: runs.filter(r => r.status === "confirmed").length,
        pending:   runs.filter(r => r.status === "pending").length,
        thisMonth: runs.filter(r => {
            const s = parseDate(r.startDate);
            return s.getFullYear() === today.getFullYear() && s.getMonth() === today.getMonth();
        }).length,
    }), [runs, today]);

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>

            {/* ── Summary pills ── */}
            <div className={styles.summaryRow}>
                {[
                    { label: "Total Runs",   value: stats.total,     color: "#6366f1", bg: "#eef2ff" },
                    { label: "Confirmed",    value: stats.confirmed, color: "#059669", bg: "#d1fae5" },
                    { label: "Pending",      value: stats.pending,   color: "#d97706", bg: "#fef3c7" },
                    { label: "This Month",   value: stats.thisMonth, color: "#2563eb", bg: "#dbeafe" },
                ].map(s => (
                    <div key={s.label} className={styles.summaryPill} style={{ background: s.bg }}>
                        <span className={styles.summaryNum} style={{ color: s.color }}>{s.value}</span>
                        <span className={styles.summaryLabel}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <div className={styles.monthNav}>
                        <button className={styles.arrowBtn} onClick={prevMonth}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <span className={styles.monthLabel}>{MONTHS[curMonth]} {curYear}</span>
                        <button className={styles.arrowBtn} onClick={nextMonth}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <div className={styles.legend}>
                        {(Object.entries(STATUS_CFG) as [RunStatus, typeof STATUS_CFG[RunStatus]][]).map(([k, v]) => (
                            <span key={k} className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ background: v.dot }}/>
                                {v.label}
                            </span>
                        ))}
                    </div>
                </div>

                <div className={styles.topRight}>
                    <button
                        className={styles.todayBtn}
                        onClick={() => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); }}
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className={styles.body}>

                {/* ══ Calendar ══ */}
                <div className={styles.calWrap}>
                    <div className={styles.weekRow}>
                        {WEEKDAYS.map((w, i) => {
                            const isToday = isCurrentMonthView && i === todayColIndex;
                            return (
                                <div key={w} className={`${styles.weekHead} ${isToday ? styles.weekHeadToday : ""}`}>
                                    {isToday
                                        ? <span className={styles.todayPill}>{w}</span>
                                        : w
                                    }
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.grid}>
                        {cells.map((cell, idx) => {
                            const colIndex   = idx % 7;
                            const isToday    = isSameDay(cell.date, today);
                            const isTodayCol = isCurrentMonthView && colIndex === todayColIndex;
                            const dayRuns    = runsOnDate(cell.date);
                            const visible    = dayRuns.slice(0, 2);
                            const more       = dayRuns.length - 2;

                            return (
                                <div
                                    key={idx}
                                    className={[
                                        styles.cell,
                                        !cell.thisMonth ? styles.cellOther : "",
                                        isTodayCol      ? styles.cellTodayCol : "",
                                    ].join(" ")}
                                >
                                    <div className={styles.cellHead}>
                                        <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ""}`}>
                                            {cell.day}
                                        </span>
                                    </div>

                                    <div className={styles.events}>
                                        {visible.map(run => {
                                            const isStart = isSameDay(cell.date, parseDate(run.startDate));
                                            return (
                                                <JobCard
                                                    key={run.id}
                                                    time={isStart ? run.departureTime : "On tour"}
                                                    title={run.tourName}
                                                    status={run.status}
                                                    onClick={() => setDetail(run)}
                                                />
                                            );
                                        })}
                                        {more > 0 && (
                                            <button
                                                className={styles.viewMore}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    const rect = (e.currentTarget as HTMLElement)
                                                        .closest(`.${styles.cell}`)?.getBoundingClientRect();
                                                    setPopup({ date: cell.date, runs: dayRuns, x: rect?.left ?? 0, y: rect?.bottom ?? 0 });
                                                }}
                                            >
                                                +{more} more
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Day popup ── */}
                    {popup && (
                        <div className={styles.popupOverlay} onClick={() => setPopup(null)}>
                            <div
                                className={styles.popup}
                                ref={popupRef}
                                onClick={e => e.stopPropagation()}
                                style={{ left: Math.min(popup.x, window.innerWidth - 300), top: popup.y + 8 }}
                            >
                                <div className={styles.popupHeader}>
                                    <span className={styles.popupDay}>{popup.date.getDate()}</span>
                                    <span className={styles.popupMonth}>
                                        {MONTHS[popup.date.getMonth()].slice(0, 3)} {popup.date.getFullYear()}
                                    </span>
                                    <button className={styles.popupClose} onClick={() => setPopup(null)}>
                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className={styles.popupList}>
                                    {popup.runs.map(run => {
                                        const isStart = isSameDay(popup.date, parseDate(run.startDate));
                                        return (
                                            <JobCard
                                                key={run.id}
                                                time={isStart ? run.departureTime : "On tour"}
                                                title={run.tourName}
                                                status={run.status}
                                                onClick={() => { setPopup(null); setDetail(run); }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ══ Right panel: upcoming ══ */}
                <div className={styles.rightPanel}>
                    <div className={styles.rpHeader}>
                        <h3 className={styles.rpTitle}>Upcoming Tours</h3>
                    </div>

                    <div className={styles.rpFilter}>
                        <select
                            className={styles.rpSelect}
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as "all" | RunStatus)}
                        >
                            <option value="all">All Status</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className={styles.rpList}>
                        {upcomingRuns.length === 0 ? (
                            <p className={styles.rpEmpty}>No runs found</p>
                        ) : upcomingRuns.map(run => {
                            const cfg = STATUS_CFG[run.status];
                            const pct = run.slots > 0 ? Math.round(run.booked / run.slots * 100) : 0;
                            return (
                                <div
                                    key={run.id}
                                    className={styles.rpCard}
                                    style={{ borderLeftColor: cfg.border }}
                                    onClick={() => setDetail(run)}
                                >
                                    <div className={styles.rpCardTop}>
                                        <span className={styles.rpCardCode}>{run.tourCode}</span>
                                        <span className={styles.rpCardStatus} style={{ background: cfg.bg, color: cfg.color }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className={styles.rpCardName}>{run.tourName}</p>
                                    <div className={styles.rpCardMeta}>
                                        <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                        {fmtDate(run.startDate)} → {fmtDate(run.endDate)}
                                    </div>
                                    <div className={styles.rpOccupancy}>
                                        <div className={styles.rpOccBar}>
                                            <div
                                                className={styles.rpOccFill}
                                                style={{
                                                    width: `${pct}%`,
                                                    background: pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e",
                                                }}
                                            />
                                        </div>
                                        <span className={styles.rpOccText}>{run.booked}/{run.slots}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ════════════════ DETAIL MODAL ════════════════ */}
            {detail && (
                <div className={styles.detailOverlay} onClick={() => setDetail(null)}>
                    <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.detailHeader}>
                            <div className={styles.detailHeaderLeft}>
                                <span className={styles.detailCode}>{detail.tourCode}</span>
                                <span
                                    className={styles.detailStatus}
                                    style={{ background: STATUS_CFG[detail.status].bg, color: STATUS_CFG[detail.status].color }}
                                >
                                    <span className={styles.detailStatusDot} style={{ background: STATUS_CFG[detail.status].dot }}/>
                                    {STATUS_CFG[detail.status].label}
                                </span>
                            </div>
                            <button className={styles.detailClose} onClick={() => setDetail(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.detailBody}>
                            <h2 className={styles.detailTourName}>{detail.tourName}</h2>

                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                        Start Date
                                    </span>
                                    <span className={styles.detailVal}>{fmtDate(detail.startDate)}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                        End Date
                                    </span>
                                    <span className={styles.detailVal}>{fmtDate(detail.endDate)}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                        Departure
                                    </span>
                                    <span className={styles.detailVal}>{detail.departureTime}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
                                        Tour Guide
                                    </span>
                                    <span className={styles.detailVal}>{detail.guide}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                        Occupancy
                                    </span>
                                    <span className={styles.detailVal}>{detail.booked} / {detail.slots} pax</span>
                                </div>
                            </div>

                            {(() => {
                                const pct = detail.slots > 0 ? Math.round(detail.booked / detail.slots * 100) : 0;
                                return (
                                    <div className={styles.detailOccupancy}>
                                        <div className={styles.detailOccHeader}>
                                            <span className={styles.detailOccLabel}>Seat Occupancy</span>
                                            <span className={styles.detailOccPct} style={{
                                                color: pct >= 90 ? "#dc2626" : pct >= 60 ? "#d97706" : "#16a34a"
                                            }}>{pct}%</span>
                                        </div>
                                        <div className={styles.detailOccTrack}>
                                            <div
                                                className={styles.detailOccFill}
                                                style={{
                                                    width: `${pct}%`,
                                                    background: pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e",
                                                }}
                                            />
                                        </div>
                                        <div className={styles.detailOccSubtext}>
                                            {detail.slots - detail.booked} seat{detail.slots - detail.booked !== 1 ? "s" : ""} remaining
                                        </div>
                                    </div>
                                );
                            })()}

                            {detail.notes && (
                                <div className={styles.detailNotes}>
                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ color: "#f59e0b", flexShrink: 0 }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    <span>{detail.notes}</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.detailFooter}>
                            {isRole("tour_guide") && detail.status === "pending" ? (
                                <>
                                    <button
                                        className={styles.detailBtnSecondary}
                                        onClick={() => setDetail(null)}
                                        disabled={actionLoading}
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        className={styles.detailBtnReject}
                                        onClick={() => handleReject(detail.id)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? "..." : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                                Từ chối
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className={styles.detailBtnAccept}
                                        onClick={() => handleAccept(detail.id)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? "..." : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                Chấp nhận
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button className={styles.detailBtnSecondary} onClick={() => setDetail(null)}>Đóng</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

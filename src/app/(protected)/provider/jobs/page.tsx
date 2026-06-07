"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import JobCard from "@/components/commons/job-card/job-card";
import StaffAssignmentModal from "@/components/commons/staff-assignment-modal/staff-assignment-modal";
import JobDetailModal from "@/components/commons/job-detail-modal/job-detail-modal";
import { providerService } from "@/libs/services/provider.service";
import type { ProviderScheduleDTO, ProviderJobWithStopsDTO } from "@/types/itinerary.type";
import { useSubRole } from "@/hooks/useSubRole";
import { authService } from "@/libs/services/auth.service";
import styles from "./page.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
type JobStatus = "confirmed" | "pending" | "completed" | "cancelled";

interface TourJob {
    id: string;
    groupName: string;
    agency: string;
    arrivalDate: string;
    departureDate: string;
    arrivalTime: string;
    people: number;
    services: string[];
    status: JobStatus;
    notes?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<JobStatus, { label: string; color: string; bg: string; border: string }> = {
    confirmed: { label: "confirmed", color: "#065f46", bg: "#d1fae5", border: "#10b981" },
    pending:   { label: "pending",   color: "#92400e", bg: "#fef3c7", border: "#f59e0b" },
    completed: { label: "completed", color: "#1e40af", bg: "#dbeafe", border: "#3b82f6" },
    cancelled: { label: "cancelled", color: "#991b1b", bg: "#fee2e2", border: "#ef4444" },
};

const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseDate = (s: string) => new Date(s + "T00:00:00");
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

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

function deriveStatus(startTime: string, endTime: string): JobStatus {
    const now   = new Date();
    const end   = new Date(endTime);
    const start = new Date(startTime);
    if (end < now) return "completed";
    if (start <= now && end >= now) return "confirmed";
    return "confirmed";
}

function mapToTourJob(s: ProviderScheduleDTO): TourJob {
    return {
        id:           s.id,
        groupName:    s.itineraryName,
        agency:       s.agencyName,
        arrivalDate:  toDateStr(s.startTime),
        departureDate:toDateStr(s.endTime),
        arrivalTime:  s.firstActivityTime ? fmtTime(s.firstActivityTime) : fmtTime(s.startTime),
        people:       s.spot,
        services:     [],
        status:       deriveStatus(s.startTime, s.endTime),
    };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProviderJobsPage() {
    const today = useMemo(() => new Date(), []);

    const [curYear,  setCurYear]  = useState(today.getFullYear());
    const [curMonth, setCurMonth] = useState(today.getMonth());
    const [filter,   setFilter]   = useState<"all" | JobStatus>("all");
    const [catOpen,  setCatOpen]  = useState(false);
    const [popup,    setPopup]    = useState<{ date: Date; jobs: TourJob[]; x: number; y: number } | null>(null);
    const [jobs,        setJobs]        = useState<TourJob[]>([]);
    const [jobsWithStops, setJobsWithStops] = useState<Map<string, ProviderJobWithStopsDTO>>(new Map());
    const [staffModal,  setStaffModal]  = useState<ProviderJobWithStopsDTO | null>(null);
    const [detailModal, setDetailModal] = useState<ProviderJobWithStopsDTO | null>(null);
    const [loading,     setLoading]     = useState(true);
    const [myUserId,    setMyUserId]    = useState<string | null>(null);
    const catRef   = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const { can } = useSubRole("provider");
    const canAssign = can("provider.jobs.manage"); // manager only

    // Fetch schedules + stops/staff data
    useEffect(() => {
        Promise.all([
            providerService.getJobSchedules(),
            providerService.getJobsWithStops(),
            authService.getMe(),
        ]).then(([schedRes, stopsRes, meRes]) => {
            const uid = meRes?.data?.id ?? null;
            setMyUserId(uid);

            if (stopsRes?.data) {
                let jobData = stopsRes.data;

                // Staff: only show schedules where they're assigned to at least 1 stop
                if (!canAssign && uid) {
                    jobData = jobData
                        .filter(j => j.stops.some(s => s.assignedStaffId === uid))
                        .map(j => ({
                            ...j,
                            stops: j.stops.filter(s => s.assignedStaffId === uid),
                        }));
                }

                const map = new Map<string, ProviderJobWithStopsDTO>();
                jobData.forEach(j => map.set(j.scheduleId, j));
                setJobsWithStops(map);

                if (schedRes?.data) {
                    const visibleIds = new Set(jobData.map(j => j.scheduleId));
                    const filtered = canAssign
                        ? schedRes.data
                        : schedRes.data.filter(s => visibleIds.has(s.id));
                    setJobs(filtered.map(mapToTourJob));
                }
            } else if (schedRes?.data) {
                setJobs(schedRes.data.map(mapToTourJob));
            }
        }).catch(() => {}).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canAssign]);

    // Close category dropdown on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Grid cells ────────────────────────────────────────────────────────────
    const cells = useMemo(() => {
        const firstDay  = new Date(curYear, curMonth, 1).getDay();
        const daysInMo  = new Date(curYear, curMonth + 1, 0).getDate();
        const prevDays  = new Date(curYear, curMonth, 0).getDate();
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

    const todayColIndex      = today.getDay();
    const isCurrentMonthView = curYear === today.getFullYear() && curMonth === today.getMonth();

    function jobsOnDate(date: Date): TourJob[] {
        return jobs.filter(j => isSameDay(date, parseDate(j.arrivalDate)));
    }

    // Right panel: pending/unconfirmed groups
    const unconfirmed = useMemo(() =>
        jobs
            .filter(j => filter === "all" ? j.status === "pending" : j.status === filter)
            .sort((a, b) => parseDate(a.arrivalDate).getTime() - parseDate(b.arrivalDate).getTime()),
    [jobs, filter]);

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
        <>
        <div className={styles.page}>

            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    {/* Month nav */}
                    <div className={styles.monthNav}>
                        <button className={styles.arrowBtn} onClick={prevMonth}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <span className={styles.monthLabel}>
                            {MONTHS[curMonth]} {curYear}
                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </span>
                        <button className={styles.arrowBtn} onClick={nextMonth}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={styles.topRight}>
                    <button
                        className={styles.todayBtn}
                        onClick={() => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); }}
                    >
                        Today
                    </button>
                    <button className={styles.iconBtn}>
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/>
                            <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/>
                            <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/>
                            <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className={styles.body}>

                {/* ══ Calendar ══ */}
                <div className={styles.calWrap}>
                    {/* Weekday headers */}
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

                    {/* Grid */}
                    <div className={styles.grid}>
                        {cells.map((cell, idx) => {
                            const colIndex   = idx % 7;
                            const isToday    = isSameDay(cell.date, today);
                            const isTodayCol = isCurrentMonthView && colIndex === todayColIndex;
                            const dayJobs    = jobsOnDate(cell.date);
                            const visible    = dayJobs.slice(0, 1);
                            const more       = dayJobs.length - 1;

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
                                        <span className={styles.addNew}>Add New</span>
                                        <span className={`${styles.dayNum} ${isToday ? styles.dayNumToday : ""}`}>
                                            {cell.day}
                                        </span>
                                    </div>

                                    <div className={styles.events}>
                                        {visible.map(job => {
                                                const jws = jobsWithStops.get(job.id);
                                                const hasUnassigned = jws?.stops.some(s => !s.assignedStaffId) ?? false;
                                                return (
                                                    <JobCard
                                                        key={job.id}
                                                        time={job.arrivalTime}
                                                        title={job.groupName}
                                                        status={job.status}
                                                        hasUnassignedStop={canAssign && hasUnassigned}
                                                        onClick={jws ? () => setDetailModal(jws) : undefined}
                                                        onViewStaff={canAssign && jws ? () => setStaffModal(jws) : undefined}
                                                    />
                                                );
                                            })}
                                        {more > 0 && (
                                            <button
                                                className={styles.viewMore}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    const rect = (e.currentTarget as HTMLElement).closest(`.${styles.cell}`)?.getBoundingClientRect();
                                                    setPopup({ date: cell.date, jobs: dayJobs, x: rect?.left ?? 0, y: rect?.top ?? 0 });
                                                }}
                                            >
                                                View {more} More
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Popup ── */}
                    {popup && (
                        <div className={styles.popupOverlay} onClick={() => setPopup(null)}>
                            <div
                                className={styles.popup}
                                ref={popupRef}
                                onClick={e => e.stopPropagation()}
                                style={{ left: popup.x, top: popup.y }}
                            >
                                <div className={styles.popupHeader}>
                                    <span className={styles.popupDay}>{popup.date.getDate()}</span>
                                    <button className={styles.popupClose} onClick={() => setPopup(null)}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className={styles.popupList}>
                                    {popup.jobs.map(job => (
                                        <JobCard
                                            key={job.id}
                                            time={job.arrivalTime}
                                            title={job.groupName}
                                            status={job.status}
                                            onCancel={() => setPopup(null)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ══ Right panel ══ */}
                <div className={styles.rightPanel}>
                    <div className={styles.rpHeader}>
                        <h3 className={styles.rpTitle}>Unconfirmed Groups</h3>
                    </div>

                    <div className={styles.rpSelect}>
                        <select
                            className={styles.rpSelectInput}
                            value={filter}
                            onChange={e => setFilter(e.target.value as "all" | JobStatus)}
                        >
                            <option value="all">Select</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                        </select>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={styles.rpSelectArrow}>
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>

                    <div className={styles.rpList}>
                        {unconfirmed.length === 0 ? (
                            <p className={styles.rpEmpty}>No pending groups</p>
                        ) : unconfirmed.map(job => {
                            const cfg = STATUS_CFG[job.status];
                            return (
                                <div key={job.id} className={styles.rpCard} style={{ borderLeftColor: cfg.border }}>
                                    <div className={styles.rpCardTop}>
                                        <span className={styles.rpCardTime}>
                                            <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                            {job.arrivalTime}
                                        </span>
                                        <button className={styles.menuBtn} onClick={e => e.stopPropagation()}>
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                                                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <span className={styles.rpCardName}>{job.groupName}</span>
                                    <span className={styles.rpCardMeta}>{job.agency} · {job.people} pax</span>
                                    <span className={styles.eventBadge} style={{ background: cfg.bg, color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <button className={styles.addDraftBtn}>
                        <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                        </svg>
                        Add New Job
                    </button>
                </div>
            </div>
        </div>

        {detailModal && (
            <JobDetailModal
                job={detailModal}
                onClose={() => setDetailModal(null)}
                onViewStaff={canAssign ? () => { setDetailModal(null); setStaffModal(detailModal); } : undefined}
            />
        )}

        {staffModal && (
            <StaffAssignmentModal
                job={staffModal}
                onClose={() => setStaffModal(null)}
                onAssigned={(stopId, staff) => {
                    setJobsWithStops(prev => {
                        const next = new Map(prev);
                        const job = next.get(staffModal.scheduleId);
                        if (job) {
                            next.set(staffModal.scheduleId, {
                                ...job,
                                stops: job.stops.map(s =>
                                    s.stopId === stopId
                                        ? { ...s, assignedStaffId: staff.userId, assignedStaffName: staff.userFullName, assignedStaffEmail: staff.email }
                                        : s
                                ),
                            });
                        }
                        return next;
                    });
                }}
            />
        )}
        </>
    );
}

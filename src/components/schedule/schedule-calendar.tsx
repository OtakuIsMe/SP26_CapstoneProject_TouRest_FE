"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import JobCard from "@/components/commons/job-card/job-card";
import { agencyService, ScheduleCancelPreviewDTO } from "@/libs/services/agency.service";
import { adminService, AdminScheduleCancelPreviewDTO } from "@/libs/services/admin.service";
import {
    fmtDate, isSameDay, MONTHS, parseDate, STATUS_CFG, TourRun, RunStatus,
    ScheduleCalendarMode, WEEKDAYS,
} from "./schedule.types";
import styles from "./schedule-calendar.module.scss";

export interface ScheduleCalendarProps {
    runs: TourRun[];
    setRuns: React.Dispatch<React.SetStateAction<TourRun[]>>;
    loading: boolean;
    mode: ScheduleCalendarMode;
}

export default function ScheduleCalendar({ runs, setRuns, loading, mode }: ScheduleCalendarProps) {
    const today = useMemo(() => new Date(), []);
    const showAgency = mode === "admin";

    const [curYear,  setCurYear]  = useState(today.getFullYear());
    const [curMonth, setCurMonth] = useState(today.getMonth());
    const [statusFilter, setStatusFilter] = useState<"all" | RunStatus>("all");
    const [popup,    setPopup]    = useState<{ date: Date; runs: TourRun[]; x: number; y: number } | null>(null);
    const [detail,   setDetail]   = useState<TourRun | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const popupRef  = useRef<HTMLDivElement>(null);

    const [cancelTarget,  setCancelTarget]  = useState<TourRun | null>(null);
    const [cancelPreview, setCancelPreview] = useState<ScheduleCancelPreviewDTO | null>(null);
    const [adminCancelPreview, setAdminCancelPreview] = useState<AdminScheduleCancelPreviewDTO | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node))
                setPopup(null);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

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
            setRuns(prev => prev.filter(r => r.id !== scheduleId));
            setDetail(null);
        } catch { /* ignore */ } finally {
            setActionLoading(false);
        }
    }

    async function openCancelModal(run: TourRun) {
        setCancelTarget(run);
        setCancelPreview(null);
        setAdminCancelPreview(null);
        setCancelLoading(true);
        try {
            if (mode === "admin") {
                const res = await adminService.previewCancelSchedule(run.id);
                if (res?.data) setAdminCancelPreview(res.data);
            } else {
                const res = await agencyService.previewCancelSchedule(run.id);
                if (res?.data) setCancelPreview(res.data);
            }
        } catch { /* ignore */ } finally {
            setCancelLoading(false);
        }
    }

    async function confirmCancel() {
        if (!cancelTarget) return;
        setCancelLoading(true);
        try {
            if (mode === "admin") {
                await adminService.cancelSchedule(cancelTarget.id);
            } else {
                await agencyService.cancelScheduleWithDeposit(cancelTarget.id);
            }
            setRuns(prev => prev.filter(r => r.id !== cancelTarget.id));
            setDetail(null);
            setCancelTarget(null);
            setCancelPreview(null);
            setAdminCancelPreview(null);
        } catch { /* ignore */ } finally {
            setCancelLoading(false);
        }
    }

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
        return runs.filter(r => isSameDay(date, parseDate(r.startDate)));
    }

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

            <div className={styles.body}>
                <div className={styles.calWrap}>
                    <div className={styles.weekRow}>
                        {WEEKDAYS.map((w, i) => {
                            const isToday = isCurrentMonthView && i === todayColIndex;
                            return (
                                <div key={w} className={`${styles.weekHead} ${isToday ? styles.weekHeadToday : ""}`}>
                                    {isToday ? <span className={styles.todayPill}>{w}</span> : w}
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
                                    {showAgency && run.agencyName && (
                                        <p className={styles.rpCardAgency}>{run.agencyName}</p>
                                    )}
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
                            {showAgency && detail.agencyName && (
                                <p className={styles.detailAgency}>{detail.agencyName}</p>
                            )}
                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>Start Date</span>
                                    <span className={styles.detailVal}>{fmtDate(detail.startDate)}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>End Date</span>
                                    <span className={styles.detailVal}>{fmtDate(detail.endDate)}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>Departure</span>
                                    <span className={styles.detailVal}>{detail.departureTime}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>Tour Guide</span>
                                    <span className={styles.detailVal}>{detail.guide}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailKey}>Occupancy</span>
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
                                    </div>
                                );
                            })()}
                        </div>
                        <div className={styles.detailFooter}>
                            {(mode === "agency-manager" || mode === "admin") &&
                                (detail.status === "confirmed" || detail.status === "pending") && (
                                <button
                                    className={styles.detailBtnCancel}
                                    onClick={() => { setDetail(null); openCancelModal(detail); }}
                                    disabled={actionLoading}
                                >
                                    Cancel Schedule
                                </button>
                            )}
                            {mode === "agency-guide" && detail.status === "pending" ? (
                                <>
                                    <button className={styles.detailBtnSecondary} onClick={() => setDetail(null)} disabled={actionLoading}>Close</button>
                                    <button className={styles.detailBtnReject} onClick={() => handleReject(detail.id)} disabled={actionLoading}>
                                        {actionLoading ? "..." : "Decline"}
                                    </button>
                                    <button className={styles.detailBtnAccept} onClick={() => handleAccept(detail.id)} disabled={actionLoading}>
                                        {actionLoading ? "..." : "Accept"}
                                    </button>
                                </>
                            ) : (
                                <button className={styles.detailBtnSecondary} onClick={() => setDetail(null)}>Close</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {cancelTarget && (mode === "agency-manager" || mode === "admin") && (
                <div className={styles.detailOverlay} onClick={() => { if (!cancelLoading) { setCancelTarget(null); setCancelPreview(null); setAdminCancelPreview(null); } }}>
                    <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.detailHeader}>
                            <div className={styles.detailHeaderLeft}>
                                <span className={styles.detailCode} style={{ color: "#ef4444" }}>Confirm Cancel Schedule</span>
                            </div>
                            <button className={styles.detailClose} onClick={() => { setCancelTarget(null); setCancelPreview(null); setAdminCancelPreview(null); }}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className={styles.detailBody}>
                            <h2 className={styles.detailTourName}>{cancelTarget.tourName}</h2>
                            {cancelLoading && !cancelPreview && !adminCancelPreview ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                                    <div className={styles.spinner} />
                                </div>
                            ) : mode === "admin" && adminCancelPreview ? (
                                <p style={{ fontSize: 13, color: "#6b7280" }}>
                                    Affects <strong>{adminCancelPreview.affectedBookings}</strong> booking(s).
                                    Deposit refund to agency: {adminCancelPreview.totalDepositRefund.toLocaleString("vi-VN")}đ
                                    {" · "}
                                    Customer refund: {adminCancelPreview.totalCustomerRefund.toLocaleString("vi-VN")}đ
                                    <br />
                                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                        Admin cancellation — full deposit and trip refunds (no 48h penalty).
                                    </span>
                                </p>
                            ) : cancelPreview ? (
                                <p style={{ fontSize: 13, color: "#6b7280" }}>
                                    Affects <strong>{cancelPreview.affectedBookings}</strong> booking(s).
                                    Refund: {cancelPreview.totalToRefund.toLocaleString("vi-VN")}đ
                                    {cancelPreview.totalToForfeit > 0 && (
                                        <> · Forfeit: {cancelPreview.totalToForfeit.toLocaleString("vi-VN")}đ</>
                                    )}
                                </p>
                            ) : null}
                        </div>
                        <div className={styles.detailFooter}>
                            <button className={styles.detailBtnSecondary} onClick={() => { setCancelTarget(null); setCancelPreview(null); setAdminCancelPreview(null); }} disabled={cancelLoading}>
                                Keep Schedule
                            </button>
                            <button
                                className={styles.detailBtnReject}
                                style={{ background: "#ef4444", color: "#fff", borderColor: "#ef4444" }}
                                onClick={confirmCancel}
                                disabled={cancelLoading}
                            >
                                Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

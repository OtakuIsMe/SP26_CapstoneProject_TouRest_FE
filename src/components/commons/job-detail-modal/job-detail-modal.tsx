"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ProviderJobWithStopsDTO, ProviderStopActivityDTO } from "@/types/itinerary.type";
import styles from "./job-detail-modal.module.scss";

interface Props {
    job: ProviderJobWithStopsDTO;
    onClose: () => void;
    onViewStaff?: () => void;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    Confirmed: { label: "Confirmed", color: "#065f46", bg: "#d1fae5" },
    Pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7" },
    Completed: { label: "Completed", color: "#1e40af", bg: "#dbeafe" },
    Cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2" },
};

function fmtDate(dt: string) {
    return new Date(dt).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(dt: string) {
    return new Date(dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// Compute actual calendar date for a stop:
// Activities are stored as 2000-01-01 (Day 1), 2000-01-02 (Day 2), etc.
// Map that offset onto the real schedule start date.
const BASE_DAY_MS = Date.UTC(2000, 0, 1);
function stopActualDate(scheduleStart: string, firstActTime?: string): string {
    if (!firstActTime) return fmtDate(scheduleStart);
    const actD = new Date(firstActTime);
    const actUTC = Date.UTC(actD.getUTCFullYear(), actD.getUTCMonth(), actD.getUTCDate());
    const dayOffset = Math.round((actUTC - BASE_DAY_MS) / 86400000);
    const s = new Date(scheduleStart);
    const result = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate() + dayOffset));
    return fmtDate(result.toISOString());
}
function durationMins(start: string, end: string) {
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}
function tripDays(start: string, end: string) {
    const d = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
    return d > 0 ? `${d} day${d > 1 ? "s" : ""}` : "< 1 day";
}
function fmtPrice(p: number) {
    return p > 0 ? p.toLocaleString("vi-VN") + " ₫" : "Included";
}

function ActivityRow({ act }: { act: ProviderStopActivityDTO }) {
    const displayName = act.name;
    return (
        <div className={styles.actRow}>
            <div className={styles.actTime}>
                <span className={styles.actTimeStart}>{fmtTime(act.startTime)}</span>
                <span className={styles.actTimeDur}>{durationMins(act.startTime, act.endTime)}</span>
            </div>
            <div className={styles.actDot} />
            <div className={styles.actBody}>
                <span className={styles.actName}>{displayName}</span>
                <div className={styles.actMeta}>
                    <span className={styles.actPrice}>{fmtPrice(act.price)}</span>
                    {act.note && <span className={styles.actNote}>{act.note}</span>}
                </div>
            </div>
        </div>
    );
}

export default function JobDetailModal({ job, onClose, onViewStaff }: Props) {
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [onClose]);

    const cfg = STATUS_CFG[job.status] ?? STATUS_CFG.Pending;
    const assignedCount = job.stops.filter(s => s.assignedStaffId).length;

    const modal = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div>
                            <span className={styles.badge} style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                            <h2 className={styles.title}>{job.itineraryName}</h2>
                            <p className={styles.agency}>
                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                    <path d="M3 21V7l9-4 9 4v14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                                    <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                                </svg>
                                {job.agencyName}
                            </p>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>

                    {/* Quick info row */}
                    <div className={styles.infoRow}>
                        <div className={styles.infoChip}>
                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                            {fmtDate(job.startTime)}
                        </div>
                        <div className={styles.infoChip}>
                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                            {job.spot} guests
                        </div>
                        <div className={styles.infoChip} style={{ color: assignedCount < job.stops.length ? "#f59e0b" : "#10b981", borderColor: assignedCount < job.stops.length ? "#fde68a" : "#bbf7d0", background: assignedCount < job.stops.length ? "#fffbeb" : "#f0fdf4" }}>
                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                            {assignedCount}/{job.stops.length} staff assigned
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className={styles.body}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionLabel}>Schedule at your stops</span>
                        {onViewStaff && (
                            <button className={styles.manageBtn} onClick={() => { onClose(); onViewStaff(); }}>
                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Manage Staff
                            </button>
                        )}
                    </div>

                    {job.stops.length === 0 ? (
                        <p className={styles.empty}>No stops for this provider.</p>
                    ) : (
                        <div className={styles.stopList}>
                            {job.stops.map((stop, idx) => (
                                <div key={stop.stopId} className={styles.stopCard}>
                                    {/* Stop header */}
                                    <div className={styles.stopHeader}>
                                        <div className={styles.stopLeft}>
                                            <div className={styles.stopDot}>{stop.stopOrder}</div>
                                            <div>
                                                <span className={styles.stopName}>{stop.name}</span>
                                                <span className={styles.stopDate}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                    </svg>
                                                    {stopActualDate(job.startTime, stop.activities[0]?.startTime)}
                                                </span>
                                                {stop.address && (
                                                    <span className={styles.stopAddr}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/>
                                                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
                                                        </svg>
                                                        {stop.address}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Assigned staff chip */}
                                        {stop.assignedStaffId ? (
                                            <div className={styles.staffChip}>
                                                <div className={styles.staffAvatar}>
                                                    {(stop.assignedStaffName ?? "?")[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className={styles.staffName}>{stop.assignedStaffName}</span>
                                                    <span className={styles.staffEmail}>{stop.assignedStaffEmail}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className={styles.unassigned}>
                                                <span className={styles.warnDot}>!</span>
                                                Unassigned
                                            </span>
                                        )}
                                    </div>

                                    {/* Activities timeline */}
                                    {stop.activities.length > 0 ? (
                                        <div className={styles.actList}>
                                            {stop.activities.map(act => (
                                                <ActivityRow key={act.activityId} act={act} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.noAct}>No activities scheduled for this stop.</p>
                                    )}

                                    {/* Connector line between stops */}
                                    {idx < job.stops.length - 1 && <div className={styles.stopConnector}/>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}

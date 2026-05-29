"use client";

import { useState, useEffect, useCallback } from "react";
import { agencyService } from "@/libs/services/agency.service";
import { trackingService, TrackingTypeActivity, TrackingDTO } from "@/libs/services/tracking.service";
import { AgencyScheduleDTO, ItineraryStopWithActivitiesDTO, StopActivityDTO } from "@/types/itinerary.type";
import styles from "./page.module.scss";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function scheduleStatusLabel(s: AgencyScheduleDTO): { label: string; cls: string } {
    const now = Date.now();
    const start = new Date(s.startTime).getTime();
    const end   = new Date(s.endTime).getTime();
    if (now > end)             return { label: "Ended",      cls: styles.badgeEnded };
    if (now >= start)          return { label: "In Progress", cls: styles.badgeActive };
    return                            { label: s.status,      cls: styles.badgePending };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GuidTrackingPage() {
    const [schedules, setSchedules]   = useState<AgencyScheduleDTO[]>([]);
    const [selected, setSelected]     = useState<AgencyScheduleDTO | null>(null);
    const [stops, setStops]           = useState<ItineraryStopWithActivitiesDTO[]>([]);
    const [tracked, setTracked]       = useState<Set<string>>(new Set());
    const [loadingSched, setLoadingSched] = useState(true);
    const [loadingStops, setLoadingStops] = useState(false);
    const [checking, setChecking]     = useState<Set<string>>(new Set());

    // Load guide's schedules on mount
    useEffect(() => {
        agencyService.getMyGuideSchedules()
            .then(r => {
                const list = r.data ?? [];
                setSchedules(list);
                if (list.length === 1) selectSchedule(list[0]);
            })
            .catch(() => {})
            .finally(() => setLoadingSched(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectSchedule = useCallback(async (s: AgencyScheduleDTO) => {
        setSelected(s);
        setStops([]);
        setTracked(new Set());
        setLoadingStops(true);
        try {
            const [stopsRes, trackingRes] = await Promise.all([
                agencyService.getItineraryStops(s.itineraryId),
                trackingService.getByScheduleId(s.id),
            ]);
            setStops(stopsRes.data ?? []);
            const trackedSet = new Set(
                (trackingRes.data ?? [])
                    .filter((t: TrackingDTO) => t.type === TrackingTypeActivity)
                    .map((t: TrackingDTO) => t.trackingId)
            );
            setTracked(trackedSet);
        } catch {
            // silently fall through — UI shows empty state
        } finally {
            setLoadingStops(false);
        }
    }, []);

    const handleCheckIn = async (scheduleId: string, activity: StopActivityDTO) => {
        if (checking.has(activity.id)) return;
        setChecking(prev => new Set([...prev, activity.id]));
        setTracked(prev => new Set([...prev, activity.id]));
        try {
            await trackingService.track({
                itineraryScheduleId: scheduleId,
                trackingId: activity.id,
                type: TrackingTypeActivity,
            });
        } catch {
            // rollback on error
            setTracked(prev => { const s = new Set(prev); s.delete(activity.id); return s; });
        } finally {
            setChecking(prev => { const s = new Set(prev); s.delete(activity.id); return s; });
        }
    };

    const handleUncheck = async (scheduleId: string, activity: StopActivityDTO) => {
        if (checking.has(activity.id)) return;
        setChecking(prev => new Set([...prev, activity.id]));
        setTracked(prev => { const s = new Set(prev); s.delete(activity.id); return s; });
        try {
            await trackingService.untrack(scheduleId, activity.id, TrackingTypeActivity);
        } catch {
            setTracked(prev => new Set([...prev, activity.id]));
        } finally {
            setChecking(prev => { const s = new Set(prev); s.delete(activity.id); return s; });
        }
    };

    const totalActivities = stops.reduce((n, s) => n + s.activities.length, 0);
    const doneCount       = stops.reduce((n, s) => n + s.activities.filter(a => tracked.has(a.id)).length, 0);

    return (
        <div className={styles.page}>
            {/* ── Left panel: schedule list ── */}
            <aside className={styles.aside}>
                <div className={styles.asideHeader}>
                    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                    My Schedules
                </div>

                {loadingSched ? (
                    <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>
                ) : schedules.length === 0 ? (
                    <div className={styles.empty}>No assigned schedules</div>
                ) : (
                    <ul className={styles.scheduleList}>
                        {schedules.map(s => {
                            const { label, cls } = scheduleStatusLabel(s);
                            const isActive = selected?.id === s.id;
                            return (
                                <li
                                    key={s.id}
                                    className={`${styles.scheduleCard} ${isActive ? styles.scheduleCardActive : ""}`}
                                    onClick={() => selectSchedule(s)}
                                >
                                    <div className={styles.scheduleCardTop}>
                                        <span className={styles.scheduleName}>{s.itineraryName}</span>
                                        <span className={`${styles.badge} ${cls}`}>{label}</span>
                                    </div>
                                    <div className={styles.scheduleCardMeta}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                                            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                        </svg>
                                        {fmtDate(s.startTime)} – {fmtDate(s.endTime)}
                                    </div>
                                    <div className={styles.scheduleCardMeta}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                                        </svg>
                                        {s.spot - s.spotLeft} / {s.spot} guests
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </aside>

            {/* ── Right panel: itinerary + tracking ── */}
            <main className={styles.main}>
                {!selected ? (
                    <div className={styles.placeholder}>
                        <svg viewBox="0 0 24 24" fill="none" width="48" height="48" style={{ color: "#d1d5db" }}>
                            <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p>Select a schedule to start tracking</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className={styles.mainHeader}>
                            <div className={styles.mainHeaderLeft}>
                                <h2 className={styles.mainTitle}>{selected.itineraryName}</h2>
                                <span className={styles.mainDates}>
                                    {fmtDate(selected.startTime)} → {fmtDate(selected.endTime)}
                                </span>
                            </div>
                            <div className={styles.progressPill}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>{doneCount} / {totalActivities} activities done</span>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: totalActivities > 0 ? `${Math.round(doneCount / totalActivities * 100)}%` : "0%" }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stops + activities */}
                        {loadingStops ? (
                            <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>
                        ) : stops.length === 0 ? (
                            <div className={styles.empty}>No itinerary data available for this schedule.</div>
                        ) : (
                            <div className={styles.stopList}>
                                {stops.map((stop, si) => {
                                    const stopDone = stop.activities.every(a => tracked.has(a.id));
                                    const stopPartial = !stopDone && stop.activities.some(a => tracked.has(a.id));

                                    return (
                                        <div key={stop.id} className={styles.stopBlock}>
                                            {/* Stop header */}
                                            <div className={styles.stopHeader}>
                                                <div className={`${styles.stopDot} ${stopDone ? styles.stopDotDone : stopPartial ? styles.stopDotPartial : ""}`}>
                                                    {stopDone ? (
                                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    ) : (
                                                        <span>{si + 1}</span>
                                                    )}
                                                </div>
                                                <div className={styles.stopInfo}>
                                                    <span className={styles.stopName}>{stop.name}</span>
                                                    {stop.address && (
                                                        <span className={styles.stopAddress}>
                                                            <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor"/>
                                                            </svg>
                                                            {stop.address}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={styles.stopCount}>
                                                    {stop.activities.filter(a => tracked.has(a.id)).length}/{stop.activities.length} done
                                                </span>
                                            </div>

                                            {/* Activities */}
                                            <div className={styles.activityList}>
                                                {stop.activities.map(act => {
                                                    const isDone    = tracked.has(act.id);
                                                    const isChecking = checking.has(act.id);
                                                    const name      = act.customName ?? act.serviceName ?? "Activity";

                                                    return (
                                                        <div key={act.id} className={`${styles.activityRow} ${isDone ? styles.activityRowDone : ""}`}>
                                                            <div className={styles.activityLeft}>
                                                                <div className={`${styles.activityCheck} ${isDone ? styles.activityCheckDone : ""}`}>
                                                                    {isDone && (
                                                                        <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                                                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <div className={styles.activityInfo}>
                                                                    <span className={styles.activityName}>{name}</span>
                                                                    <span className={styles.activityTime}>
                                                                        {fmtTime(act.startTime)} – {fmtTime(act.endTime)}
                                                                    </span>
                                                                    {act.serviceDescription && (
                                                                        <span className={styles.activityDesc}>{act.serviceDescription}</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className={styles.activityRight}>
                                                                {isDone ? (
                                                                    <>
                                                                        <span className={styles.doneBadge}>
                                                                            <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                                                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                                            </svg>
                                                                            Done
                                                                        </span>
                                                                        <button
                                                                            className={styles.undoBtn}
                                                                            disabled={isChecking}
                                                                            onClick={() => handleUncheck(selected.id, act)}
                                                                        >
                                                                            Undo
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        className={`${styles.checkInBtn} ${isChecking ? styles.checkInBtnLoading : ""}`}
                                                                        disabled={isChecking}
                                                                        onClick={() => handleCheckIn(selected.id, act)}
                                                                    >
                                                                        {isChecking ? (
                                                                            <span className={styles.btnSpinner} />
                                                                        ) : (
                                                                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                                                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                                            </svg>
                                                                        )}
                                                                        Check In
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

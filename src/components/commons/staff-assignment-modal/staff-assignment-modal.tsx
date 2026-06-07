"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ProviderJobWithStopsDTO, ProviderStopDetailDTO } from "@/types/itinerary.type";
import type { ProviderStaffDTO } from "@/types/provider-staff.type";
import { providerService } from "@/libs/services/provider.service";
import styles from "./staff-assignment-modal.module.scss";

interface Props {
    job: ProviderJobWithStopsDTO;
    onClose: () => void;
    onAssigned?: (stopId: string, staff: ProviderStaffDTO) => void;
}

function fmt(dt: string) {
    return new Date(dt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StaffAssignmentModal({ job, onClose, onAssigned }: Props) {
    const [staffList, setStaffList]   = useState<ProviderStaffDTO[]>([]);
    const [stops, setStops]           = useState<ProviderStopDetailDTO[]>(job.stops);
    const [assigning, setAssigning]   = useState<string | null>(null); // stopId being saved
    const [selectVal, setSelectVal]   = useState<Record<string, string>>({}); // stopId → staffId

    useEffect(() => {
        providerService.getMyStaff()
            .then(res => { if (res?.data) setStaffList(res.data); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleAssign = useCallback(async (stopId: string) => {
        const staffId = selectVal[stopId];
        if (!staffId) return;
        setAssigning(stopId);
        try {
            await providerService.assignStaffToStop(stopId, job.scheduleId, staffId);
            const staff = staffList.find(s => s.userId === staffId)!;
            setStops(prev => prev.map(st =>
                st.stopId === stopId
                    ? { ...st, assignedStaffId: staffId, assignedStaffName: staff.userFullName, assignedStaffEmail: staff.email }
                    : st
            ));
            setSelectVal(prev => { const n = { ...prev }; delete n[stopId]; return n; });
            onAssigned?.(stopId, staff);
        } catch {
            // silently ignore
        } finally {
            setAssigning(null);
        }
    }, [selectVal, staffList, onAssigned]);

    const modal = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.icon}>
                            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                        </span>
                        <div>
                            <h3 className={styles.title}>{job.itineraryName}</h3>
                            <p className={styles.meta}>{job.agencyName} · {fmt(job.startTime)} → {fmt(job.endTime)}</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                {/* Stop list */}
                <div className={styles.body}>
                    <p className={styles.sectionLabel}>Stops & Assigned Staff</p>
                    {stops.length === 0 ? (
                        <p className={styles.empty}>No stops for this provider.</p>
                    ) : (
                        <div className={styles.stopList}>
                            {stops.map(stop => (
                                <div key={stop.stopId} className={`${styles.stopRow} ${!stop.assignedStaffId ? styles.stopRowWarn : ""}`}>
                                    {/* Order + info */}
                                    <div className={styles.stopOrder}>{stop.stopOrder}</div>
                                    <div className={styles.stopInfo}>
                                        <span className={styles.stopName}>{stop.name}</span>
                                        {stop.address && <span className={styles.stopAddr}>{stop.address}</span>}
                                    </div>

                                    {/* Staff section */}
                                    {stop.assignedStaffId ? (
                                        <div className={styles.staffInfo}>
                                            <div className={styles.avatar}>
                                                {(stop.assignedStaffName ?? "?")[0].toUpperCase()}
                                            </div>
                                            <div className={styles.staffDetail}>
                                                <span className={styles.staffName}>{stop.assignedStaffName}</span>
                                                <span className={styles.staffEmail}>{stop.assignedStaffEmail}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.assignRow}>
                                            <span className={styles.warnDot}>!</span>
                                            <select
                                                className={styles.staffSelect}
                                                value={selectVal[stop.stopId] ?? ""}
                                                onChange={e => setSelectVal(prev => ({ ...prev, [stop.stopId]: e.target.value }))}
                                            >
                                                <option value="">— Select staff —</option>
                                                {staffList.map(s => (
                                                    <option key={s.userId} value={s.userId}>{s.userFullName}</option>
                                                ))}
                                            </select>
                                            <button
                                                className={styles.assignBtn}
                                                disabled={!selectVal[stop.stopId] || assigning === stop.stopId}
                                                onClick={() => handleAssign(stop.stopId)}
                                            >
                                                {assigning === stop.stopId ? "…" : "Assign"}
                                            </button>
                                        </div>
                                    )}
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

"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./job-card.module.scss";

export type JobCardStatus = "confirmed" | "pending" | "ongoing" | "completed" | "cancelled";

export interface JobCardProps {
    time: string;
    title: string;
    status: JobCardStatus;
    hasUnassignedStop?: boolean;
    onClick?: () => void;
    onEdit?: () => void;
    onCancel?: () => void;
    onViewStaff?: () => void;
}

const STATUS_CFG: Record<JobCardStatus, { label: string; color: string; bg: string; border: string }> = {
    confirmed: { label: "CONFIRMED", color: "#065f46", bg: "#d1fae5", border: "#10b981" },
    pending:   { label: "PENDING",   color: "#92400e", bg: "#fef3c7", border: "#f59e0b" },
    ongoing:   { label: "ONGOING",   color: "#1d4ed8", bg: "#dbeafe", border: "#3b82f6" },
    completed: { label: "DONE",      color: "#1e40af", bg: "#dbeafe", border: "#3b82f6" },
    cancelled: { label: "CANCELLED", color: "#991b1b", bg: "#fee2e2", border: "#ef4444" },
};

export default function JobCard({ time, title, status, hasUnassignedStop, onClick, onEdit, onCancel, onViewStaff }: JobCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        function handler(e: MouseEvent) {
            const target = e.target as Node;
            if (btnRef.current && !btnRef.current.contains(target)) {
                const drop = document.getElementById("job-card-drop");
                if (!drop || !drop.contains(target)) setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    function openMenu(e: React.MouseEvent) {
        e.stopPropagation();
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setDropPos({
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
        });
        setMenuOpen(o => !o);
    }

    const dropdown = menuOpen && (
        <div
            id="job-card-drop"
            className={styles.dropdown}
            style={{ top: dropPos.top, right: dropPos.right }}
        >
            <button className={styles.dropItem} onClick={e => { e.stopPropagation(); setMenuOpen(false); onClick?.(); }}>
                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                View Details
            </button>
            {onViewStaff && (
                <button className={styles.dropItem} onClick={e => { e.stopPropagation(); setMenuOpen(false); onViewStaff(); }}>
                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    View Staff
                </button>
            )}
            <div className={styles.dropDivider}/>
            <button className={`${styles.dropItem} ${styles.dropItemDanger}`} onClick={e => { e.stopPropagation(); setMenuOpen(false); onCancel?.(); }}>
                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Cancel
            </button>
        </div>
    );

    return (
        <div
            className={styles.card}
            style={{ borderLeftColor: STATUS_CFG[status].border }}
            onClick={onClick}
        >
            <div className={styles.top}>
                <span className={styles.time}>
                    <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {time}
                </span>

                <div className={styles.rightActions}>
                    {hasUnassignedStop && (
                        <span className={styles.warnBadge} title="Some stops have no staff assigned">!</span>
                    )}
                <div className={styles.menuWrap}>
                    <button
                        ref={btnRef}
                        className={styles.menuBtn}
                        onClick={openMenu}
                        aria-label="Options"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                            <circle cx="12" cy="5"  r="1.5"/>
                            <circle cx="12" cy="12" r="1.5"/>
                            <circle cx="12" cy="19" r="1.5"/>
                        </svg>
                    </button>

                    {typeof document !== "undefined" && createPortal(dropdown, document.body)}
                </div>
                </div>
            </div>

            <p className={styles.title}>{title}</p>

            <span
                className={styles.badge}
                style={{ background: STATUS_CFG[status].bg, color: STATUS_CFG[status].color }}
            >
                {STATUS_CFG[status].label}
            </span>
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { providerService } from "@/libs/services/provider.service";
import type { ProviderTourGroupDTO, ProviderPassengerDTO } from "@/types/provider-staff.type";
import styles from "./page.module.scss";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function initials(name: string | null) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
}

type SentStatus = "none" | "partial" | "done";

function sentStatus(group: ProviderTourGroupDTO): SentStatus {
    if (group.totalPatients === 0 || group.sentCount === 0) return "none";
    if (group.sentCount >= group.totalPatients) return "done";
    return "partial";
}

const SENT_BADGE: Record<SentStatus, { label: string; cls: string }> = {
    none:    { label: "Not Sent", cls: styles.badgeNone    },
    partial: { label: "Partial",  cls: styles.badgePartial },
    done:    { label: "Done",     cls: styles.badgeDone    },
};

const ACCENT_COLORS = ["#f97316", "#8b5cf6", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6"];
function accentColor(idx: number) { return ACCENT_COLORS[idx % ACCENT_COLORS.length]; }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProviderGroupsPage() {
    const [groups, setGroups]                   = useState<ProviderTourGroupDTO[]>([]);
    const [selectedId, setSelectedId]           = useState<string | null>(null);
    const [patients, setPatients]               = useState<ProviderPassengerDTO[]>([]);
    const [loadingGroups, setLoadingGroups]     = useState(true);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [search, setSearch]                   = useState("");

    // ── Send-result modal state ───────────────────────────────────────────────
    const [sendTarget, setSendTarget]   = useState<ProviderPassengerDTO | null>(null);
    const [images, setImages]           = useState<File[]>([]);
    const [previews, setPreviews]       = useState<string[]>([]);
    const [notes, setNotes]             = useState("");
    const [sending, setSending]         = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        providerService.getTourGroups()
            .then(res => setGroups(res.data ?? []))
            .finally(() => setLoadingGroups(false));
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        setLoadingPatients(true);
        setPatients([]);
        providerService.getGroupPassengers(selectedId)
            .then(res => setPatients(res.data ?? []))
            .finally(() => setLoadingPatients(false));
    }, [selectedId]);

    const selectedGroup = useMemo(
        () => groups.find(g => g.scheduleId === selectedId) ?? null,
        [groups, selectedId]
    );
    const selectedIdx = useMemo(
        () => groups.findIndex(g => g.scheduleId === selectedId),
        [groups, selectedId]
    );

    const filteredPatients = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return patients;
        return patients.filter(p =>
            p.fullName.toLowerCase().includes(q) ||
            p.bookingCode.toLowerCase().includes(q) ||
            p.phone.includes(q) ||
            p.idNumber.includes(q)
        );
    }, [patients, search]);

    const sentCount   = patients.filter(p => p.resultSent).length;
    const unsentCount = patients.length - sentCount;
    const doneCount   = groups.filter(g => sentStatus(g) === "done").length;

    // ── Modal helpers ─────────────────────────────────────────────────────────
    function openModal(p: ProviderPassengerDTO) {
        setSendTarget(p);
        setImages([]);
        setPreviews([]);
        setNotes("");
        setSendSuccess(false);
    }

    function closeModal() {
        previews.forEach(u => URL.revokeObjectURL(u));
        setSendTarget(null);
        setImages([]);
        setPreviews([]);
        setNotes("");
        setSendSuccess(false);
    }

    function addFiles(files: FileList | null) {
        if (!files) return;
        const next = Array.from(files).filter(f => f.type.startsWith("image/") || f.type === "application/pdf");
        const urls = next.map(f => URL.createObjectURL(f));
        setImages(p => [...p, ...next]);
        setPreviews(p => [...p, ...urls]);
    }

    function removePreview(i: number) {
        URL.revokeObjectURL(previews[i]);
        setImages(p => p.filter((_, j) => j !== i));
        setPreviews(p => p.filter((_, j) => j !== i));
    }

    async function handleSend() {
        if (!sendTarget || !selectedId) return;
        setSending(true);
        try {
            const fd = new FormData();
            if (notes.trim()) fd.append("notes", notes.trim());
            images.forEach(f => fd.append("images", f));

            const res = await providerService.sendMedicalResult(selectedId, sendTarget.passengerId, fd);
            const updated = res.data;
            if (updated) {
                const sentAt = updated.sentAt ?? null;
                setPatients(prev => prev.map(p =>
                    p.passengerId === sendTarget.passengerId ? { ...p, resultSent: true, sentAt } : p
                ));
                // update sentCount on the group
                setGroups(prev => prev.map(g =>
                    g.scheduleId === selectedId
                        ? { ...g, sentCount: g.sentCount + (sendTarget.resultSent ? 0 : 1) }
                        : g
                ));
            }
            setSendSuccess(true);
        } finally {
            setSending(false);
        }
    }

    function goNextPatient() {
        const remaining = patients.filter(p => !p.resultSent && p.passengerId !== sendTarget?.passengerId);
        if (remaining.length > 0) openModal(remaining[0]);
        else closeModal();
    }

    const targetIdx = sendTarget
        ? (patients.findIndex(p => p.passengerId === sendTarget.passengerId) ?? 0)
        : 0;

    return (
        <div className={styles.page}>
            {/* ── Left panel ── */}
            <div className={styles.leftPanel}>
                <div className={styles.panelHeader}>
                    <p className={styles.panelTitle}>Tour Groups</p>
                    <p className={styles.panelSub}>
                        {loadingGroups ? "Loading…" : `${doneCount} group${doneCount !== 1 ? "s" : ""} done`}
                    </p>
                </div>

                <div className={styles.groupList}>
                    {groups.map((g, idx) => {
                        const ss    = sentStatus(g);
                        const cfg   = SENT_BADGE[ss];
                        const color = accentColor(idx);
                        return (
                            <div
                                key={g.scheduleId}
                                className={`${styles.groupCard} ${g.scheduleId === selectedId ? styles.groupCardActive : ""}`}
                                onClick={() => setSelectedId(g.scheduleId)}
                            >
                                <div className={styles.groupCardTop}>
                                    <div className={styles.groupAgencyRow}>
                                        <span className={styles.groupDot} style={{ background: color }} />
                                        <span className={styles.groupAgency}>{g.agencyName}</span>
                                    </div>
                                    <span className={`${styles.sentBadgeSmall} ${cfg.cls}`}>{cfg.label}</span>
                                </div>
                                <p className={styles.groupName}>{g.tourName}</p>
                                <div className={styles.groupMeta}>
                                    <span className={styles.groupDate}>
                                        <svg viewBox="0 0 24 24" fill="none" className={styles.metaIcon}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                                            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                        </svg>
                                        {fmtDate(g.startTime)}
                                    </span>
                                    <span className={styles.groupPatients}>
                                        <svg viewBox="0 0 24 24" fill="none" className={styles.metaIcon}>
                                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                                        </svg>
                                        {g.totalPatients} pt
                                    </span>
                                </div>
                                <div className={styles.groupProgress}>
                                    <div className={styles.progressBar}>
                                        <span style={{
                                            width: g.totalPatients > 0
                                                ? `${Math.round((g.sentCount / g.totalPatients) * 100)}%`
                                                : "0%",
                                            background: color,
                                        }} />
                                    </div>
                                    <span className={styles.progressLabel}>{g.sentCount}/{g.totalPatients}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Right panel ── */}
            <div className={styles.rightPanel}>
                {!selectedGroup ? (
                    <div className={styles.emptyState}>
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <p>Select a group to view the patient list</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className={styles.detailHeader} style={{ borderLeft: `4px solid ${accentColor(selectedIdx)}` }}>
                            <div className={styles.detailTitleRow}>
                                <div>
                                    <p className={styles.detailTitle}>{selectedGroup.tourName}</p>
                                    <p className={styles.detailMeta}>
                                        {selectedGroup.agencyName}
                                        {" · "}{fmtDate(selectedGroup.startTime)}
                                        {selectedGroup.tourDescription && ` · ${selectedGroup.tourDescription}`}
                                    </p>
                                </div>
                                <div className={styles.statsRow}>
                                    <div className={`${styles.statBox} ${styles.statSent}`}>
                                        <div className={styles.statValue}>{sentCount}</div>
                                        <div className={styles.statLabel}>Sent</div>
                                    </div>
                                    <div className={`${styles.statBox} ${styles.statUnsent}`}>
                                        <div className={styles.statValue}>{unsentCount}</div>
                                        <div className={styles.statLabel}>Pending</div>
                                    </div>
                                    <div className={`${styles.statBox} ${styles.statTotal}`}>
                                        <div className={styles.statValue}>{patients.length}</div>
                                        <div className={styles.statLabel}>Total</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <div className={styles.detailToolbar}>
                            <div className={styles.searchBox}>
                                <svg viewBox="0 0 24 24" fill="none">
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.7"/>
                                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                </svg>
                                <input
                                    placeholder="Search name or booking code…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Patient list */}
                        <div className={styles.patientList}>
                            {loadingPatients ? (
                                <div className={styles.loadingState}>Loading patients…</div>
                            ) : filteredPatients.length === 0 ? (
                                <div className={styles.loadingState}>No patients found</div>
                            ) : (
                                filteredPatients.map((p, pi) => (
                                    <div
                                        key={p.passengerId}
                                        className={`${styles.patientCard} ${p.resultSent ? styles.patientCardSent : ""}`}
                                    >
                                        <div
                                            className={styles.patientAvatar}
                                            style={{ background: accentColor(pi) }}
                                        >
                                            {initials(p.fullName)}
                                        </div>

                                        <div className={styles.patientInfo}>
                                            <div className={styles.patientNameRow}>
                                                <span className={styles.patientName}>{p.fullName}</span>
                                                {p.resultSent && (
                                                    <span className={styles.sentBadgeLg}>✓ Sent</span>
                                                )}
                                            </div>
                                            <p className={styles.patientSubMeta}>
                                                {p.age} yrs · ID: {p.idNumber}
                                            </p>
                                            <span className={styles.bookingChip}>{p.bookingCode}</span>
                                            {p.resultSent && p.sentAt && (
                                                <p className={styles.sentTime}>
                                                    <svg viewBox="0 0 24 24" fill="none" className={styles.metaIcon}>
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
                                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                                    </svg>
                                                    Sent at {fmtDate(p.sentAt)}
                                                </p>
                                            )}
                                            <p className={styles.patientPhone}>
                                                <svg viewBox="0 0 24 24" fill="none" className={styles.metaIcon}>
                                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.13 1 .37 1.97.72 2.9a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                                                </svg>
                                                {p.phone}
                                            </p>
                                        </div>

                                        <div className={styles.patientActions}>
                                            <button
                                                className={`${styles.actionBtn} ${p.resultSent ? styles.actionBtnResend : styles.actionBtnSend}`}
                                                onClick={() => openModal(p)}
                                            >
                                                {p.resultSent ? "Resend / Edit" : "Send Result"}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ── Send result modal ── */}
            {sendTarget && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        {!sendSuccess ? (
                            <>
                                <div className={styles.modalHeader}>
                                    <div className={styles.modalPatient}>
                                        <div className={styles.modalAvatar} style={{ background: accentColor(targetIdx) }}>
                                            {initials(sendTarget.fullName)}
                                        </div>
                                        <div>
                                            <p className={styles.modalName}>{sendTarget.fullName}</p>
                                            <p className={styles.modalMeta}>
                                                {sendTarget.age} yrs · ID: {sendTarget.idNumber} · {sendTarget.bookingCode}
                                            </p>
                                        </div>
                                    </div>
                                    <button className={styles.modalClose} onClick={closeModal}>
                                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </div>

                                <div className={styles.modalBody}>
                                    {/* Image upload */}
                                    <div className={styles.modalSection}>
                                        <p className={styles.sectionLabel}>
                                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                                                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.7"/>
                                                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Medical Record Images
                                            {images.length > 0 && <span className={styles.fileCount}>{images.length} file</span>}
                                        </p>
                                        <div
                                            className={`${styles.dropZone} ${previews.length > 0 ? styles.dropZoneFilled : ""}`}
                                            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                                            onDragOver={e => e.preventDefault()}
                                            onClick={() => previews.length === 0 && fileRef.current?.click()}
                                        >
                                            {previews.length === 0 ? (
                                                <>
                                                    <div className={styles.dropIconWrap}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
                                                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                                            <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                                                            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                                        </svg>
                                                    </div>
                                                    <p className={styles.dropTitle}>Drag & drop images / PDF here</p>
                                                    <p className={styles.dropSub}>or <button className={styles.dropBrowse} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>browse from computer</button></p>
                                                    <p className={styles.dropHint}>PNG, JPG, PDF · Max 10 MB/file · Multiple files</p>
                                                </>
                                            ) : (
                                                <div className={styles.previewGrid} onClick={e => e.stopPropagation()}>
                                                    {previews.map((src, i) => (
                                                        <div key={i} className={styles.previewThumb}>
                                                            <img src={src} alt="" className={styles.previewImg} />
                                                            <button className={styles.previewRemove} onClick={() => removePreview(i)}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="9" height="9">
                                                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button className={styles.previewAdd} onClick={() => fileRef.current?.click()}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                                                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                        </svg>
                                                        <span>Add</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/*,.pdf"
                                            multiple
                                            style={{ display: "none" }}
                                            onChange={e => addFiles(e.target.files)}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div className={styles.modalSection}>
                                        <p className={styles.sectionLabel}>
                                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                                            </svg>
                                            Notes & Diagnosis
                                        </p>
                                        <textarea
                                            className={styles.notesArea}
                                            placeholder="Enter diagnosis, test results, treatment recommendations or important notes…"
                                            rows={5}
                                            value={notes}
                                            onChange={e => setNotes(e.target.value.slice(0, 1000))}
                                        />
                                        <div className={styles.notesFooter}>
                                            <span className={styles.charCount}>{notes.length}/1000</span>
                                        </div>
                                    </div>

                                    {images.length === 0 && !notes.trim() && (
                                        <div className={styles.emptyWarn}>
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                                <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            </svg>
                                            Please attach at least 1 image or enter notes before sending.
                                        </div>
                                    )}
                                </div>

                                <div className={styles.modalFooter}>
                                    <button className={styles.cancelBtn} onClick={closeModal} disabled={sending}>Cancel</button>
                                    <button
                                        className={styles.sendResultBtn}
                                        disabled={sending || (images.length === 0 && !notes.trim())}
                                        onClick={handleSend}
                                    >
                                        {sending ? (
                                            <><span className={styles.spinner}/> Sending…</>
                                        ) : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                Send result to patient
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={styles.successPanel}>
                                <div className={styles.successIconWrap}>
                                    <div className={styles.successRing}/>
                                    <div className={styles.successIcon}>
                                        <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <h3 className={styles.successTitle}>Sent successfully!</h3>
                                <p className={styles.successSub}>
                                    The result for <strong>{sendTarget.fullName}</strong> has been sent.<br/>
                                    The patient will receive a notification in the app.
                                </p>
                                {(() => {
                                    const remaining = patients.filter(p => !p.resultSent && p.passengerId !== sendTarget.passengerId);
                                    return (
                                        <div className={styles.successActions}>
                                            <button className={styles.doneBtn} onClick={closeModal}>Close</button>
                                            {remaining.length > 0 && (
                                                <button className={styles.nextBtn} onClick={goNextPatient}>
                                                    Next patient ({remaining.length} remaining) →
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { providerService } from "@/libs/services/provider.service";
import { useSubRole } from "@/hooks/useSubRole";
import { authService } from "@/libs/services/auth.service";
import type { ProviderTourGroupDTO, ProviderPassengerDTO } from "@/types/provider-staff.type";
import styles from "./page.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
type GroupStatus = "complete" | "partial" | "pending";

interface Patient {
    id: string;
    name: string;
    idNumber: string;
    age: number;
    bookingId: string;
    bookingCode: string;
    phone: string;
    resultSent: boolean;
    sentAt: string | null;
}

interface TourGroup {
    id: string;
    tourName: string;
    date: string;
    agency: string;
    agencyColor: string;
    service: string | null;
    patients: Patient[];
    loadedPatients: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ACCENT_COLORS = ["#f59e0b", "#8b5cf6", "#22c55e", "#ef4444", "#3b82f6", "#f97316", "#14b8a6"];
function accentColor(idx: number) { return ACCENT_COLORS[idx % ACCENT_COLORS.length]; }

function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mapGroup(g: ProviderTourGroupDTO, idx: number): TourGroup {
    return {
        id:             g.scheduleId,
        tourName:       g.tourName,
        date:           fmtDate(g.startTime),
        agency:         g.agencyName,
        agencyColor:    accentColor(idx),
        service:        g.tourDescription ?? null,
        patients:       [],
        loadedPatients: false,
    };
}

function mapPassenger(p: ProviderPassengerDTO): Patient {
    return {
        id:          p.passengerId,
        name:        p.fullName,
        idNumber:    p.idNumber,
        age:         p.age,
        bookingId:   p.bookingId,
        bookingCode: p.bookingCode,
        phone:       p.phone,
        resultSent:  p.resultSent,
        sentAt:      p.sentAt ? fmtDate(p.sentAt) : null,
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
    return name.trim().split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316"];
function avatarColor(i: number) { return AVATAR_COLORS[i % AVATAR_COLORS.length]; }

function groupStatus(g: TourGroup): GroupStatus {
    if (g.patients.length === 0) return "pending";
    const sent = g.patients.filter(p => p.resultSent).length;
    if (sent === g.patients.length) return "complete";
    if (sent === 0) return "pending";
    return "partial";
}

const STATUS_LABEL: Record<GroupStatus, string> = {
    complete: "Done",
    partial:  "Partial",
    pending:  "Not Sent",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
    const { can } = useSubRole("provider");
    const canSend = can("provider.results.send"); // staff only
    const [myUserId, setMyUserId]           = useState<string | null>(null);

    const [groups, setGroups]               = useState<TourGroup[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingPats, setLoadingPats]     = useState(true);
    const [selectedId, setSelectedId]       = useState<string | null>(null);
    const [sendTarget, setSendTarget]       = useState<Patient | null>(null);
    const [images, setImages]               = useState<File[]>([]);
    const [previews, setPreviews]           = useState<string[]>([]);
    const [notes, setNotes]                 = useState("");
    const [sending, setSending]             = useState(false);
    const [sendSuccess, setSendSuccess]     = useState(false);
    const [search, setSearch]               = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    // Fetch userId + groups on mount
    useEffect(() => {
        Promise.all([
            authService.getMe(),
            providerService.getTourGroups(),
            canSend ? providerService.getJobsWithStops() : Promise.resolve(null),
        ]).then(([meRes, groupRes, stopsRes]) => {
            const uid = meRes.data?.id ?? null;
            setMyUserId(uid);
            let mapped = (groupRes.data ?? []).map(mapGroup);
            // Staff: filter to schedules where they are assigned to at least one stop
            if (canSend && uid && stopsRes?.data) {
                const assignedScheduleIds = new Set(
                    stopsRes.data
                        .filter(j => j.stops.some(s => s.assignedStaffId === uid))
                        .map(j => j.scheduleId)
                );
                mapped = mapped.filter(g => assignedScheduleIds.has(g.id));
            }
            setGroups(mapped);
            if (mapped.length > 0) setSelectedId(mapped[0].id);
        }).finally(() => setLoadingGroups(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canSend]);

    // Fetch patients when selected group changes (only once per group)
    useEffect(() => {
        if (!selectedId) return;
        const grp = groups.find(g => g.id === selectedId);
        if (!grp || grp.loadedPatients) return;
        setLoadingPats(true);
        providerService.getGroupPassengers(selectedId)
            .then(res => {
                const patients = (res.data ?? []).map(mapPassenger);
                setGroups(prev => prev.map(g =>
                    g.id === selectedId ? { ...g, patients, loadedPatients: true } : g
                ));
            })
            .finally(() => setLoadingPats(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    const currentGroup = groups.find(g => g.id === selectedId) ?? null;
    const filtered     = (currentGroup?.patients ?? []).filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
        p.idNumber.includes(search) ||
        p.phone.includes(search)
    );
    const sentCount  = currentGroup?.patients.filter(p => p.resultSent).length ?? 0;
    const totalCount = currentGroup?.patients.length ?? 0;

    function openModal(p: Patient) {
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

            const res = await providerService.sendMedicalResult(selectedId, sendTarget.id, fd);
            const updated = res.data;
            if (updated) {
                const sentAt = updated.sentAt ? fmtDate(updated.sentAt) : new Date().toLocaleDateString("vi-VN");
                setGroups(prev => prev.map(g => ({
                    ...g,
                    patients: g.patients.map(p =>
                        p.id === sendTarget.id ? { ...p, resultSent: true, sentAt } : p
                    ),
                })));
            }
            setSendSuccess(true);
        } finally {
            setSending(false);
        }
    }

    function goNextPatient() {
        const remaining = (currentGroup?.patients ?? []).filter(p => !p.resultSent && p.id !== sendTarget?.id);
        if (remaining.length > 0) openModal(remaining[0]);
        else closeModal();
    }

    const targetIdx = sendTarget ? (currentGroup?.patients.findIndex(p => p.id === sendTarget.id) ?? 0) : 0;

    return (
        <div className={styles.page}>

            {/* ── Left sidebar: group list ── */}
            <aside className={styles.groupSidebar}>
                <div className={styles.sidebarHead}>
                    <div className={styles.sidebarHeadIcon}>
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                            <path d="M14 2v6h6M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <div>
                        <h2 className={styles.sidebarTitle}>Tour Groups</h2>
                        <p className={styles.sidebarSub}>
                            {loadingGroups ? "Loading…" : `${groups.length} group${groups.length !== 1 ? "s" : ""}`}
                        </p>
                    </div>
                </div>

                <div className={styles.groupList}>
                    {groups.map(g => {
                        const st   = groupStatus(g);
                        const sent = g.patients.filter(p => p.resultSent).length;
                        const total = g.patients.length;
                        const pct  = total > 0 ? Math.round((sent / total) * 100) : 0;
                        return (
                            <button
                                key={g.id}
                                className={`${styles.groupCard} ${selectedId === g.id ? styles.groupCardActive : ""}`}
                                onClick={() => { setSelectedId(g.id); setSearch(""); if (!g.loadedPatients) setLoadingPats(true); }}
                            >
                                <div className={styles.groupCardRow}>
                                    <span className={styles.groupAgencyDot} style={{ background: g.agencyColor }}/>
                                    <span className={styles.groupAgency}>{g.agency}</span>
                                    <span className={`${styles.groupStatusBadge}
                                        ${st === "complete" ? styles.statusComplete :
                                          st === "partial"  ? styles.statusPartial  :
                                                             styles.statusPending}`}
                                    >
                                        {STATUS_LABEL[st]}
                                    </span>
                                </div>
                                <p className={styles.groupName}>{g.tourName}</p>
                                <div className={styles.groupMeta}>
                                    <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                    {g.date}
                                    <span className={styles.metaDot}>·</span>
                                    <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                    </svg>
                                    {total > 0 ? `${total} pt` : "— pt"}
                                </div>
                                <div className={styles.groupProgress}>
                                    <div className={styles.progressTrack}>
                                        <div className={styles.progressFill} style={{ width: `${pct}%`,
                                            background: st === "complete" ? "#22c55e" : st === "partial" ? "#f59e0b" : "#e5e7eb"
                                        }}/>
                                    </div>
                                    <span className={styles.progressLabel}>{sent}/{total}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── Main: patient list ── */}
            <main className={styles.main}>

                {/* Group header */}
                <div className={styles.groupHeader}>
                    <div className={styles.groupHeaderLeft}>
                        <div className={styles.groupHeaderAccent} style={{ background: currentGroup?.agencyColor ?? "#3b82f6" }}/>
                        <div>
                            <h1 className={styles.groupHeaderTitle}>{currentGroup?.tourName ?? "—"}</h1>
                            <p className={styles.groupHeaderMeta}>
                                {currentGroup?.agency}{currentGroup?.date ? ` · ${currentGroup.date}` : ""}{currentGroup?.service ? ` · ${currentGroup.service}` : ""}
                            </p>
                        </div>
                    </div>
                    <div className={styles.headerStats}>
                        <div className={styles.headerStat}>
                            <span className={styles.headerStatNum} style={{ color: "#15803d" }}>{sentCount}</span>
                            <span className={styles.headerStatLabel}>Sent</span>
                        </div>
                        <div className={styles.headerStatDiv}/>
                        <div className={styles.headerStat}>
                            <span className={styles.headerStatNum} style={{ color: "#d97706" }}>{totalCount - sentCount}</span>
                            <span className={styles.headerStatLabel}>Pending</span>
                        </div>
                        <div className={styles.headerStatDiv}/>
                        <div className={styles.headerStat}>
                            <span className={styles.headerStatNum}>{totalCount}</span>
                            <span className={styles.headerStatLabel}>Total</span>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className={styles.searchWrap}>
                    <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search name or booking code…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className={styles.searchClear} onClick={() => setSearch("")}>
                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    )}
                </div>

                {/* Patient grid */}
                <div className={styles.patientGrid}>
                    {loadingPats && (
                        <div className={styles.emptyState} style={{ gridColumn: "1/-1" }}>
                            <p>Loading patients…</p>
                        </div>
                    )}
                    {!loadingPats && filtered.map((p, idx) => (
                        <div key={p.id} className={`${styles.patientCard} ${p.resultSent ? styles.patientCardDone : ""}`}>
                            <div className={styles.cardTop}>
                                <div className={styles.patientAvatar} style={{ background: avatarColor(idx) }}>
                                    {initials(p.name)}
                                </div>
                                <div className={styles.patientInfo}>
                                    <div className={styles.patientName}>{p.name}</div>
                                    <div className={styles.patientSubMeta}>{p.age} yrs · ID: {p.idNumber}</div>
                                    <div className={styles.bookingId}>{p.bookingCode}</div>
                                </div>
                                {p.resultSent
                                    ? <span className={styles.sentBadge}>
                                        <svg viewBox="0 0 24 24" fill="none" width="9" height="9">
                                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                        </svg>
                                        Sent
                                      </span>
                                    : <span className={styles.pendingBadge}>Not Sent</span>
                                }
                            </div>

                            {p.resultSent && p.sentAt && (
                                <div className={styles.sentInfo}>
                                    <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                    Sent at {p.sentAt}
                                </div>
                            )}

                            <div className={styles.patientPhone}>
                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.14 12a19.79 19.79 0 01-3.07-8.67A2 2 0 012.06 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.7"/>
                                </svg>
                                {p.phone ?? "—"}
                            </div>

                            {canSend && <button
                                className={p.resultSent ? styles.resendBtn : styles.sendBtn}
                                onClick={() => openModal(p)}
                            >
                                {p.resultSent ? (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Resend / Edit
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Send Result
                                    </>
                                )}
                            </button>}
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className={styles.emptyState}>
                            <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                                <circle cx="11" cy="11" r="8" stroke="#d1d5db" strokeWidth="1.5"/>
                                <path d="M21 21l-4.35-4.35" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <p>No matching patients found</p>
                        </div>
                    )}
                </div>
            </main>

            {/* ── Modal ── */}
            {sendTarget && (
                <div className={styles.overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>

                        {!sendSuccess ? (
                            <>
                                {/* Header */}
                                <div className={styles.modalHeader}>
                                    <div className={styles.modalPatient}>
                                        <div className={styles.modalAvatar} style={{ background: avatarColor(targetIdx) }}>
                                            {initials(sendTarget.name)}
                                        </div>
                                        <div>
                                            <p className={styles.modalName}>{sendTarget.name}</p>
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
                                            placeholder="Enter diagnosis, test results, treatment recommendations or important notes for the patient…"
                                            rows={5}
                                            value={notes}
                                            onChange={e => setNotes(e.target.value.slice(0, 1000))}
                                        />
                                        <div className={styles.notesFooter}>
                                            <span className={styles.charCount}>{notes.length}/1000</span>
                                        </div>
                                    </div>

                                    {/* Warning if empty */}
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

                                {/* Footer */}
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
                            /* Success panel */
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
                                    The result for <strong>{sendTarget.name}</strong> has been sent.<br/>
                                    The patient will receive a notification in the app.
                                </p>
                                {(() => {
                                    const remaining = (currentGroup?.patients ?? []).filter(p => !p.resultSent && p.id !== sendTarget.id);
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

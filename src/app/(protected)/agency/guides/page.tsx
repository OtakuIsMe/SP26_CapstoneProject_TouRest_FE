"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import { agencyService, AgencyUserDTO } from "@/libs/services/agency.service";
import { authService } from "@/libs/services/auth.service";

const AVATAR_COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#14b8a6"];

function avatarColor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(-2).map(w => w[0].toUpperCase()).join("");
}

export default function AgencyGuidesPage() {
    const [guides, setGuides]       = useState<AgencyUserDTO[]>([]);
    const [agencyId, setAgencyId]   = useState("");
    const [isManager, setIsManager] = useState<boolean | null>(null);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState("");

    // Create modal state
    const [createOpen, setCreateOpen]     = useState(false);
    const [cEmail, setCEmail]             = useState("");
    const [cFullName, setCFullName]       = useState("");
    const [cPassword, setCPassword]       = useState("");
    const [cPhone, setCPhone]             = useState("");
    const [cError, setCError]             = useState("");
    const [cSubmitting, setCSubmitting]   = useState(false);

    // Delete confirm state
    const [deleteTarget, setDeleteTarget] = useState<AgencyUserDTO | null>(null);
    const [deleting, setDeleting]         = useState(false);

    useEffect(() => {
        Promise.all([authService.getMe(), agencyService.getMe()])
            .then(([meRes, agencyRes]) => {
                const subRole = meRes.data?.subRole?.toLowerCase();
                setIsManager(subRole === "manager");
                const aid = agencyRes.data?.id ?? "";
                setAgencyId(aid);
                if (aid) return agencyService.getTourGuides(aid);
                return null;
            })
            .then(res => { if (res?.data) setGuides(res.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = guides.filter(g => {
        const q = search.toLowerCase();
        return !q || (g.userFullName + g.email).toLowerCase().includes(q);
    });

    async function handleCreate() {
        if (!cEmail || !cFullName || !cPassword) { setCError("Please fill in all required fields"); return; }
        if (cPhone && !/^0[35789]\d{8}$/.test(cPhone)) { setCError("Invalid phone number (e.g. 0912345678)"); return; }
        setCError("");
        setCSubmitting(true);
        try {
            await agencyService.createGuideAccount(agencyId, {
                email: cEmail, fullName: cFullName, password: cPassword, phone: cPhone || undefined,
            });
            const refreshed = await agencyService.getTourGuides(agencyId);
            if (refreshed.data) setGuides(refreshed.data);
            setSearch("");
            setCreateOpen(false);
            setCEmail(""); setCFullName(""); setCPassword(""); setCPhone("");
        } catch {
            setCError("Failed to create account. Email may already be in use.");
        } finally {
            setCSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await agencyService.removeAgencyUser(agencyId, deleteTarget.userId);
            setGuides(prev => prev.filter(g => g.userId !== deleteTarget.userId));
            setDeleteTarget(null);
        } catch { /* silently ignore */ }
        finally { setDeleting(false); }
    }

    if (loading) {
        return <div className={styles.page}><div className={styles.loadingState}>Loading...</div></div>;
    }

    if (isManager === false) {
        return (
            <div className={styles.page}>
                <div className={styles.accessDenied}>
                    <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                        <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5"/>
                        <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p>Only managers can access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Tour Guides</h1>
                    <p className={styles.subtitle}>{guides.length} guide{guides.length !== 1 ? "s" : ""} in this agency</p>
                </div>
                <button className={styles.createBtn} onClick={() => setCreateOpen(true)}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/>
                    </svg>
                    Create Account
                </button>
            </div>

            {/* ── Search ── */}
            <div className={styles.searchWrap}>
                <svg viewBox="0 0 24 24" fill="none" className={styles.searchIcon}>
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                    className={styles.searchInput}
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* ── Guide list ── */}
            {filtered.length === 0 ? (
                <div className={styles.emptyState}>
                    <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="12" cy="7" r="4" stroke="#d1d5db" strokeWidth="1.5"/>
                    </svg>
                    <p>{search ? "No guides found" : "No guides yet"}</p>
                </div>
            ) : (
                <div className={styles.guideGrid}>
                    {filtered.map(guide => (
                        <div key={guide.userId} className={styles.guideCard}>
                            <div className={styles.guideAvatar} style={{ background: avatarColor(guide.userId) }}>
                                {initials(guide.userFullName || guide.email)}
                            </div>
                            <div className={styles.guideInfo}>
                                <span className={styles.guideName}>{guide.userFullName || "—"}</span>
                                <span className={styles.guideEmail}>{guide.email}</span>
                                {guide.agencyName && (
                                    <span className={styles.guideBadge}>Tour Guide</span>
                                )}
                            </div>
                            <button className={styles.deleteBtn} onClick={() => setDeleteTarget(guide)} title="Remove from agency">
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ════════════ CREATE MODAL ════════════ */}
            {createOpen && (
                <div className={styles.overlay} onClick={() => setCreateOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Create Tour Guide Account</h2>
                            <button className={styles.modalClose} onClick={() => setCreateOpen(false)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.field}>
                                <label className={styles.label}>Email <span className={styles.required}>*</span></label>
                                <input className={styles.input} type="email" placeholder="guide@example.com" value={cEmail} onChange={e => setCEmail(e.target.value)} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Full Name <span className={styles.required}>*</span></label>
                                <input className={styles.input} type="text" placeholder="Nguyen Van A" value={cFullName} onChange={e => setCFullName(e.target.value)} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Password <span className={styles.required}>*</span></label>
                                <input className={styles.input} type="password" placeholder="At least 6 characters" value={cPassword} onChange={e => setCPassword(e.target.value)} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Phone</label>
                                <input className={styles.input} type="tel" placeholder="0901234567" value={cPhone} onChange={e => setCPhone(e.target.value)} />
                            </div>
                            {cError && <p className={styles.errorMsg}>{cError}</p>}
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setCreateOpen(false)}>Cancel</button>
                            <button className={styles.confirmBtn} onClick={handleCreate} disabled={cSubmitting}>
                                {cSubmitting ? "Creating…" : "Create Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════ DELETE CONFIRM ════════════ */}
            {deleteTarget && (
                <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Remove from agency</h2>
                            <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.confirmText}>
                                Are you sure you want to remove <strong>{deleteTarget.userFullName || deleteTarget.email}</strong> from this agency?
                            </p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className={styles.deleteConfirmBtn} onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Removing…" : "Remove"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

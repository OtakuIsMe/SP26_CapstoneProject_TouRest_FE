"use client";

import { useEffect, useState } from "react";
import { payoutService, PayoutDTO, PayoutStatus } from "@/libs/services/payout.service";
import styles from "./page.module.scss";

const STATUS_CFG: Record<PayoutStatus, { label: string; bg: string; color: string }> = {
    Pending:   { label: "Pending",   bg: "#fef3c7", color: "#92400e" },
    Approved:  { label: "Approved",  bg: "#dbeafe", color: "#1d4ed8" },
    Rejected:  { label: "Rejected",  bg: "#fee2e2", color: "#b91c1c" },
    Completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" },
};

function maskAccount(num: string) {
    return num.length > 4 ? "**** " + num.slice(-4) : num;
}

export default function AdminPayoutsPage() {
    const [payouts, setPayouts]     = useState<PayoutDTO[]>([]);
    const [loading, setLoading]     = useState(true);
    const [filter, setFilter]       = useState<PayoutStatus | "All">("All");
    const [rejectId, setRejectId]   = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [actionId, setActionId]   = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        payoutService.getAll()
            .then(res => { if (res?.data) setPayouts(res.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const filtered = filter === "All" ? payouts : payouts.filter(p => p.status === filter);

    async function handleApprove(id: string) {
        setActionId(id);
        try {
            await payoutService.approve(id);
            setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: "Approved" } : p));
        } catch { /* handled by global error interceptor */ }
        finally { setActionId(null); }
    }

    async function handleReject() {
        if (!rejectId) return;
        setActionId(rejectId);
        try {
            await payoutService.reject(rejectId, { adminNote });
            setPayouts(prev => prev.map(p => p.id === rejectId ? { ...p, status: "Rejected", adminNote } : p));
            setRejectId(null);
            setAdminNote("");
        } catch { }
        finally { setActionId(null); }
    }

    const pendingCount = payouts.filter(p => p.status === "Pending").length;

    return (
        <div className={styles.page}>
            {/* ── Header ── */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Payout Requests</h1>
                    <p className={styles.pageSub}>Review and approve withdrawal requests from agencies and providers</p>
                </div>
                <div className={styles.headerStats}>
                    <div className={styles.statChip}>
                        <span className={styles.statChipNum}>{pendingCount}</span>
                        <span className={styles.statChipLabel}>Pending</span>
                    </div>
                    <div className={styles.statChip}>
                        <span className={styles.statChipNum}>{payouts.length}</span>
                        <span className={styles.statChipLabel}>Total</span>
                    </div>
                </div>
            </div>

            {/* ── Filter tabs ── */}
            <div className={styles.filterRow}>
                {(["All", "Pending", "Approved", "Rejected", "Completed"] as const).map(f => (
                    <button
                        key={f}
                        className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ""}`}
                        onClick={() => setFilter(f)}
                    >
                        {f}
                        {f === "Pending" && pendingCount > 0 && (
                            <span className={styles.filterBadge}>{pendingCount}</span>
                        )}
                    </button>
                ))}
                <button className={styles.refreshBtn} onClick={load} title="Refresh">
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Refresh
                </button>
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <p>Loading payout requests…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyWrap}>
                    <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="#d1d5db" strokeWidth="1.5"/>
                        <path d="M2 10h20" stroke="#d1d5db" strokeWidth="1.5"/>
                    </svg>
                    <p>No payout requests found</p>
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Requested by</th>
                                <th>Amount</th>
                                <th>Bank</th>
                                <th>Account</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const cfg   = STATUS_CFG[p.status];
                                const busy  = actionId === p.id;
                                return (
                                    <tr key={p.id} className={styles.row}>
                                        <td>
                                            <div className={styles.requesterCell}>
                                                <span className={styles.requesterName}>{p.requestedByName ?? "—"}</span>
                                                {p.requestedByEmail && (
                                                    <span className={styles.requesterEmail}>{p.requestedByEmail}</span>
                                                )}
                                                {p.ownerType && (
                                                    <span className={styles.ownerTypeBadge}>{p.ownerType}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={styles.amountCell}>
                                            {p.amount.toLocaleString("vi-VN")}đ
                                        </td>
                                        <td>{p.bankName}</td>
                                        <td>
                                            <div className={styles.bankCell}>
                                                <span className={styles.bankAccount}>{maskAccount(p.bankAccount)}</span>
                                                <span className={styles.bankHolder}>{p.accountHolder}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color }}>
                                                {cfg.label}
                                            </span>
                                            {p.adminNote && (
                                                <p className={styles.adminNotePreview}>{p.adminNote}</p>
                                            )}
                                        </td>
                                        <td className={styles.dateCell}>
                                            {new Date(p.createdAt).toLocaleDateString("en-GB", {
                                                day: "2-digit", month: "short", year: "numeric",
                                            })}
                                        </td>
                                        <td>
                                            {p.status === "Pending" ? (
                                                <div className={styles.actionBtns}>
                                                    <button
                                                        className={styles.approveBtn}
                                                        onClick={() => handleApprove(p.id)}
                                                        disabled={busy}
                                                    >
                                                        {busy ? (
                                                            <span className={styles.btnSpinner} />
                                                        ) : (
                                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                                            </svg>
                                                        )}
                                                        Approve
                                                    </button>
                                                    <button
                                                        className={styles.rejectBtn}
                                                        onClick={() => { setRejectId(p.id); setAdminNote(""); }}
                                                        disabled={busy}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                                        </svg>
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : p.status === "Approved" ? (
                                                <div className={styles.actionBtns}>
                                                    <button
                                                        className={styles.sendBtn}
                                                        onClick={() => handleApprove(p.id)}
                                                        disabled={busy}
                                                    >
                                                        {busy ? <span className={styles.btnSpinner} /> : (
                                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                        )}
                                                        Send Money
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={styles.noAction}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Reject modal ── */}
            {rejectId && (
                <div className={styles.modalOverlay} onClick={() => setRejectId(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHead}>
                            <h3 className={styles.modalTitle}>Reject Payout Request</h3>
                            <button className={styles.modalClose} onClick={() => setRejectId(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <label className={styles.fieldLabel}>Reason / Note (optional)</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Explain why this request is being rejected…"
                                rows={4}
                                value={adminNote}
                                onChange={e => setAdminNote(e.target.value)}
                            />
                        </div>
                        <div className={styles.modalFoot}>
                            <button className={styles.cancelBtn} onClick={() => setRejectId(null)}>Cancel</button>
                            <button
                                className={styles.rejectConfirmBtn}
                                onClick={handleReject}
                                disabled={actionId !== null}
                            >
                                {actionId ? <span className={styles.btnSpinner} /> : null}
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

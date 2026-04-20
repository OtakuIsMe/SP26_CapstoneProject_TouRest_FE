"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminService } from "@/libs/services/admin.service";
import { ProviderDTO } from "@/types/provider.type";
import { AgencyDTO } from "@/types/agency.type";
import DataTable, { ActionDef, ColumnDef } from "@/components/commons/data-table/DataTable";
import styles from "./page.module.scss";

type Tab = "providers" | "agencies";
type EntityKind = "agency" | "provider";

interface ApproveTarget {
    id: string;
    name: string;
    kind: EntityKind;
}

interface AccountForm {
    email: string;
    password: string;
    username: string;
    phone: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    Pending:   { label: "Pending",   cls: styles.statusPending  },
    Active:    { label: "Approved",  cls: styles.statusApproved },
    Inactive:  { label: "Inactive",  cls: styles.statusRejected },
    Suspended: { label: "Suspended", cls: styles.statusRejected },
};

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status] ?? { label: status, cls: "" };
    return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

function NameCell({ name, avatarBg, avatarColor }: { name: string; avatarBg: string; avatarColor: string }) {
    return (
        <div className={styles.nameCell}>
            <div className={styles.avatar} style={{ background: avatarBg, color: avatarColor }}>
                {name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className={styles.nameText}>{name}</span>
        </div>
    );
}

function ApproveModal({
    target,
    onClose,
    onSuccess,
}: {
    target: ApproveTarget;
    onClose: () => void;
    onSuccess: (id: string) => void;
}) {
    const [form, setForm] = useState<AccountForm>({ email: "", password: "", username: "", phone: "" });
    const [showPw, setShowPw] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const overlayRef = useRef<HTMLDivElement>(null);

    const set = (k: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password || !form.username) {
            setError("Email, password and username are required.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const body = {
                email: form.email,
                password: form.password,
                username: form.username,
                phone: form.phone || undefined,
            };
            if (target.kind === "agency") {
                await adminService.approveAgency(target.id);
                await adminService.createAgencyAccount(target.id, body);
            } else {
                await adminService.approveProvider(target.id);
                await adminService.createProviderAccount(target.id, body);
            }
            onSuccess(target.id);
            onClose();
        } catch {
            setError("Failed to approve. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2 className={styles.modalTitle}>Approve & Create Account</h2>
                        <p className={styles.modalSub}>
                            Creating account for <strong>{target.name}</strong>
                        </p>
                    </div>
                    <button className={styles.modalClose} onClick={onClose} type="button">
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                <form className={styles.modalForm} onSubmit={handleSubmit}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Email <span className={styles.req}>*</span></label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="account@email.com"
                            value={form.email}
                            onChange={set("email")}
                            autoFocus
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Username <span className={styles.req}>*</span></label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="username"
                            value={form.username}
                            onChange={set("username")}
                            maxLength={50}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Password <span className={styles.req}>*</span></label>
                        <div className={styles.pwWrap}>
                            <input
                                type={showPw ? "text" : "password"}
                                className={styles.input}
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={set("password")}
                            />
                            <button
                                type="button"
                                className={styles.pwToggle}
                                onClick={() => setShowPw((v) => !v)}
                            >
                                {showPw ? (
                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                        <path d="M17.94 17.94A10.94 10.94 0 0112 20C7 20 2.73 16.11 1 12c.74-1.81 1.93-3.4 3.43-4.63M9.9 4.24A9.12 9.12 0 0112 4c5 0 9.27 3.89 11 8a10.89 10.89 0 01-1.41 2.6M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                        <path d="M1 12C2.73 7.89 7 4 12 4s9.27 3.89 11 8c-1.73 4.11-6 8-11 8S2.73 16.11 1 12z" stroke="currentColor" strokeWidth="2"/>
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Phone <span className={styles.opt}>(optional)</span></label>
                        <input
                            type="tel"
                            className={styles.input}
                            placeholder="+84..."
                            value={form.phone}
                            onChange={set("phone")}
                        />
                    </div>

                    {error && <p className={styles.errorMsg}>{error}</p>}

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.btnCancel} onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.btnApprove} disabled={submitting}>
                            {submitting ? "Approving…" : "Approve & Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminRequestsPage() {
    const [tab, setTab] = useState<Tab>("providers");

    const [providers, setProviders] = useState<ProviderDTO[]>([]);
    const [agencies,  setAgencies]  = useState<AgencyDTO[]>([]);
    const [loading,   setLoading]   = useState(true);

    const [approveTarget, setApproveTarget] = useState<ApproveTarget | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, aRes] = await Promise.all([
                adminService.getProviders(),
                adminService.getAgencies(),
            ]);
            setProviders(pRes.data ?? []);
            setAgencies(aRes.data ?? []);
        } catch {
            setProviders([]);
            setAgencies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Provider columns ──────────────────────────────────────────────────────
    const providerColumns: ColumnDef<ProviderDTO>[] = [
        {
            key: "name",
            label: "Provider",
            sortable: true,
            render: (row) => (
                <NameCell name={row.name} avatarBg="#dbeafe" avatarColor="#1d4ed8" />
            ),
        },
        {
            key: "contactEmail",
            label: "Email",
            sortable: true,
            render: (row) => (
                <a href={`mailto:${row.contactEmail}`} className={styles.emailLink}>
                    {row.contactEmail}
                </a>
            ),
        },
        {
            key: "contactPhone",
            label: "Phone",
            render: (row) => <span>{row.contactPhone || "—"}</span>,
        },
        {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: "createdAt",
            label: "Submitted",
            sortable: true,
            render: (row) => (
                <span>{new Date(row.createdAt).toLocaleDateString("en-GB")}</span>
            ),
        },
    ];

    const providerActions: ActionDef<ProviderDTO>[] = [
        {
            label: "Approve",
            variant: "edit",
            onClick: (row) => setApproveTarget({ id: row.id, name: row.name, kind: "provider" }),
        },
        {
            label: "Reject",
            variant: "delete",
            onClick: async (row) => {
                if (!confirm(`Reject provider "${row.name}"?`)) return;
                try {
                    await adminService.rejectProvider(row.id);
                    setProviders((prev) =>
                        prev.map((p) => (p.id === row.id ? { ...p, status: "Suspended" } : p))
                    );
                } catch {
                    alert("Failed to reject. Please try again.");
                }
            },
        },
    ];

    // ── Agency columns ────────────────────────────────────────────────────────
    const agencyColumns: ColumnDef<AgencyDTO>[] = [
        {
            key: "name",
            label: "Agency",
            sortable: true,
            render: (row) => (
                <NameCell name={row.name} avatarBg="#fef3c7" avatarColor="#92400e" />
            ),
        },
        {
            key: "contactEmail",
            label: "Email",
            sortable: true,
            render: (row) => (
                <a href={`mailto:${row.contactEmail}`} className={styles.emailLink}>
                    {row.contactEmail}
                </a>
            ),
        },
        {
            key: "contactPhone",
            label: "Phone",
            render: (row) => <span>{row.contactPhone || "—"}</span>,
        },
        {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: "createdAt",
            label: "Submitted",
            sortable: true,
            render: (row) => (
                <span>{new Date(row.createdAt).toLocaleDateString("en-GB")}</span>
            ),
        },
    ];

    const agencyActions: ActionDef<AgencyDTO>[] = [
        {
            label: "Approve",
            variant: "edit",
            onClick: (row) => setApproveTarget({ id: row.id, name: row.name, kind: "agency" }),
        },
        {
            label: "Reject",
            variant: "delete",
            onClick: async (row) => {
                if (!confirm(`Reject agency "${row.name}"?`)) return;
                try {
                    await adminService.rejectAgency(row.id);
                    setAgencies((prev) =>
                        prev.map((a) => (a.id === row.id ? { ...a, status: "Suspended" } : a))
                    );
                } catch {
                    alert("Failed to reject. Please try again.");
                }
            },
        },
    ];

    const handleApproveSuccess = (id: string) => {
        if (approveTarget?.kind === "provider") {
            setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Active" } : p)));
        } else {
            setAgencies((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Active" } : a)));
        }
    };

    // ── Stats helpers ─────────────────────────────────────────────────────────
    const data = tab === "providers" ? providers : agencies;
    const pending  = data.filter((r) => r.status === "Pending").length;
    const approved = data.filter((r) => r.status === "Active").length;
    const rejected = data.filter((r) => r.status === "Inactive" || r.status === "Suspended").length;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Registration Requests</h1>
                    <p className={styles.subtitle}>
                        Review and approve provider &amp; agency applications
                    </p>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === "providers" ? styles.tabActive : ""}`}
                    onClick={() => setTab("providers")}
                >
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.7"/>
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Providers
                    {providers.filter((p) => p.status === "Pending").length > 0 && (
                        <span className={styles.tabBadge}>
                            {providers.filter((p) => p.status === "Pending").length}
                        </span>
                    )}
                </button>
                <button
                    className={`${styles.tab} ${tab === "agencies" ? styles.tabActive : ""}`}
                    onClick={() => setTab("agencies")}
                >
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M3 21V7l9-4 9 4v14" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                        <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                    </svg>
                    Agencies
                    {agencies.filter((a) => a.status === "Pending").length > 0 && (
                        <span className={styles.tabBadge}>
                            {agencies.filter((a) => a.status === "Pending").length}
                        </span>
                    )}
                </button>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{data.length}</span>
                    <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.orange}`}>{pending}</span>
                    <span className={styles.statLabel}>Pending</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.green}`}>{approved}</span>
                    <span className={styles.statLabel}>Approved</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.red}`}>{rejected}</span>
                    <span className={styles.statLabel}>Rejected</span>
                </div>
            </div>

            {tab === "providers" ? (
                <DataTable<ProviderDTO>
                    columns={providerColumns}
                    data={providers}
                    actions={providerActions}
                    searchPlaceholder="Search by name, email..."
                    loading={loading}
                    selectable
                    exportable
                    emptyText="No provider requests found"
                />
            ) : (
                <DataTable<AgencyDTO>
                    columns={agencyColumns}
                    data={agencies}
                    actions={agencyActions}
                    searchPlaceholder="Search by name, email..."
                    loading={loading}
                    selectable
                    exportable
                    emptyText="No agency requests found"
                />
            )}

            {approveTarget && (
                <ApproveModal
                    target={approveTarget}
                    onClose={() => setApproveTarget(null)}
                    onSuccess={handleApproveSuccess}
                />
            )}
        </div>
    );
}

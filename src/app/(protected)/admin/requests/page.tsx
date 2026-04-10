"use client";

import { useCallback, useEffect, useState } from "react";
import { adminService } from "@/libs/services/admin.service";
import { ProviderDTO } from "@/types/provider.type";
import { AgencyDTO } from "@/types/agency.type";
import DataTable, { ActionDef, ColumnDef } from "@/components/commons/data-table/DataTable";
import styles from "./page.module.scss";

type Tab = "providers" | "agencies";

// 0=Pending, 1=Active, 2=Rejected
const STATUS_MAP: Record<number, { label: string; cls: string }> = {
    0: { label: "Pending",  cls: styles.statusPending  },
    1: { label: "Approved", cls: styles.statusApproved },
    2: { label: "Rejected", cls: styles.statusRejected },
};

function StatusBadge({ status }: { status: number }) {
    const s = STATUS_MAP[status] ?? { label: String(status), cls: "" };
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

export default function AdminRequestsPage() {
    const [tab, setTab] = useState<Tab>("providers");

    const [providers, setProviders] = useState<ProviderDTO[]>([]);
    const [agencies,  setAgencies]  = useState<AgencyDTO[]>([]);
    const [loading,   setLoading]   = useState(true);

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
            onClick: async (row) => {
                if (!confirm(`Approve provider "${row.name}"?`)) return;
                try {
                    await adminService.approveProvider(row.id);
                    setProviders((prev) =>
                        prev.map((p) => (p.id === row.id ? { ...p, status: 1 } : p))
                    );
                } catch {
                    alert("Failed to approve. Please try again.");
                }
            },
        },
        {
            label: "Reject",
            variant: "delete",
            onClick: async (row) => {
                if (!confirm(`Reject provider "${row.name}"?`)) return;
                try {
                    await adminService.rejectProvider(row.id);
                    setProviders((prev) =>
                        prev.map((p) => (p.id === row.id ? { ...p, status: 2 } : p))
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
            onClick: async (row) => {
                if (!confirm(`Approve agency "${row.name}"?`)) return;
                try {
                    await adminService.approveAgency(row.id);
                    setAgencies((prev) =>
                        prev.map((a) => (a.id === row.id ? { ...a, status: 1 } : a))
                    );
                } catch {
                    alert("Failed to approve. Please try again.");
                }
            },
        },
        {
            label: "Reject",
            variant: "delete",
            onClick: async (row) => {
                if (!confirm(`Reject agency "${row.name}"?`)) return;
                try {
                    await adminService.rejectAgency(row.id);
                    setAgencies((prev) =>
                        prev.map((a) => (a.id === row.id ? { ...a, status: 2 } : a))
                    );
                } catch {
                    alert("Failed to reject. Please try again.");
                }
            },
        },
    ];

    // ── Stats helpers ─────────────────────────────────────────────────────────
    const data = tab === "providers" ? providers : agencies;
    const pending  = data.filter((r) => r.status === 0).length;
    const approved = data.filter((r) => r.status === 1).length;
    const rejected = data.filter((r) => r.status === 2).length;

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Registration Requests</h1>
                    <p className={styles.subtitle}>
                        Review and approve provider &amp; agency applications
                    </p>
                </div>
            </div>

            {/* Tabs */}
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
                    {providers.filter((p) => p.status === 0).length > 0 && (
                        <span className={styles.tabBadge}>
                            {providers.filter((p) => p.status === 0).length}
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
                    {agencies.filter((a) => a.status === 0).length > 0 && (
                        <span className={styles.tabBadge}>
                            {agencies.filter((a) => a.status === 0).length}
                        </span>
                    )}
                </button>
            </div>

            {/* Stats */}
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

            {/* Table */}
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
        </div>
    );
}

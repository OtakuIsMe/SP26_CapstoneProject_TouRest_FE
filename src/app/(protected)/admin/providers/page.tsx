"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable, { ActionDef, ColumnDef } from "@/components/commons/data-table/DataTable";
import { adminService } from "@/libs/services/admin.service";
import { ProviderDTO } from "@/types/provider.type";
import styles from "./page.module.scss";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    Active:    { label: "Active",    cls: styles.statusActive    },
    Inactive:  { label: "Inactive",  cls: styles.statusInactive  },
    Suspended: { label: "Suspended", cls: styles.statusSuspended },
    Pending:   { label: "Pending",   cls: styles.statusPending   },
};

const columns: ColumnDef<ProviderDTO>[] = [
    {
        key: "name",
        label: "Provider",
        sortable: true,
        render: (row) => (
            <div className={styles.nameCell}>
                <div className={styles.avatar}>{row.name?.[0]?.toUpperCase() ?? "?"}</div>
                <span className={styles.nameText}>{row.name}</span>
            </div>
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
        key: "address",
        label: "Address",
        render: (row) => <span>{row.address || "—"}</span>,
    },
    {
        key: "status",
        label: "Status",
        render: (row) => {
            const s = STATUS_MAP[row.status] ?? { label: row.status, cls: "" };
            return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
        },
    },
    {
        key: "createdAt",
        label: "Created",
        sortable: true,
        render: (row) => (
            <span>{new Date(row.createdAt).toLocaleDateString("en-GB")}</span>
        ),
    },
];

export default function AdminProvidersPage() {
    const [providers,  setProviders]  = useState<ProviderDTO[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [page,       setPage]       = useState(1);
    const [pageSize,   setPageSize]   = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchProviders = useCallback(async (p: number, ps: number) => {
        setLoading(true);
        try {
            const res = await adminService.getAllProviders(p, ps);
            setProviders(res.data?.items ?? []);
            setTotalCount(res.data?.totalCount ?? 0);
        } catch {
            setProviders([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProviders(page, pageSize); }, [fetchProviders, page, pageSize]);

    const actions: ActionDef<ProviderDTO>[] = [
        {
            label: "Edit",
            variant: "edit",
            onClick: () => {},
        },
        {
            label: "Delete",
            variant: "delete",
            onClick: (row) => {
                if (!confirm(`Delete provider "${row.name}"?`)) return;
                setProviders((prev) => prev.filter((p) => p.id !== row.id));
                setTotalCount((c) => c - 1);
            },
        },
    ];

    const active    = providers.filter((p) => p.status === "Active").length;
    const inactive  = providers.filter((p) => p.status === "Inactive").length;
    const suspended = providers.filter((p) => p.status === "Suspended").length;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Providers</h1>
                    <p className={styles.subtitle}>Manage all service providers on the platform</p>
                </div>
                <button className={styles.btnAdd}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add Provider
                </button>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{totalCount}</span>
                    <span className={styles.statLabel}>Total Providers</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.green}`}>{active}</span>
                    <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.gray}`}>{inactive}</span>
                    <span className={styles.statLabel}>Inactive</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.red}`}>{suspended}</span>
                    <span className={styles.statLabel}>Suspended</span>
                </div>
            </div>

            <DataTable<ProviderDTO>
                columns={columns}
                data={providers}
                actions={actions}
                searchPlaceholder="Search by name, email..."
                loading={loading}
                selectable
                exportable
                emptyText="No providers found"
                serverSide={{
                    totalCount,
                    page,
                    pageSize,
                    onPageChange: (p) => setPage(p),
                    onPageSizeChange: (ps) => { setPageSize(ps); setPage(1); },
                }}
            />
        </div>
    );
}

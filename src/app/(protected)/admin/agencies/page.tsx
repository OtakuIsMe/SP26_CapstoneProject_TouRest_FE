"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable, { ActionDef, ColumnDef } from "@/components/commons/data-table/DataTable";
import { adminService } from "@/libs/services/admin.service";
import { AgencyDTO } from "@/types/agency.type";
import styles from "./page.module.scss";

// AgencyStatus: 0 = Active, 1 = Inactive, 2 = Suspended
const STATUS_MAP: Record<number, { label: string; cls: string }> = {
    0: { label: "Active",    cls: styles.statusActive    },
    1: { label: "Inactive",  cls: styles.statusInactive  },
    2: { label: "Suspended", cls: styles.statusSuspended },
};

const columns: ColumnDef<AgencyDTO>[] = [
    {
        key: "name",
        label: "Agency",
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
        key: "status",
        label: "Status",
        render: (row) => {
            const s = STATUS_MAP[row.status] ?? { label: String(row.status), cls: "" };
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

export default function AdminAgenciesPage() {
    const [agencies, setAgencies] = useState<AgencyDTO[]>([]);
    const [loading, setLoading]   = useState(true);

    const fetchAgencies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getAgencies();
            setAgencies(res.data ?? []);
        } catch {
            setAgencies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAgencies(); }, [fetchAgencies]);

    const actions: ActionDef<AgencyDTO>[] = [
        {
            label: "Edit",
            variant: "edit",
            onClick: () => {}, // TODO
        },
        {
            label: "Delete",
            variant: "delete",
            onClick: (row) => {
                if (!confirm(`Delete agency "${row.name}"?`)) return;
                setAgencies((prev) => prev.filter((a) => a.id !== row.id));
            },
        },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Agencies</h1>
                    <p className={styles.subtitle}>Manage all travel agencies on the platform</p>
                </div>
                <button className={styles.btnAdd}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add Agency
                </button>
            </div>

            {/* Stats row */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{agencies.length}</span>
                    <span className={styles.statLabel}>Total Agencies</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.green}`}>
                        {agencies.filter((a) => a.status === 0).length}
                    </span>
                    <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.gray}`}>
                        {agencies.filter((a) => a.status === 1).length}
                    </span>
                    <span className={styles.statLabel}>Inactive</span>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statValue} ${styles.red}`}>
                        {agencies.filter((a) => a.status === 2).length}
                    </span>
                    <span className={styles.statLabel}>Suspended</span>
                </div>
            </div>

            <DataTable<AgencyDTO>
                columns={columns}
                data={agencies}
                actions={actions}
                searchPlaceholder="Search by name, email..."
                loading={loading}
                selectable
                exportable
                emptyText="No agencies found"
            />
        </div>
    );
}

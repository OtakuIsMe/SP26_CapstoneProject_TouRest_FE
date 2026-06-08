"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubRole } from "@/hooks/useSubRole";
import DataTable, { ActionDef, ColumnDef } from "@/components/commons/data-table/DataTable";
import { providerService } from "@/libs/services/provider.service";
import { PackageDTO } from "@/types/package.type";
import styles from "./page.module.scss";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
    Active:   styles.statusActive,
    Inactive: styles.statusInactive,
    Archived: styles.statusArchived,
};

const STATUS_OPTIONS = ["Active", "Inactive", "Archived"] as const;

// ── Columns ───────────────────────────────────────────────────────────────────
const columns: ColumnDef<PackageDTO>[] = [
    {
        key: "name",
        label: "Package",
        sortable: true,
        render: (row) => (
            <div className={styles.nameCell}>
                <div className={styles.iconWrap}>
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                            stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                        <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                </div>
                <div className={styles.nameMeta}>
                    <span className={styles.nameText}>{row.name}</span>
                    <span className={styles.code}>{row.code}</span>
                </div>
            </div>
        ),
    },
    {
        key: "basePrice",
        label: "Base Price",
        sortable: true,
        render: (row) => (
            <span className={styles.price}>{row.basePrice.toLocaleString("vi-VN")}đ</span>
        ),
    },
    {
        key: "serviceCount",
        label: "Services",
        render: (row) => (
            <div className={styles.countCell}>
                <span className={styles.countBadge}>{row.serviceCount}</span>
                <span className={styles.countLabel}>service{row.serviceCount !== 1 ? "s" : ""}</span>
            </div>
        ),
    },
    {
        key: "status",
        label: "Status",
        render: (row) => (
            <span className={`${styles.badge} ${STATUS_CLS[row.status] ?? ""}`}>
                {row.status}
            </span>
        ),
    },
    {
        key: "createdAt",
        label: "Created",
        render: (row) => <span>{new Date(row.createdAt).toLocaleDateString("en-GB")}</span>,
    },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProviderPackagesPage() {
    const router = useRouter();
    const { can } = useSubRole("provider");
    const canManage = can("provider.packages.manage");

    const [allData, setAllData]   = useState<PackageDTO[]>([]);
    const [loading, setLoading]   = useState(true);
    const [status, setStatus]     = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const meRes = await providerService.getMe();
            const providerId = meRes.data?.id;
            if (!providerId) return;
            const res = await providerService.getPackagesByProvider(providerId);
            const items: PackageDTO[] = (res.data ?? []).map(p => ({
                id: p.id, code: p.code, name: p.name, basePrice: p.basePrice,
                status: p.status, createdAt: p.createdAt,
                serviceCount: p.services?.length ?? 0,
            }));
            setAllData(items);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const data = useMemo(
        () => status ? allData.filter(i => i.status === status) : allData,
        [allData, status]
    );

    const handleStatusChange = (st: string) => setStatus(st);

    const actions: ActionDef<PackageDTO>[] = [
        { label: "View", variant: "view", onClick: (row) => router.push(`/provider/packages/${row.id}`) },
        ...(canManage ? [{ label: "Edit", variant: "edit" as const, onClick: (row: PackageDTO) => router.push(`/provider/packages/${row.id}/edit`) }] : []),
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Packages</h1>
                    <p className={styles.subtitle}>Manage your service packages</p>
                </div>
                <div className={styles.headerRight}>
                    <select
                        className={styles.statusSelect}
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        <option value="">All Status</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    {canManage && (
                        <button className={styles.btnAdd} onClick={() => router.push("/provider/packages/new")}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Add Package
                        </button>
                    )}
                </div>
            </div>

            <DataTable<PackageDTO>
                columns={columns}
                data={data}
                actions={actions}
                searchPlaceholder="Search by name or code..."
                searchKeys={["name", "code"]}
                loading={loading}
                selectable
                exportable
                emptyText="No packages found"
            />
        </div>
    );
}

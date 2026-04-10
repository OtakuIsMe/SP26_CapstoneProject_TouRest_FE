"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
            <span className={styles.price}>${row.basePrice.toLocaleString()}</span>
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

    const [data, setData]         = useState<PackageDTO[]>([]);
    const [loading, setLoading]   = useState(true);
    const [totalCount, setTotal]  = useState(0);
    const [page, setPage]         = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch]     = useState("");
    const [status, setStatus]     = useState("");

    const fetchData = useCallback(async (p: number, ps: number, q: string, st: string) => {
        setLoading(true);
        try {
            const res = await providerService.getPackages({
                page: p, pageSize: ps,
                search: q || undefined,
                status: st || undefined,
            });
            setData(res.data.items);
            setTotal(res.data.totalCount);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(page, pageSize, search, status);
    }, [page, pageSize, status, fetchData]);

    const handlePageChange     = (p: number)  => setPage(p);
    const handlePageSizeChange = (ps: number) => { setPageSize(ps); setPage(1); };
    const handleSearchChange   = (q: string)  => { setSearch(q); setPage(1); fetchData(1, pageSize, q, status); };
    const handleStatusChange   = (st: string) => { setStatus(st); setPage(1); };

    const actions: ActionDef<PackageDTO>[] = [
        {
            label: "View",
            variant: "view",
            onClick: (row) => router.push(`/provider/packages/${row.id}`),
        },
        {
            label: "Edit",
            variant: "edit",
            onClick: (row) => router.push(`/provider/packages/${row.id}/edit`),
        },
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
                    <button className={styles.btnAdd} onClick={() => router.push("/provider/packages/new")}>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Add Package
                    </button>
                </div>
            </div>

            <DataTable<PackageDTO>
                columns={columns}
                data={data}
                actions={actions}
                searchPlaceholder="Search by name or code..."
                loading={loading}
                selectable
                exportable
                emptyText="No packages found"
                serverSide={{
                    totalCount,
                    page,
                    pageSize,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    onSearchChange: handleSearchChange,
                }}
            />
        </div>
    );
}

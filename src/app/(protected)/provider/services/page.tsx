"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable, { ActionDef, ColumnDef } from "@/components/commons/data-table/DataTable";
import { providerService } from "@/libs/services/provider.service";
import { ServiceDTO } from "@/types/service.type";
import AddServiceModal from "@/components/features/services/AddServiceModal";
import styles from "./page.module.scss";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
    Active:       styles.statusActive,
    Inactive:     styles.statusInactive,
    Discontinued: styles.statusDiscontinued,
};

const STATUS_OPTIONS = ["", "Active", "Inactive", "Discontinued"] as const;

// ── Columns ───────────────────────────────────────────────────────────────────
const columns: ColumnDef<ServiceDTO>[] = [
    {
        key: "name",
        label: "Service Name",
        sortable: true,
        render: (row) => (
            <div className={styles.nameCell}>
                <div className={styles.iconWrap}>
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
                        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                </div>
                <div className={styles.nameMeta}>
                    <span className={styles.nameText}>{row.name}</span>
                    {row.description && <span className={styles.desc}>{row.description}</span>}
                </div>
            </div>
        ),
    },
    {
        key: "price",
        label: "Price",
        sortable: true,
        render: (row) => (
            <div className={styles.priceCell}>
                <span className={styles.price}>${row.price.toLocaleString()}</span>
                {row.basePrice !== row.price && (
                    <span className={styles.basePrice}>${row.basePrice.toLocaleString()}</span>
                )}
            </div>
        ),
    },
    {
        key: "durationMinutes",
        label: "Duration",
        render: (row) => {
            const h = Math.floor(row.durationMinutes / 60);
            const m = row.durationMinutes % 60;
            return <span>{h > 0 ? `${h}h ` : ""}{m > 0 ? `${m}m` : ""}</span>;
        },
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
export default function ProviderServicesPage() {
    const router = useRouter();

    const [data, setData]         = useState<ServiceDTO[]>([]);
    const [loading, setLoading]   = useState(true);
    const [totalCount, setTotal]  = useState(0);
    const [page, setPage]         = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch]     = useState("");
    const [status, setStatus]     = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    const fetchData = useCallback(async (p: number, ps: number, q: string, st: string) => {
        setLoading(true);
        try {
            const res = await providerService.getServices({
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

    const actions: ActionDef<ServiceDTO>[] = [
        {
            label: "View",
            variant: "view",
            onClick: (row) => router.push(`/provider/services/${row.id}`),
        },
        {
            label: "Edit",
            variant: "edit",
            onClick: (row) => router.push(`/provider/services/${row.id}/edit`),
        },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Services</h1>
                    <p className={styles.subtitle}>Manage your medical services</p>
                </div>
                <div className={styles.headerRight}>
                    <select
                        className={styles.statusSelect}
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        <option value="">All Status</option>
                        {STATUS_OPTIONS.filter(Boolean).map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <button className={styles.btnAdd} onClick={() => setModalOpen(true)}>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Add Service
                    </button>
                </div>
            </div>

            <DataTable<ServiceDTO>
                columns={columns}
                data={data}
                actions={actions}
                searchPlaceholder="Search by name or description..."
                loading={loading}
                selectable
                exportable
                emptyText="No services found"
                serverSide={{
                    totalCount,
                    page,
                    pageSize,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    onSearchChange: handleSearchChange,
                }}
            />

            <AddServiceModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={() => fetchData(page, pageSize, search, status)}
            />
        </div>
    );
}

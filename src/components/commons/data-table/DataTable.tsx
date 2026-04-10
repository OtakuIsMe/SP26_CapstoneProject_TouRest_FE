"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import styles from "./data-table.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
export type ColumnDef<T> = {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    render?: (row: T) => React.ReactNode;
};

export type ActionDef<T> = {
    label: string;
    variant?: "view" | "edit" | "delete";
    icon?: React.ReactNode;
    onClick: (row: T) => void;
    show?: (row: T) => boolean;
};

export type FilterDef = {
    key: string;
    placeholder: string;
    options: { label: string; value: string }[];
};

export type ServerSideOptions = {
    totalCount: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onSearchChange?: (search: string) => void;
};

export type DataTableProps<T extends { id: string | number }> = {
    columns: ColumnDef<T>[];
    data: T[];
    actions?: ActionDef<T>[];
    filters?: FilterDef[];
    searchPlaceholder?: string;
    searchKeys?: (keyof T)[];
    addLabel?: string;
    onAdd?: () => void;
    exportable?: boolean;
    selectable?: boolean;
    pageSize?: number;
    emptyText?: string;
    onBulkDelete?: (ids: (string | number)[]) => void;
    serverSide?: ServerSideOptions;
    loading?: boolean;
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const ViewIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
);
const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
        <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
        <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
);
const ExportIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const VARIANT_CLASS: Record<string, string> = {
    view:   styles.btnView,
    edit:   styles.btnEdit,
    delete: styles.btnDelete,
};
const VARIANT_ICON: Record<string, React.ReactNode> = {
    view:   <ViewIcon />,
    edit:   <EditIcon />,
    delete: <DeleteIcon />,
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    actions = [],
    filters = [],
    searchPlaceholder = "Tìm kiếm...",
    searchKeys = [],
    addLabel,
    onAdd,
    exportable = false,
    selectable = false,
    pageSize: initialPageSize = 10,
    emptyText = "Không có dữ liệu",
    onBulkDelete,
    serverSide,
    loading = false,
}: DataTableProps<T>) {
    const isServer = !!serverSide;

    const [search, setSearch]         = useState("");
    const [filterVals, setFilterVals] = useState<Record<string, string>>({});
    const [sortKey, setSortKey]       = useState<string | null>(null);
    const [sortDir, setSortDir]       = useState<"asc" | "desc">("asc");
    const [page, setPage]             = useState(1);
    const [pageSize, setPageSize]     = useState(initialPageSize);
    const [selected, setSelected]     = useState<Set<string | number>>(new Set());

    // Debounce server-side search
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!isServer || !serverSide?.onSearchChange) return;
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(() => serverSide.onSearchChange!(search), 400);
        return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
    }, [search, isServer]);  // eslint-disable-line react-hooks/exhaustive-deps

    // ── Filter + search (client-side only) ──
    const filtered = useMemo(() => {
        if (isServer) return data;

        let rows = [...data];

        if (search.trim() && searchKeys.length) {
            const q = search.toLowerCase();
            rows = rows.filter(row =>
                searchKeys.some(k => String(row[k] ?? "").toLowerCase().includes(q))
            );
        }

        filters.forEach(f => {
            const val = filterVals[f.key];
            if (val && val !== "all") {
                rows = rows.filter(row => String((row as Record<string, unknown>)[f.key]) === val);
            }
        });

        return rows;
    }, [data, search, searchKeys, filterVals, filters, isServer]);

    // ── Sort (client-side only) ──
    const sorted = useMemo(() => {
        if (isServer || !sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const av = String((a as Record<string, unknown>)[sortKey] ?? "");
            const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
            const cmp = av.localeCompare(bv, undefined, { numeric: true });
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir, isServer]);

    // ── Paginate ──
    const activePage     = isServer ? serverSide!.page     : page;
    const activePageSize = isServer ? serverSide!.pageSize : pageSize;
    const totalCount     = isServer ? serverSide!.totalCount : sorted.length;
    const totalPages     = Math.max(1, Math.ceil(totalCount / activePageSize));
    const paged          = isServer ? data : sorted.slice((activePage - 1) * activePageSize, activePage * activePageSize);

    const handleSort = (key: string) => {
        if (isServer) return; // sorting handled server-side if needed
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setPage(1);
    };

    const handleSearch = (v: string) => {
        setSearch(v);
        if (!isServer) setPage(1);
    };
    const handleFilter = (key: string, v: string) => {
        setFilterVals(p => ({ ...p, [key]: v }));
        if (!isServer) setPage(1);
    };

    const handlePageChange = (p: number) => {
        if (isServer) serverSide!.onPageChange(p);
        else setPage(p);
    };
    const handlePageSizeChange = (size: number) => {
        if (isServer) serverSide!.onPageSizeChange(size);
        else { setPageSize(size); setPage(1); }
    };

    // ── Selection ──
    const allPageIds   = paged.map(r => r.id);
    const allSelected  = allPageIds.length > 0 && allPageIds.every(id => selected.has(id));
    const someSelected = allPageIds.some(id => selected.has(id));

    const toggleAll = () => {
        if (allSelected) {
            setSelected(s => { const n = new Set(s); allPageIds.forEach(id => n.delete(id)); return n; });
        } else {
            setSelected(s => new Set([...s, ...allPageIds]));
        }
    };

    const toggleRow = (id: string | number) => {
        setSelected(s => {
            const n = new Set(s);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    // ── Page range ──
    const pageRange = () => {
        const range: (number | "…")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) range.push(i);
        } else {
            range.push(1);
            if (activePage > 3) range.push("…");
            for (let i = Math.max(2, activePage-1); i <= Math.min(totalPages-1, activePage+1); i++) range.push(i);
            if (activePage < totalPages - 2) range.push("…");
            range.push(totalPages);
        }
        return range;
    };

    const start = (activePage - 1) * activePageSize + 1;
    const end   = Math.min(activePage * activePageSize, totalCount);

    const hasActions = actions.length > 0;

    return (
        <div className={styles.wrapper}>
            {/* ── Toolbar ── */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    {/* Search */}
                    <div className={styles.searchWrap}>
                        <span className={styles.searchIcon}><SearchIcon /></span>
                        <input
                            className={styles.searchInput}
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>

                    {/* Dynamic filters */}
                    {filters.map(f => (
                        <select
                            key={f.key}
                            className={styles.filterSelect}
                            value={filterVals[f.key] ?? "all"}
                            onChange={e => handleFilter(f.key, e.target.value)}
                        >
                            <option value="all">{f.placeholder}</option>
                            {f.options.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    ))}
                </div>

                <div className={styles.toolbarRight}>
                    <span className={styles.toolbarCount}>{totalCount} kết quả</span>
                    {exportable && (
                        <button className={styles.btnOutline}>
                            <ExportIcon /> Export
                        </button>
                    )}
                    {onAdd && (
                        <button className={styles.btnPrimary} onClick={onAdd}>
                            <PlusIcon /> {addLabel ?? "Thêm mới"}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Bulk bar ── */}
            {selectable && selected.size > 0 && (
                <div className={styles.bulkBar}>
                    <span className={styles.bulkCount}>{selected.size} đã chọn</span>
                    {onBulkDelete && (
                        <button
                            className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}
                            onClick={() => { onBulkDelete([...selected]); setSelected(new Set()); }}
                        >
                            <DeleteIcon /> Xoá
                        </button>
                    )}
                    <button
                        className={`${styles.bulkBtn} ${styles.bulkBtnNeutral}`}
                        onClick={() => setSelected(new Set())}
                    >
                        Bỏ chọn
                    </button>
                </div>
            )}

            {/* ── Table ── */}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                        <tr>
                            {selectable && (
                                <th className={`${styles.th} ${styles.thCheck}`}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                        onChange={toggleAll}
                                    />
                                </th>
                            )}
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`${styles.th} ${col.sortable ? styles.thSortable : ""} ${sortKey === col.key ? styles.thSortActive : ""}`}
                                    style={col.width ? { width: col.width } : undefined}
                                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                                >
                                    <span className={styles.thInner}>
                                        {col.label}
                                        {col.sortable && (
                                            <span className={`${styles.sortIcon} ${sortKey === col.key ? styles.sortIconActive : ""}`}>
                                                {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                                            </span>
                                        )}
                                    </span>
                                </th>
                            ))}
                            {hasActions && <th className={styles.th} style={{ width: "1px" }}>Actions</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)}>
                                    <div className={styles.emptyState}>
                                        <span className={styles.emptyText}>Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paged.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)}>
                                    <div className={styles.emptyState}>
                                        <span className={styles.emptyIcon}>📭</span>
                                        <span className={styles.emptyText}>{emptyText}</span>
                                        {search && <span className={styles.emptySub}>Thử tìm với từ khoá khác</span>}
                                    </div>
                                </td>
                            </tr>
                        ) : paged.map(row => (
                            <tr
                                key={row.id}
                                className={`${styles.tr} ${selected.has(row.id) ? styles.trSelected : ""}`}
                            >
                                {selectable && (
                                    <td className={`${styles.td} ${styles.tdCheck}`}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={selected.has(row.id)}
                                            onChange={() => toggleRow(row.id)}
                                        />
                                    </td>
                                )}
                                {columns.map(col => (
                                    <td key={col.key} className={styles.td}>
                                        {col.render
                                            ? col.render(row)
                                            : String((row as Record<string, unknown>)[col.key] ?? "—")}
                                    </td>
                                ))}
                                {hasActions && (
                                    <td className={styles.td}>
                                        <div className={styles.actions}>
                                            {actions.map((action, ai) => {
                                                if (action.show && !action.show(row)) return null;
                                                const variant = action.variant ?? "edit";
                                                return (
                                                    <button
                                                        key={ai}
                                                        className={`${styles.actionBtn} ${VARIANT_CLASS[variant] ?? styles.btnEdit}`}
                                                        onClick={() => action.onClick(row)}
                                                        title={action.label}
                                                    >
                                                        {action.icon ?? VARIANT_ICON[variant]}
                                                        {action.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ── */}
            {totalCount > 0 && (
                <div className={styles.pagination}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={styles.pageInfo}>
                            Hiện {start}–{end} / {totalCount} mục
                        </span>
                        <select
                            className={styles.pageSizeSelect}
                            value={activePageSize}
                            onChange={e => handlePageSizeChange(Number(e.target.value))}
                        >
                            {[10, 20, 50, 100].map(n => (
                                <option key={n} value={n}>{n} / trang</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.pageControls}>
                        <button
                            className={styles.pageBtn}
                            disabled={activePage === 1}
                            onClick={() => handlePageChange(activePage - 1)}
                        >
                            ‹
                        </button>

                        {pageRange().map((p, i) =>
                            p === "…" ? (
                                <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "#9ca3af" }}>…</span>
                            ) : (
                                <button
                                    key={p}
                                    className={`${styles.pageBtn} ${activePage === p ? styles.pageBtnActive : ""}`}
                                    onClick={() => handlePageChange(p as number)}
                                >
                                    {p}
                                </button>
                            )
                        )}

                        <button
                            className={styles.pageBtn}
                            disabled={activePage === totalPages}
                            onClick={() => handlePageChange(activePage + 1)}
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

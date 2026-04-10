"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable, { ActionDef, ColumnDef } from "@/components/commons/data-table/DataTable";
import { userService } from "@/libs/services/user.service";
import { UserDTO } from "@/types/user.type";
import AddUserModal from "@/components/features/users/AddUserModal";
import styles from "./page.module.scss";

// ── Column definitions ─────────────────────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
    Active:   styles.statusActive,
    Inactive: styles.statusInactive,
    Locked:   styles.statusLocked,
};

const ROLE_CLS: Record<string, string> = {
    admin:    styles.roleAdmin,
    customer: styles.roleCustomer,
    agency:   styles.roleAgency,
    provider: styles.roleProvider,
};

const columns: ColumnDef<UserDTO>[] = [
    {
        key: "username",
        label: "User",
        sortable: true,
        render: (row) => (
            <div className={styles.nameCell}>
                <div className={styles.avatar}>{row.username?.[0]?.toUpperCase() ?? "?"}</div>
                <div className={styles.nameMeta}>
                    <span className={styles.nameText}>{row.username}</span>
                    {row.fullName && <span className={styles.fullName}>{row.fullName}</span>}
                </div>
            </div>
        ),
    },
    {
        key: "email",
        label: "Email",
        sortable: true,
    },
    {
        key: "phone",
        label: "Phone",
        render: (row) => <span>{row.phone ?? "—"}</span>,
    },
    {
        key: "role",
        label: "Role",
        render: (row) => (
            <span className={`${styles.badge} ${ROLE_CLS[row.role] ?? styles.roleCustomer}`}>
                {row.role}
            </span>
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
        label: "Joined",
        render: (row) => (
            <span>{new Date(row.createdAt).toLocaleDateString("en-GB")}</span>
        ),
    },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const router = useRouter();

    const [users, setUsers]         = useState<UserDTO[]>([]);
    const [loading, setLoading]     = useState(true);
    const [totalCount, setTotal]    = useState(0);
    const [page, setPage]           = useState(1);
    const [pageSize, setPageSize]   = useState(10);
    const [search, setSearch]       = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    const fetchUsers = useCallback(async (p: number, ps: number, q: string) => {
        setLoading(true);
        try {
            const res = await userService.getAll({ page: p, pageSize: ps, search: q || undefined });
            setUsers(res.data.items);
            setTotal(res.data.totalCount);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(page, pageSize, search);
    }, [page, pageSize, fetchUsers]); // search triggers via onSearchChange debounce

    const handlePageChange     = (p: number)    => setPage(p);
    const handlePageSizeChange = (ps: number)   => { setPageSize(ps); setPage(1); };
    const handleSearchChange   = (q: string)    => { setSearch(q); setPage(1); fetchUsers(1, pageSize, q); };

    const handleDelete = (row: UserDTO) => {
        if (!confirm(`Delete user "${row.username}"?`)) return;
        // TODO: call delete API when BE exposes it
        setUsers((prev) => prev.filter((u) => u.id !== row.id));
        setTotal((prev) => prev - 1);
    };

    const actions: ActionDef<UserDTO>[] = [
        {
            label: "View",
            variant: "view",
            onClick: (row) => router.push(`/admin/users/${row.id}`),
        },
        {
            label: "Edit",
            variant: "edit",
            onClick: (row) => router.push(`/admin/users/${row.id}/edit`),
        },
        {
            label: "Delete",
            variant: "delete",
            onClick: handleDelete,
        },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Users</h1>
                    <p className={styles.subtitle}>Manage all registered accounts</p>
                </div>
                <button className={styles.btnAdd} onClick={() => setModalOpen(true)}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add User
                </button>
            </div>

            <DataTable<UserDTO>
                columns={columns}
                data={users}
                actions={actions}
                searchPlaceholder="Search by name, email..."
                loading={loading}
                selectable
                exportable
                emptyText="No users found"
                serverSide={{
                    totalCount,
                    page,
                    pageSize,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    onSearchChange: handleSearchChange,
                }}
            />
            <AddUserModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={() => fetchUsers(page, pageSize, search)}
            />
        </div>
    );
}

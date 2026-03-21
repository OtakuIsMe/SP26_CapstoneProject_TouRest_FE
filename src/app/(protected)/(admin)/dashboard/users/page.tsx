
"use client";

import { useState } from "react";
import DataTable, { type ColumnDef, type ActionDef, type FilterDef } from "@/components/commons/data-table/DataTable";
import styles from "./page.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
type Role   = "admin" | "agency" | "provider" | "customer";
type Status = "active" | "inactive" | "banned" | "pending";

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: Role;
    status: Status;
    joined: string;
    lastActive: string;
    bookings: number;
    avatar?: string;
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const USERS: User[] = [
    { id:"USR-001", name:"Nguyễn Minh Tuấn",  email:"tuan.nm@email.com",    phone:"0901 234 567", role:"admin",    status:"active",   joined:"01/01/2024", lastActive:"Hôm nay",    bookings:0  },
    { id:"USR-002", name:"Trần Thị Lan",      email:"lan.tt@email.com",     phone:"0912 345 678", role:"customer", status:"active",   joined:"15/02/2024", lastActive:"Hôm qua",    bookings:12 },
    { id:"USR-003", name:"Lê Văn Hùng",       email:"hung.lv@email.com",    phone:"0923 456 789", role:"agency",   status:"active",   joined:"10/03/2024", lastActive:"2 ngày trước",bookings:0 },
    { id:"USR-004", name:"Phạm Thị Mai",      email:"mai.pt@email.com",     phone:"0934 567 890", role:"customer", status:"inactive", joined:"20/03/2024", lastActive:"1 tuần trước",bookings:3 },
    { id:"USR-005", name:"Hoàng Quốc Bảo",    email:"bao.hq@email.com",     phone:"0945 678 901", role:"provider", status:"active",   joined:"05/04/2024", lastActive:"Hôm nay",    bookings:0  },
    { id:"USR-006", name:"Vũ Thị Hoa",        email:"hoa.vt@email.com",     phone:"0956 789 012", role:"customer", status:"banned",   joined:"12/04/2024", lastActive:"1 tháng trước",bookings:1},
    { id:"USR-007", name:"Đặng Văn An",       email:"an.dv@email.com",      phone:"0967 890 123", role:"customer", status:"active",   joined:"18/05/2024", lastActive:"3 ngày trước",bookings:7 },
    { id:"USR-008", name:"Ngô Thị Thu",       email:"thu.nt@email.com",     phone:"0978 901 234", role:"agency",   status:"pending",  joined:"22/05/2024", lastActive:"Hôm nay",    bookings:0  },
    { id:"USR-009", name:"Bùi Đức Mạnh",      email:"manh.bd@email.com",    phone:"0989 012 345", role:"customer", status:"active",   joined:"01/06/2024", lastActive:"Hôm qua",    bookings:5  },
    { id:"USR-010", name:"Lý Thị Phương",     email:"phuong.lt@email.com",  phone:"0990 123 456", role:"provider", status:"active",   joined:"15/06/2024", lastActive:"Hôm nay",    bookings:0  },
    { id:"USR-011", name:"Trương Minh Khôi",  email:"khoi.tm@email.com",    phone:"0901 234 568", role:"customer", status:"active",   joined:"20/07/2024", lastActive:"5 ngày trước",bookings:2 },
    { id:"USR-012", name:"Đinh Thị Yến",      email:"yen.dt@email.com",     phone:"0912 345 679", role:"customer", status:"inactive", joined:"01/08/2024", lastActive:"2 tuần trước",bookings:0 },
    { id:"USR-013", name:"Cao Văn Phú",       email:"phu.cv@email.com",     phone:"0923 456 780", role:"agency",   status:"active",   joined:"10/08/2024", lastActive:"Hôm nay",    bookings:0  },
    { id:"USR-014", name:"Mai Thị Linh",      email:"linh.mt@email.com",    phone:"0934 567 891", role:"customer", status:"active",   joined:"15/09/2024", lastActive:"Hôm qua",    bookings:9  },
    { id:"USR-015", name:"Phan Văn Tú",       email:"tu.pv@email.com",      phone:"0945 678 902", role:"customer", status:"pending",  joined:"01/10/2024", lastActive:"Hôm nay",    bookings:0  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<Role, string>   = { admin:"Admin", agency:"Agency", provider:"Provider", customer:"Customer" };
const ROLE_CLS: Record<Role, string>     = { admin:styles.badgeAdmin, agency:styles.badgeAgency, provider:styles.badgeProvider, customer:styles.badgeCustomer };
const STATUS_LABEL: Record<Status,string>= { active:"Active", inactive:"Inactive", banned:"Banned", pending:"Pending" };
const STATUS_CLS: Record<Status, string> = { active:styles.badgeActive, inactive:styles.badgeInactive, banned:styles.badgeBanned, pending:styles.badgePending };
const STATUS_DOT: Record<Status, string> = { active:"🟢", inactive:"⚪", banned:"🔴", pending:"🟡" };

function initials(name: string) {
    return name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
}

// ── Columns ───────────────────────────────────────────────────────────────────
const COLUMNS: ColumnDef<User>[] = [
    {
        key: "name", label: "Người dùng", sortable: true,
        render: row => (
            <div className={styles.userCell}>
                <div className={styles.avatarFallback}
                    style={{ background: AVATAR_COLORS[row.id.charCodeAt(row.id.length-1) % AVATAR_COLORS.length] }}>
                    {initials(row.name)}
                </div>
                <div>
                    <p className={styles.userName}>{row.name}</p>
                    <p className={styles.userEmail}>{row.email}</p>
                </div>
            </div>
        ),
    },
    { key: "id", label: "ID", sortable: true, width: "100px" },
    {
        key: "role", label: "Vai trò", sortable: true, width: "110px",
        render: row => (
            <span className={`${styles.badge} ${ROLE_CLS[row.role]}`}>{ROLE_LABEL[row.role]}</span>
        ),
    },
    {
        key: "status", label: "Trạng thái", sortable: true, width: "110px",
        render: row => (
            <span className={`${styles.badge} ${STATUS_CLS[row.status]}`}>
                {STATUS_DOT[row.status]} {STATUS_LABEL[row.status]}
            </span>
        ),
    },
    { key: "phone",      label: "Điện thoại", width: "130px" },
    { key: "joined",     label: "Ngày tham gia", sortable: true, width: "130px" },
    { key: "lastActive", label: "Hoạt động", width: "120px" },
    {
        key: "bookings", label: "Bookings", sortable: true, width: "90px",
        render: row => (
            <span style={{ fontWeight: row.bookings > 0 ? 700 : 400, color: row.bookings > 0 ? "#111827" : "#9ca3af" }}>
                {row.bookings}
            </span>
        ),
    },
];

const AVATAR_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316"];

// ── Filters ───────────────────────────────────────────────────────────────────
const FILTERS: FilterDef[] = [
    {
        key: "role",
        placeholder: "Tất cả vai trò",
        options: [
            { label:"Admin",    value:"admin"    },
            { label:"Agency",   value:"agency"   },
            { label:"Provider", value:"provider" },
            { label:"Customer", value:"customer" },
        ],
    },
    {
        key: "status",
        placeholder: "Tất cả trạng thái",
        options: [
            { label:"Active",   value:"active"   },
            { label:"Inactive", value:"inactive" },
            { label:"Banned",   value:"banned"   },
            { label:"Pending",  value:"pending"  },
        ],
    },
];

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
    { label:"Tổng người dùng",  value: USERS.length,                             icon:"👥", cls:"iconBlue",   trend:"+12%", trendCls:"trendUp"  },
    { label:"Đang hoạt động",   value: USERS.filter(u=>u.status==="active").length,  icon:"✅", cls:"iconGreen",  trend:"+8%",  trendCls:"trendUp"  },
    { label:"Tháng này mới",    value: 42,                                        icon:"🆕", cls:"iconAmber",  trend:"+24%", trendCls:"trendUp"  },
    { label:"Bị khoá",          value: USERS.filter(u=>u.status==="banned").length,  icon:"🚫", cls:"iconRed",    trend:"-2%",  trendCls:"trendDown"},
];

// ── Modal components ──────────────────────────────────────────────────────────
function ViewModal({ user, onClose }: { user: User; onClose: () => void }) {
    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <p className={styles.modalTitle}>Chi tiết người dùng</p>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.viewProfile}>
                        <div className={styles.viewAvatarLg}
                            style={{ background: AVATAR_COLORS[user.id.charCodeAt(user.id.length-1) % AVATAR_COLORS.length] }}>
                            {initials(user.name)}
                        </div>
                        <div>
                            <p className={styles.viewName}>{user.name}</p>
                            <p className={styles.viewEmail}>{user.email}</p>
                            <span className={`${styles.badge} ${ROLE_CLS[user.role]}`}>{ROLE_LABEL[user.role]}</span>
                        </div>
                    </div>
                    <div className={styles.viewRows}>
                        {[
                            { label:"ID",           value: user.id        },
                            { label:"Điện thoại",   value: user.phone     },
                            { label:"Trạng thái",   value: <span className={`${styles.badge} ${STATUS_CLS[user.status]}`}>{STATUS_DOT[user.status]} {STATUS_LABEL[user.status]}</span> },
                            { label:"Ngày tham gia",value: user.joined    },
                            { label:"Hoạt động",    value: user.lastActive},
                            { label:"Số bookings",  value: user.bookings  },
                        ].map(r => (
                            <div key={r.label} className={styles.viewRow}>
                                <span className={styles.viewRowLabel}>{r.label}</span>
                                <span className={styles.viewRowValue}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function EditModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (u: User) => void }) {
    const [form, setForm] = useState({ ...user });
    const set = (k: keyof User, v: string) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <p className={styles.modalTitle}>Chỉnh sửa người dùng</p>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Họ và tên</label>
                            <input className={styles.formInput} value={form.name} onChange={e => set("name", e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>ID</label>
                            <input className={styles.formInput} value={form.id} disabled style={{ opacity:.6 }} />
                        </div>
                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.formLabel}>Email</label>
                            <input className={styles.formInput} type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Điện thoại</label>
                            <input className={styles.formInput} value={form.phone} onChange={e => set("phone", e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Vai trò</label>
                            <select className={styles.formSelect} value={form.role} onChange={e => set("role", e.target.value)}>
                                <option value="admin">Admin</option>
                                <option value="agency">Agency</option>
                                <option value="provider">Provider</option>
                                <option value="customer">Customer</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Trạng thái</label>
                            <select className={styles.formSelect} value={form.status} onChange={e => set("status", e.target.value)}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="banned">Banned</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button className={styles.btnSave} onClick={() => { onSave(form); onClose(); }}>Lưu thay đổi</button>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const [users, setUsers]       = useState<User[]>(USERS);
    const [viewing, setViewing]   = useState<User | null>(null);
    const [editing, setEditing]   = useState<User | null>(null);

    const handleSave = (updated: User) =>
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));

    const handleBulkDelete = (ids: (string | number)[]) =>
        setUsers(prev => prev.filter(u => !ids.includes(u.id)));

    const ACTIONS: ActionDef<User>[] = [
        { label:"View",   variant:"view",   onClick: u => setViewing(u)                    },
        { label:"Edit",   variant:"edit",   onClick: u => setEditing(u)                    },
        { label:"Ban",    variant:"delete", onClick: u => handleSave({ ...u, status:"banned" }),
          show: u => u.status !== "banned"                                                   },
        { label:"Unban",  variant:"edit",   onClick: u => handleSave({ ...u, status:"active" }),
          show: u => u.status === "banned"                                                   },
    ];

    return (
        <div className={styles.page}>
            {/* ── Stats ── */}
            <div className={styles.statsRow}>
                {STATS.map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={`${styles.statIconWrap} ${styles[s.cls as keyof typeof styles]}`}>
                            <span>{s.icon}</span>
                        </div>
                        <div className={styles.statBody}>
                            <p className={styles.statValue}>{s.value}</p>
                            <p className={styles.statLabel}>{s.label}</p>
                            <span className={`${styles.statTrend} ${styles[s.trendCls as keyof typeof styles]}`}>
                                {s.trend} tháng này
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Table ── */}
            <DataTable<User>
                columns={COLUMNS}
                data={users}
                actions={ACTIONS}
                filters={FILTERS}
                searchPlaceholder="Tìm theo tên, email..."
                searchKeys={["name", "email", "id", "phone"]}
                addLabel="Thêm người dùng"
                onAdd={() => alert("Open add user modal")}
                exportable
                selectable
                pageSize={10}
                emptyText="Không tìm thấy người dùng"
                onBulkDelete={handleBulkDelete}
            />

            {/* ── Modals ── */}
            {viewing && <ViewModal user={viewing} onClose={() => setViewing(null)} />}
            {editing && <EditModal user={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
        </div>
    );
}

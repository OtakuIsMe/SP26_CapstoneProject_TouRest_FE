"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";
import { agencyService } from "@/libs/services/agency.service";
import { VehicleDTO, VEHICLE_TYPE_OPTIONS, VEHICLE_TYPE_LABELS, VehicleType } from "@/types/vehicle.type";

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<VehicleType, { bg: string; color: string }> = {
    Bus:        { bg: "#dbeafe", color: "#1d4ed8" },
    MiniVan:    { bg: "#e0e7ff", color: "#4338ca" },
    PrivateCar: { bg: "#dcfce7", color: "#15803d" },
    Motorbike:  { bg: "#fef3c7", color: "#b45309" },
    Bicycle:    { bg: "#d1fae5", color: "#065f46" },
    Boat:       { bg: "#cffafe", color: "#0e7490" },
    Ferry:      { bg: "#e0f2fe", color: "#0369a1" },
    Train:      { bg: "#f3e8ff", color: "#7e22ce" },
    Walking:    { bg: "#f3f4f6", color: "#374151" },
};

const TYPE_ICONS: Record<VehicleType, string> = {
    Bus:        "🚌",
    MiniVan:    "🚐",
    PrivateCar: "🚗",
    Motorbike:  "🏍️",
    Bicycle:    "🚲",
    Boat:       "⛵",
    Ferry:      "⛴️",
    Train:      "🚂",
    Walking:    "🚶",
};

const EMPTY_FORM = { name: "", description: "", capacity: 1, type: 0 };

// ── Component ─────────────────────────────────────────────────────────────────
export default function AgencyVehiclesPage() {
    const [vehicles, setVehicles] = useState<VehicleDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<VehicleDTO | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const modalRef = useRef<HTMLDivElement>(null);

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<VehicleDTO | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                closeModal();
            }
        }
        if (modalOpen || deleteTarget) document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [modalOpen, deleteTarget]);

    function load() {
        setLoading(true);
        agencyService.getMyVehicles()
            .then(res => setVehicles(res?.data ?? []))
            .finally(() => setLoading(false));
    }

    function openCreate() {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setError("");
        setModalOpen(true);
    }

    function openEdit(v: VehicleDTO) {
        setEditTarget(v);
        setForm({
            name: v.name,
            description: v.description ?? "",
            capacity: v.capacity,
            type: VEHICLE_TYPE_OPTIONS.find(o => o.key === v.type)?.value ?? 0,
        });
        setError("");
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setDeleteTarget(null);
    }

    async function handleSave() {
        if (!form.name.trim()) { setError("Tên phương tiện không được để trống"); return; }
        if (form.capacity < 1) { setError("Sức chứa phải ít nhất 1"); return; }
        setSaving(true);
        setError("");
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                capacity: form.capacity,
                type: form.type,
            };
            if (editTarget) {
                await agencyService.updateVehicle(editTarget.id, payload);
            } else {
                await agencyService.createVehicle(payload);
            }
            closeModal();
            load();
        } catch {
            setError("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await agencyService.deleteVehicle(deleteTarget.id);
            setDeleteTarget(null);
            load();
        } catch {
            setError("Xóa thất bại");
        } finally {
            setDeleting(false);
        }
    }

    const filtered = vehicles.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.page}>
            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <h1 className={styles.title}>Phương tiện</h1>
                    <span className={styles.count}>{vehicles.length} phương tiện</span>
                </div>
                <div className={styles.topRight}>
                    <div className={styles.searchBox}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        <input
                            placeholder="Tìm phương tiện..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className={styles.addBtn} onClick={openCreate}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Thêm phương tiện
                    </button>
                </div>
            </div>

            {/* ── Grid ── */}
            {loading ? (
                <div className={styles.grid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.skeletonCard} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>🚗</span>
                    <p>{search ? "Không tìm thấy phương tiện" : "Chưa có phương tiện nào"}</p>
                    {!search && (
                        <button className={styles.addBtn} onClick={openCreate}>Thêm ngay</button>
                    )}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map(v => {
                        const typeKey = v.type as VehicleType;
                        const color = TYPE_COLORS[typeKey] ?? { bg: "#f3f4f6", color: "#374151" };
                        const icon = TYPE_ICONS[typeKey] ?? "🚗";
                        const label = VEHICLE_TYPE_LABELS[typeKey] ?? v.type;
                        return (
                            <div key={v.id} className={styles.card}>
                                <div className={styles.cardIcon} style={{ background: color.bg }}>
                                    <span>{icon}</span>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardName}>{v.name}</div>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.typeBadge} style={{ background: color.bg, color: color.color }}>
                                            {label}
                                        </span>
                                        <span className={styles.capacity}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            </svg>
                                            {v.capacity} chỗ
                                        </span>
                                    </div>
                                    {v.description && (
                                        <p className={styles.cardDesc}>{v.description}</p>
                                    )}
                                </div>
                                <div className={styles.cardActions}>
                                    <button className={styles.editBtn} onClick={() => openEdit(v)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                    <button className={styles.deleteBtn} onClick={() => setDeleteTarget(v)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Create / Edit Modal ── */}
            {modalOpen && (
                <div className={styles.overlay}>
                    <div className={styles.modal} ref={modalRef}>
                        <div className={styles.modalHeader}>
                            <h2>{editTarget ? "Chỉnh sửa phương tiện" : "Thêm phương tiện"}</h2>
                            <button className={styles.closeBtn} onClick={closeModal}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <label className={styles.fieldLabel}>Tên phương tiện *</label>
                            <input
                                className={styles.input}
                                placeholder="VD: Xe buýt 45 chỗ"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />

                            <label className={styles.fieldLabel}>Loại phương tiện *</label>
                            <select
                                className={styles.select}
                                value={form.type}
                                onChange={e => setForm(f => ({ ...f, type: Number(e.target.value) }))}
                            >
                                {VEHICLE_TYPE_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>
                                        {TYPE_ICONS[o.key as VehicleType]} {o.label}
                                    </option>
                                ))}
                            </select>

                            <label className={styles.fieldLabel}>Sức chứa (chỗ ngồi) *</label>
                            <input
                                className={styles.input}
                                type="number"
                                min={1}
                                max={500}
                                value={form.capacity}
                                onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                            />

                            <label className={styles.fieldLabel}>Mô tả</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Mô tả thêm về phương tiện..."
                                rows={3}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />

                            {error && <p className={styles.errorMsg}>{error}</p>}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={closeModal} disabled={saving}>Hủy</button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? "Đang lưu..." : editTarget ? "Cập nhật" : "Tạo mới"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ── */}
            {deleteTarget && (
                <div className={styles.overlay}>
                    <div className={styles.confirmModal} ref={modalRef}>
                        <div className={styles.confirmIcon}>🗑️</div>
                        <h3 className={styles.confirmTitle}>Xóa phương tiện?</h3>
                        <p className={styles.confirmMsg}>
                            Bạn có chắc muốn xóa <strong>{deleteTarget.name}</strong>? Hành động này không thể hoàn tác.
                        </p>
                        {error && <p className={styles.errorMsg}>{error}</p>}
                        <div className={styles.confirmActions}>
                            <button className={styles.cancelBtn} onClick={closeModal} disabled={deleting}>Hủy</button>
                            <button className={styles.deleteConfirmBtn} onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

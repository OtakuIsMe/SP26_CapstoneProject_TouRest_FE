"use client";

import { useEffect, useRef, useState } from "react";
import { userService, AdminUpdateUserPayload } from "@/libs/services/user.service";
import { UserDTO } from "@/types/user.type";
import styles from "./edit-user-modal.module.scss";

const STATUS_OPTIONS = ["Active", "Inactive", "Locked"];
const ROLE_OPTIONS   = [
    { label: "Customer", value: "CUSTOMER" },
    { label: "Admin",    value: "ADMIN"    },
    { label: "Provider", value: "PROVIDER" },
    { label: "Agency",   value: "AGENCY"   },
];

interface Props {
    userId: string | null;
    onClose: () => void;
    onUpdated: () => void;
}

interface Form {
    username:      string;
    fullName:      string;
    phone:         string;
    status:        string;
    roleCode:      string;
    dateOfBirth:   string;
    addressDetail: string;
    cityId:        string;
    districtId:    string;
}

const BLANK: Form = {
    username:      "",
    fullName:      "",
    phone:         "",
    status:        "Active",
    roleCode:      "CUSTOMER",
    dateOfBirth:   "",
    addressDetail: "",
    cityId:        "",
    districtId:    "",
};

export default function EditUserModal({ userId, onClose, onUpdated }: Props) {
    const overlayRef             = useRef<HTMLDivElement>(null);
    const [form, setForm]        = useState<Form>(BLANK);
    const [loading, setLoading]  = useState(false);
    const [saving, setSaving]    = useState(false);
    const [error, setError]      = useState("");
    const [fieldErr, setFieldErr] = useState<Partial<Form>>({});

    useEffect(() => {
        if (!userId) { setForm(BLANK); return; }
        setLoading(true);
        setError("");
        userService.getById(userId)
            .then(res => {
                const u: UserDTO = res.data;
                setForm({
                    username:      u.username      ?? "",
                    fullName:      u.fullName      ?? "",
                    phone:         u.phone         ?? "",
                    status:        u.status        ?? "Active",
                    roleCode:      u.role?.toUpperCase() ?? "CUSTOMER",
                    dateOfBirth:   u.dateOfBirth   ? u.dateOfBirth.slice(0, 10) : "",
                    addressDetail: u.addressDetail ?? "",
                    cityId:        u.cityId        ?? "",
                    districtId:    u.districtId    ?? "",
                });
            })
            .catch(() => setError("Failed to load user data."))
            .finally(() => setLoading(false));
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [userId, onClose]);

    if (!userId) return null;

    const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [key]: e.target.value }));
        setFieldErr(prev => ({ ...prev, [key]: "" }));
    };

    const validate = (): boolean => {
        const errs: Partial<Form> = {};
        if (!form.username.trim()) errs.username = "Username is required";
        if (!form.status)          errs.status   = "Status is required";
        if (!form.roleCode)        errs.roleCode  = "Role is required";
        setFieldErr(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        setError("");
        try {
            const payload: AdminUpdateUserPayload = {
                username:      form.username.trim(),
                fullName:      form.fullName.trim()      || undefined,
                phone:         form.phone.trim()         || undefined,
                status:        form.status,
                roleCode:      form.roleCode,
                dateOfBirth:   form.dateOfBirth          || undefined,
                addressDetail: form.addressDetail.trim() || undefined,
                cityId:        form.cityId.trim()        || undefined,
                districtId:    form.districtId.trim()    || undefined,
            };
            await userService.adminUpdateUser(userId!, payload);
            onUpdated();
            onClose();
        } catch {
            setError("Failed to update user. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Edit User</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.center}><span className={styles.spinner} /></div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate>
                            {error && <p className={styles.globalError}>{error}</p>}

                            {/* Row 1: Username + Full Name */}
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Username <span className={styles.req}>*</span></label>
                                    <input
                                        className={`${styles.input} ${fieldErr.username ? styles.inputError : ""}`}
                                        value={form.username}
                                        onChange={set("username")}
                                        placeholder="username"
                                    />
                                    {fieldErr.username && <span className={styles.errMsg}>{fieldErr.username}</span>}
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Full Name</label>
                                    <input
                                        className={styles.input}
                                        value={form.fullName}
                                        onChange={set("fullName")}
                                        placeholder="Full name"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Phone + Date of Birth */}
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Phone</label>
                                    <input
                                        className={styles.input}
                                        value={form.phone}
                                        onChange={set("phone")}
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Date of Birth</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={form.dateOfBirth}
                                        onChange={set("dateOfBirth")}
                                    />
                                </div>
                            </div>

                            {/* Row 3: Role + Status */}
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Role <span className={styles.req}>*</span></label>
                                    <select
                                        className={`${styles.input} ${fieldErr.roleCode ? styles.inputError : ""}`}
                                        value={form.roleCode}
                                        onChange={set("roleCode")}
                                    >
                                        {ROLE_OPTIONS.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                    {fieldErr.roleCode && <span className={styles.errMsg}>{fieldErr.roleCode}</span>}
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Status <span className={styles.req}>*</span></label>
                                    <select
                                        className={`${styles.input} ${fieldErr.status ? styles.inputError : ""}`}
                                        value={form.status}
                                        onChange={set("status")}
                                    >
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    {fieldErr.status && <span className={styles.errMsg}>{fieldErr.status}</span>}
                                </div>
                            </div>

                            {/* Address Detail */}
                            <div className={styles.field}>
                                <label className={styles.label}>Address</label>
                                <input
                                    className={styles.input}
                                    value={form.addressDetail}
                                    onChange={set("addressDetail")}
                                    placeholder="Street address"
                                />
                            </div>

                            {/* Row 4: City + District */}
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label className={styles.label}>City</label>
                                    <input
                                        className={styles.input}
                                        value={form.cityId}
                                        onChange={set("cityId")}
                                        placeholder="City"
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>District</label>
                                    <input
                                        className={styles.input}
                                        value={form.districtId}
                                        onChange={set("districtId")}
                                        placeholder="District"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className={styles.footer}>
                                <button type="button" className={styles.btnCancel} onClick={onClose} disabled={saving}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.btnSave} disabled={saving}>
                                    {saving ? <span className={styles.spinnerSm} /> : null}
                                    {saving ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

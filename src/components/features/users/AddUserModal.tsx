"use client";

import { useEffect, useRef, useState } from "react";
import { userService } from "@/libs/services/user.service";
import { adminService } from "@/libs/services/admin.service";
import { ProviderDTO } from "@/types/provider.type";
import { AgencyDTO } from "@/types/agency.type";
import styles from "./add-user-modal.module.scss";

// ── Role options (no Admin) ───────────────────────────────────────────────────
const ROLE_OPTIONS = [
    { label: "Customer", value: "CUSTOMER" },
    { label: "Provider", value: "PROVIDER" },
    { label: "Agency",   value: "AGENCY" },
];

// ── Form state ────────────────────────────────────────────────────────────────
interface Form {
    username:        string;
    email:           string;
    password:        string;
    confirmPassword: string;
    phone:           string;
    roleCode:        string;
    providerId:      string;
    agencyId:        string;
}

const INITIAL: Form = {
    username:        "",
    email:           "",
    password:        "",
    confirmPassword: "",
    phone:           "",
    roleCode:        "CUSTOMER",
    providerId:      "",
    agencyId:        "",
};

interface Props {
    open:      boolean;
    onClose:   () => void;
    onCreated: () => void;
}

export default function AddUserModal({ open, onClose, onCreated }: Props) {
    const [form, setForm]             = useState<Form>(INITIAL);
    const [errors, setErrors]         = useState<Partial<Form>>({});
    const [loading, setLoading]       = useState(false);
    const [submitErr, setSubmitErr]   = useState("");
    const [showPw, setShowPw]         = useState(false);
    const [providers, setProviders]   = useState<ProviderDTO[]>([]);
    const [agencies, setAgencies]     = useState<AgencyDTO[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const overlayRef                  = useRef<HTMLDivElement>(null);
    const firstInputRef               = useRef<HTMLInputElement>(null);

    // Reset on open
    useEffect(() => {
        if (open) {
            setForm(INITIAL);
            setErrors({});
            setSubmitErr("");
            setShowPw(false);
            setTimeout(() => firstInputRef.current?.focus(), 50);
        }
    }, [open]);

    // Escape to close
    useEffect(() => {
        if (!open) return;
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [open, onClose]);

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Fetch providers / agencies when their role is first selected
    useEffect(() => {
        if (!open) return;
        if (form.roleCode === "PROVIDER" && providers.length === 0) {
            setListLoading(true);
            adminService.getProviders()
                .then((res) => setProviders(res.data ?? []))
                .catch(() => setProviders([]))
                .finally(() => setListLoading(false));
        }
        if (form.roleCode === "AGENCY" && agencies.length === 0) {
            setListLoading(true);
            adminService.getAgencies()
                .then((res) => setAgencies(res.data ?? []))
                .catch(() => setAgencies([]))
                .finally(() => setListLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.roleCode, open]);

    const change = (field: keyof Form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        setErrors((err) => ({ ...err, [field]: undefined }));
        setSubmitErr("");
    };

    const validate = (): boolean => {
        const errs: Partial<Form> = {};
        if (!form.username.trim())   errs.username = "Username is required.";
        if (!form.email.trim())      errs.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address.";
        if (!form.password)          errs.password = "Password is required.";
        else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
        if (form.confirmPassword !== form.password) errs.confirmPassword = "Passwords do not match.";
        if (form.roleCode === "PROVIDER" && !form.providerId)
            errs.providerId = "Please select a provider.";
        if (form.roleCode === "AGENCY" && !form.agencyId)
            errs.agencyId = "Please select an agency.";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setSubmitErr("");
        try {
            await userService.createUser({
                username:   form.username.trim(),
                email:      form.email.trim(),
                password:   form.password,
                phone:      form.phone.trim() || undefined,
                roleCode:   form.roleCode,
                providerId: form.roleCode === "PROVIDER" ? form.providerId : undefined,
                agencyId:   form.roleCode === "AGENCY"   ? form.agencyId   : undefined,
            });
            onCreated();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { message?: string })?.message ?? "Failed to create user.";
            setSubmitErr(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const needsProvider = form.roleCode === "PROVIDER";
    const needsAgency   = form.roleCode === "AGENCY";

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="add-user-title">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h2 id="add-user-title" className={styles.title}>Add New User</h2>
                            <p className={styles.subtitle}>Create a new account with a specific role</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className={styles.body}>
                        {/* Username + Email */}
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Username <span className={styles.required}>*</span>
                                </label>
                                <input
                                    ref={firstInputRef}
                                    className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
                                    type="text"
                                    placeholder="e.g. john_doe"
                                    value={form.username}
                                    onChange={change("username")}
                                />
                                {errors.username && <span className={styles.errorMsg}>{errors.username}</span>}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Email <span className={styles.required}>*</span>
                                </label>
                                <input
                                    className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                                    type="email"
                                    placeholder="user@example.com"
                                    value={form.email}
                                    onChange={change("email")}
                                />
                                {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                            </div>
                        </div>

                        {/* Password + Confirm */}
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Password <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.passwordWrap}>
                                    <input
                                        className={`${styles.input} ${styles.inputFull} ${errors.password ? styles.inputError : ""}`}
                                        type={showPw ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        value={form.password}
                                        onChange={change("password")}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPw((v) => !v)}
                                        tabIndex={-1}
                                        aria-label={showPw ? "Hide password" : "Show password"}
                                    >
                                        {showPw ? (
                                            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Confirm Password <span className={styles.required}>*</span>
                                </label>
                                <input
                                    className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                                    type={showPw ? "text" : "password"}
                                    placeholder="Repeat password"
                                    value={form.confirmPassword}
                                    onChange={change("confirmPassword")}
                                />
                                {errors.confirmPassword && <span className={styles.errorMsg}>{errors.confirmPassword}</span>}
                            </div>
                        </div>

                        {/* Phone + Role */}
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Phone</label>
                                <input
                                    className={styles.input}
                                    type="tel"
                                    placeholder="e.g. 0901234567"
                                    value={form.phone}
                                    onChange={change("phone")}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Role <span className={styles.required}>*</span>
                                </label>
                                <select
                                    className={styles.select}
                                    value={form.roleCode}
                                    onChange={(e) => {
                                        setForm((f) => ({
                                            ...f,
                                            roleCode:   e.target.value,
                                            providerId: "",
                                            agencyId:   "",
                                        }));
                                        setErrors((err) => ({ ...err, roleCode: undefined, providerId: undefined, agencyId: undefined }));
                                        setSubmitErr("");
                                    }}
                                >
                                    {ROLE_OPTIONS.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Provider selector */}
                        {needsProvider && (
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ marginRight: 5, verticalAlign: "middle" }}>
                                        <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                        <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                    Provider <span className={styles.required}>*</span>
                                </label>
                                {listLoading ? (
                                    <div className={styles.listLoader}>Loading providers...</div>
                                ) : providers.length === 0 ? (
                                    <div className={styles.emptyList}>
                                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                        No providers available. Create a provider first.
                                    </div>
                                ) : (
                                    <select
                                        className={`${styles.select} ${errors.providerId ? styles.inputError : ""}`}
                                        value={form.providerId}
                                        onChange={change("providerId")}
                                    >
                                        <option value="">— Select a provider —</option>
                                        {providers.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.providerId && <span className={styles.errorMsg}>{errors.providerId}</span>}
                            </div>
                        )}

                        {/* Agency selector */}
                        {needsAgency && (
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ marginRight: 5, verticalAlign: "middle" }}>
                                        <path d="M3 21h18M3 10h18M9 21V10M15 21V10M3 10l9-7 9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Agency <span className={styles.required}>*</span>
                                </label>
                                {listLoading ? (
                                    <div className={styles.listLoader}>Loading agencies...</div>
                                ) : agencies.length === 0 ? (
                                    <div className={styles.emptyList}>
                                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                        No agencies available. Create an agency first.
                                    </div>
                                ) : (
                                    <select
                                        className={`${styles.select} ${errors.agencyId ? styles.inputError : ""}`}
                                        value={form.agencyId}
                                        onChange={change("agencyId")}
                                    >
                                        <option value="">— Select an agency —</option>
                                        {agencies.map((a) => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.agencyId && <span className={styles.errorMsg}>{errors.agencyId}</span>}
                            </div>
                        )}

                        {submitErr && (
                            <div className={styles.submitError}>
                                <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                {submitErr}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <button type="button" className={styles.btnCancel} onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.btnSubmit} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className={styles.spinner} />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    Create User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

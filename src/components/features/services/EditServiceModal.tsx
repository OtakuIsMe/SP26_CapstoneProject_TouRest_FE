"use client";

import { useEffect, useRef, useState } from "react";
import { providerService, UpdateServicePayload } from "@/libs/services/provider.service";
import { ServiceDTO } from "@/types/service.type";
import styles from "./add-service-modal.module.scss";

const STATUS_OPTIONS = ["Active", "Inactive", "Discontinued"] as const;

interface Form {
    name: string;
    description: string;
    price: string;
    basePrice: string;
    durationMinutes: string;
    status: string;
}

interface Props {
    service: ServiceDTO | null;
    onClose: () => void;
    onUpdated: () => void;
}

export default function EditServiceModal({ service, onClose, onUpdated }: Props) {
    const [form, setForm]         = useState<Form>({ name: "", description: "", price: "", basePrice: "", durationMinutes: "", status: "Active" });
    const [errors, setErrors]     = useState<Partial<Record<keyof Form, string>>>({});
    const [loading, setLoading]   = useState(false);
    const [submitErr, setSubmitErr] = useState("");
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (service) {
            setForm({
                name:            service.name,
                description:     service.description ?? "",
                price:           String(service.price),
                basePrice:       String(service.basePrice),
                durationMinutes: String(service.durationMinutes),
                status:          service.status ?? "Active",
            });
            setErrors({});
            setSubmitErr("");
        }
    }, [service]);

    useEffect(() => {
        if (!service) return;
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", h);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", h);
            document.body.style.overflow = "";
        };
    }, [service, onClose]);

    const change = (field: keyof Form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        setErrors((err) => ({ ...err, [field]: undefined }));
        setSubmitErr("");
    };

    const validate = (): boolean => {
        const errs: Partial<Record<keyof Form, string>> = {};
        if (!form.name.trim()) errs.name = "Service name is required.";
        const price = Number(form.price);
        if (!form.price || isNaN(price) || price < 0) errs.price = "Enter a valid price.";
        if (form.basePrice && (isNaN(Number(form.basePrice)) || Number(form.basePrice) < 0))
            errs.basePrice = "Enter a valid base price.";
        const dur = Number(form.durationMinutes);
        if (!form.durationMinutes || isNaN(dur) || dur <= 0 || !Number.isInteger(dur))
            errs.durationMinutes = "Enter a whole number of minutes (> 0).";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || !service) return;
        setLoading(true);
        setSubmitErr("");
        try {
            const payload: UpdateServicePayload = {
                name:            form.name.trim(),
                description:     form.description.trim() || undefined,
                price:           Math.round(Number(form.price)),
                basePrice:       form.basePrice ? Math.round(Number(form.basePrice)) : Math.round(Number(form.price)),
                durationMinutes: parseInt(form.durationMinutes, 10),
                status:          form.status,   // string e.g. "Active"
            };
            await providerService.updateService(service.id, payload);
            onUpdated();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { message?: string })?.message ?? "Failed to update service.";
            setSubmitErr(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!service) return null;

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={styles.modal} role="dialog" aria-modal="true">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className={styles.title}>Edit Service</h2>
                            <p className={styles.subtitle}>{service.name}</p>
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
                        {/* Service Name */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                Service Name <span className={styles.required}>*</span>
                            </label>
                            <input
                                className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                                type="text"
                                value={form.name}
                                onChange={change("name")}
                            />
                            {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                        </div>

                        {/* Description */}
                        <div className={styles.field}>
                            <label className={styles.label}>Description</label>
                            <textarea
                                className={styles.textarea}
                                value={form.description}
                                onChange={change("description")}
                                rows={3}
                            />
                        </div>

                        {/* Price row */}
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Price (đ) <span className={styles.required}>*</span>
                                </label>
                                <input
                                    className={`${styles.input} ${errors.price ? styles.inputError : ""}`}
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.price}
                                    onChange={change("price")}
                                />
                                {errors.price && <span className={styles.errorMsg}>{errors.price}</span>}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Base Price (đ)</label>
                                <input
                                    className={`${styles.input} ${errors.basePrice ? styles.inputError : ""}`}
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.basePrice}
                                    onChange={change("basePrice")}
                                />
                                {errors.basePrice && <span className={styles.errorMsg}>{errors.basePrice}</span>}
                            </div>
                        </div>

                        {/* Duration + Status */}
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Duration (min) <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputAddon}>
                                    <input
                                        className={`${styles.input} ${styles.inputWithAddonRight} ${errors.durationMinutes ? styles.inputError : ""}`}
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={form.durationMinutes}
                                        onChange={change("durationMinutes")}
                                    />
                                    <span className={styles.addonSuffix}>min</span>
                                </div>
                                {errors.durationMinutes && <span className={styles.errorMsg}>{errors.durationMinutes}</span>}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Status</label>
                                <select
                                    className={styles.select}
                                    value={form.status}
                                    onChange={change("status")}
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

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
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                        <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

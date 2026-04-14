"use client";

import { useEffect, useRef, useState } from "react";
import { providerService, ServiceStatus } from "@/libs/services/provider.service";
import styles from "./add-service-modal.module.scss";

const MAX_TAGS = 30;

interface AddServiceForm {
    name: string;
    description: string;
    price: string;
    basePrice: string;
    durationMinutes: string;
}

const INITIAL_FORM: AddServiceForm = {
    name: "",
    description: "",
    price: "",
    basePrice: "",
    durationMinutes: "",
};

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function AddServiceModal({ open, onClose, onCreated }: Props) {
    const [form, setForm]       = useState<AddServiceForm>(INITIAL_FORM);
    const [errors, setErrors]   = useState<Partial<AddServiceForm>>({});
    const [loading, setLoading] = useState(false);
    const [submitErr, setSubmitErr] = useState("");
    const [tags, setTags]       = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const overlayRef = useRef<HTMLDivElement>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);
    const tagInputRef = useRef<HTMLInputElement>(null);

    // Reset form when opened
    useEffect(() => {
        if (open) {
            setForm(INITIAL_FORM);
            setErrors({});
            setSubmitErr("");
            setTags([]);
            setTagInput("");
            setTimeout(() => firstInputRef.current?.focus(), 50);
        }
    }, [open]);

    function addTag(raw: string) {
        const value = raw.trim().toLowerCase();
        if (!value || tags.includes(value) || tags.length >= MAX_TAGS) return;
        setTags((prev) => [...prev, value]);
    }

    function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(tagInput);
            setTagInput("");
        } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
            setTags((prev) => prev.slice(0, -1));
        }
    }

    function handleTagBlur() {
        if (tagInput.trim()) {
            addTag(tagInput);
            setTagInput("");
        }
    }

    function removeTag(index: number) {
        setTags((prev) => prev.filter((_, i) => i !== index));
    }

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const change = (field: keyof AddServiceForm) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        setErrors((err) => ({ ...err, [field]: undefined }));
        setSubmitErr("");
    };

    const validate = (): boolean => {
        const errs: Partial<AddServiceForm> = {};
        if (!form.name.trim())              errs.name = "Service name is required.";
        const price = Number(form.price);
        if (!form.price || isNaN(price) || price < 0) errs.price = "Enter a valid price.";
        const bp = form.basePrice ? Number(form.basePrice) : null;
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
        if (!validate()) return;
        setLoading(true);
        setSubmitErr("");
        try {
            await providerService.createService({
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                price: Math.round(Number(form.price)),
                basePrice: form.basePrice ? Math.round(Number(form.basePrice)) : Math.round(Number(form.price)),
                durationMinutes: parseInt(form.durationMinutes, 10),
                status: ServiceStatus.Active,
            });
            onCreated();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { message?: string })?.message ?? "Failed to create service.";
            setSubmitErr(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className={styles.overlay}
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="add-service-title">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h2 id="add-service-title" className={styles.title}>Add New Service</h2>
                            <p className={styles.subtitle}>Fill in the details to create a new service</p>
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
                                ref={firstInputRef}
                                className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                                type="text"
                                placeholder="e.g. Full Body Massage"
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
                                placeholder="Brief description of the service (optional)"
                                value={form.description}
                                onChange={change("description")}
                                rows={3}
                            />
                        </div>

                        {/* Tags */}
                        <div className={styles.field}>
                            <div className={styles.tagLabelRow}>
                                <label className={styles.label}>Tags</label>
                                <span className={styles.tagCounter}>
                                    {tags.length}/{MAX_TAGS}
                                </span>
                            </div>
                            <div
                                className={styles.tagBox}
                                onClick={() => tagInputRef.current?.focus()}
                            >
                                {tags.map((tag, i) => (
                                    <span key={i} className={styles.tag}>
                                        {tag}
                                        <button
                                            type="button"
                                            className={styles.tagRemove}
                                            onClick={(e) => { e.stopPropagation(); removeTag(i); }}
                                            aria-label={`Remove ${tag}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                {tags.length < MAX_TAGS && (
                                    <input
                                        ref={tagInputRef}
                                        className={styles.tagInput}
                                        type="text"
                                        placeholder={tags.length === 0 ? "e.g. herbs, vegetables..." : ""}
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        onBlur={handleTagBlur}
                                    />
                                )}
                            </div>
                            <span className={styles.hint}>Press Enter or comma to add · Backspace to remove last</span>
                        </div>

                        {/* Price row */}
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Price ($) <span className={styles.required}>*</span>
                                </label>
                                <div className={styles.inputAddon}>
                                    <span className={styles.addonPrefix}>$</span>
                                    <input
                                        className={`${styles.input} ${styles.inputWithAddon} ${errors.price ? styles.inputError : ""}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.price}
                                        onChange={change("price")}
                                    />
                                </div>
                                {errors.price && <span className={styles.errorMsg}>{errors.price}</span>}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Base Price ($)</label>
                                <div className={styles.inputAddon}>
                                    <span className={styles.addonPrefix}>$</span>
                                    <input
                                        className={`${styles.input} ${styles.inputWithAddon} ${errors.basePrice ? styles.inputError : ""}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Original price"
                                        value={form.basePrice}
                                        onChange={change("basePrice")}
                                    />
                                </div>
                                {errors.basePrice && <span className={styles.errorMsg}>{errors.basePrice}</span>}
                                <span className={styles.hint}>Leave blank to use the price above</span>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                Duration (minutes) <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputAddon}>
                                <input
                                    className={`${styles.input} ${styles.inputWithAddonRight} ${errors.durationMinutes ? styles.inputError : ""}`}
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="60"
                                    value={form.durationMinutes}
                                    onChange={change("durationMinutes")}
                                />
                                <span className={styles.addonSuffix}>min</span>
                            </div>
                            {errors.durationMinutes && <span className={styles.errorMsg}>{errors.durationMinutes}</span>}
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    Create Service
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import DataTable, { ActionDef, ColumnDef } from "@/components/commons/data-table/DataTable";
import { adminService } from "@/libs/services/admin.service";
import { providerService } from "@/libs/services/provider.service";
import { VoucherCreateRequest, VoucherDTO, VoucherStatus } from "@/types/voucher.type";
import styles from "./page.module.scss";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");
const isExpired = (validTo: string) => new Date(validTo) < new Date();

function resolveStatus(v: VoucherDTO): VoucherStatus {
    if (v.status === "Active" && isExpired(v.validTo)) return "Expired";
    return v.status;
}

function generateCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const rand = Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    return `TOUR${rand}`;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDisplay = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDow    = (y: number, m: number) => new Date(y, m, 1).getDay();
const toIso = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
const cmpIso = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// popup position helper — flips up if not enough room below
function calcBelow(el: HTMLElement, popupH = 380): { top: number; left: number } {
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow >= popupH ? r.bottom + 4 : r.top - popupH - 4;
    const left = Math.min(r.left, window.innerWidth - 596);
    return { top, left };
}

// ── Status badges ─────────────────────────────────────────────────────────────
const STATUS_CLS: Record<VoucherStatus, string> = {
    Active:   styles.statusActive,
    Inactive: styles.statusInactive,
    Expired:  styles.statusExpired,
};
const STATUS_LABEL: Record<VoucherStatus, string> = {
    Active:   "Active",
    Inactive: "Inactive",
    Expired:  "Expired",
};

// ── Column definitions ────────────────────────────────────────────────────────
const columns: ColumnDef<VoucherDTO>[] = [
    {
        key: "code", label: "Code", sortable: true,
        render: (row) => <span className={styles.codeTag}>{row.code}</span>,
    },
    {
        key: "name", label: "Name", sortable: true,
        render: (row) => (
            <div className={styles.nameCell}>
                <span className={styles.nameText}>{row.name}</span>
                {row.description && <span className={styles.nameDesc}>{row.description}</span>}
            </div>
        ),
    },
    {
        key: "discountValue", label: "Discount",
        render: (row) => <span className={styles.discountBadge}>{row.discountValue}%</span>,
    },
    {
        key: "applicableType", label: "Applies To",
        render: (row) => {
            const label = { All: "All", Service: "Service", Package: "Package" }[row.applicableType] ?? row.applicableType;
            return <span className={styles.typeBadge}>{label}</span>;
        },
    },
    {
        key: "usedCount", label: "Used",
        render: (row) => (
            <span>{row.usedCount}{row.usageLimit != null && <span className={styles.limit}> / {row.usageLimit}</span>}</span>
        ),
    },
    {
        key: "validFrom", label: "Valid Period",
        render: (row) => (
            <span className={styles.dateRange}>{fmtDate(row.validFrom)} – {fmtDate(row.validTo)}</span>
        ),
    },
    {
        key: "status", label: "Status",
        render: (row) => {
            const st = resolveStatus(row);
            return <span className={`${styles.badge} ${STATUS_CLS[st]}`}>{STATUS_LABEL[st]}</span>;
        },
    },
];

// ── CalendarMonth ─────────────────────────────────────────────────────────────
const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function CalendarMonth({ year, month, from, to, hover, onDay, onHover }: {
    year: number; month: number;
    from: string; to: string; hover: string;
    onDay: (iso: string) => void;
    onHover: (iso: string) => void;
}) {
    const days = daysInMonth(year, month);
    const start = firstDow(year, month);
    const cells: (number | null)[] = Array(start).fill(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className={styles.calMonth}>
            <div className={styles.calMonthLabel}>{MONTHS[month]} {year}</div>
            <div className={styles.calGrid}>
                {DOW.map(d => <div key={d} className={styles.calDowCell}>{d}</div>)}
                {cells.map((d, i) => {
                    if (d === null) return <div key={`e${i}`} />;
                    const iso  = toIso(year, month, d);
                    const hi   = hover || to;
                    const inRange  = !!(from && hi && cmpIso(iso, from) >= 0 && cmpIso(iso, hi) <= 0);
                    const isStart  = iso === from;
                    const isEnd    = !!(iso === (to || hover) && (to || hover));
                    const isToday  = iso === today && !isStart && !isEnd;
                    return (
                        <div
                            key={iso}
                            className={[
                                styles.calDay,
                                isStart ? styles.calDayStart : "",
                                isEnd   ? styles.calDayEnd   : "",
                                inRange && !isStart && !isEnd ? styles.calDayRange : "",
                                isToday ? styles.calDayToday : "",
                            ].join(" ").trim()}
                            onClick={() => onDay(iso)}
                            onMouseEnter={() => onHover(iso)}
                        >{d}</div>
                    );
                })}
            </div>
        </div>
    );
}

// ── DateRangePicker ───────────────────────────────────────────────────────────
function DateRangePicker({ from, to, onChange }: {
    from: string; to: string;
    onChange: (from: string, to: string) => void;
}) {
    const [open, setOpen]       = useState(false);
    const [hover, setHover]     = useState("");
    const [picking, setPicking] = useState<"start" | "end">("start");
    const [pos, setPos]         = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const today = new Date();
    const [lYear, setLYear]   = useState(today.getFullYear());
    const [lMonth, setLMonth] = useState(today.getMonth());
    const rYear  = lMonth === 11 ? lYear + 1 : lYear;
    const rMonth = lMonth === 11 ? 0 : lMonth + 1;

    useEffect(() => setMounted(true), []);

    // close on outside click
    useEffect(() => {
        if (!open) return;
        const handle = (e: MouseEvent) => {
            const popup = document.getElementById("drp-popup");
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                popup && !popup.contains(e.target as Node)
            ) setOpen(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    const handleOpen = () => {
        if (triggerRef.current) setPos(calcBelow(triggerRef.current, 390));
        setOpen(o => !o);
        setPicking("start");
        setHover("");
    };

    const prevMonth = () => { if (lMonth === 0) { setLYear(y => y - 1); setLMonth(11); } else setLMonth(m => m - 1); };
    const nextMonth = () => { if (lMonth === 11) { setLYear(y => y + 1); setLMonth(0); } else setLMonth(m => m + 1); };

    const handleDay = (iso: string) => {
        if (picking === "start") {
            onChange(iso, "");
            setPicking("end");
        } else {
            if (cmpIso(iso, from) < 0) { onChange(iso, from); }
            else { onChange(from, iso); }
            setPicking("start");
            setOpen(false);
            setHover("");
        }
    };

    const displayFrom = from ? fmtDisplay(from) : "—";
    const displayTo   = to   ? fmtDisplay(to)   : "—";

    return (
        <div className={styles.drpWrap}>
            <button type="button" className={styles.drpTrigger} ref={triggerRef} onClick={handleOpen}>
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={styles.drpIcon}>
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
                <span className={styles.drpFromLabel}>{displayFrom}</span>
                <svg viewBox="0 0 24 24" fill="none" width="12" height="12" className={styles.drpArrow}>
                    <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={styles.drpToLabel}>{displayTo}</span>
                {picking === "end" && open && <span className={styles.drpHint}>select end date</span>}
            </button>

            {mounted && open && createPortal(
                <div
                    id="drp-popup"
                    className={styles.drpPopup}
                    style={{ top: pos.top, left: pos.left }}
                    onMouseLeave={() => setHover("")}
                >
                    <div className={styles.drpNav}>
                        <button type="button" className={styles.drpNavBtn} onClick={prevMonth}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                        <button type="button" className={styles.drpNavBtn} onClick={nextMonth}>
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>
                    <div className={styles.drpMonths}>
                        <CalendarMonth year={lYear} month={lMonth} from={from} to={to} hover={hover}
                            onDay={handleDay} onHover={setHover} />
                        <CalendarMonth year={rYear} month={rMonth} from={from} to={to} hover={hover}
                            onDay={handleDay} onHover={setHover} />
                    </div>
                    <div className={styles.drpFooter}>
                        <span className={styles.drpStatus}>
                            {picking === "start" ? "Select start date" : "Select end date"}
                        </span>
                        <button type="button" className={styles.drpClear}
                            onClick={() => { onChange("", ""); setPicking("start"); setOpen(false); }}>
                            Clear
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// ── ApplicableSearch ──────────────────────────────────────────────────────────
function ApplicableSearch({ type, valueId, onChange }: {
    type: "Service" | "Package";
    valueId: string | undefined;
    onChange: (id: string) => void;
}) {
    const [query, setQuery]         = useState("");
    const [selectedLabel, setLabel] = useState("");
    const [results, setResults]     = useState<{ id: string; label: string; sub: string }[]>([]);
    const [open, setOpen]           = useState(false);
    const [loading, setLoading]     = useState(false);
    const [pos, setPos]             = useState({ top: 0, left: 0, width: 300 });
    const [mounted, setMounted]     = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => setMounted(true), []);

    // fetch existing label when editing
    useEffect(() => {
        if (!valueId) { setLabel(""); return; }
        (async () => {
            try {
                if (type === "Service") {
                    const res = await providerService.getServiceById(valueId);
                    setLabel(res.data?.name ?? valueId.slice(0, 12) + "…");
                } else {
                    const res = await providerService.getPackageById(valueId);
                    setLabel(res.data?.name ?? valueId.slice(0, 12) + "…");
                }
            } catch {
                setLabel(valueId.slice(0, 12) + "…");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueId, type]);

    // debounced search
    useEffect(() => {
        if (!query.trim()) { setResults([]); setOpen(false); return; }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                if (type === "Service") {
                    const res = await providerService.getServices({ search: query, pageSize: 8 });
                    setResults((res.data ?? []).map(s => ({ id: s.id, label: s.name, sub: s.providerName })));
                } else {
                    const res = await providerService.getPackages({ search: query, pageSize: 8 });
                    setResults((res.data ?? []).map(p => ({ id: p.id, label: p.name, sub: p.code })));
                }
                if (inputRef.current) {
                    const r = inputRef.current.getBoundingClientRect();
                    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
                }
                setOpen(true);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query, type]);

    // close dropdown on outside click
    useEffect(() => {
        if (!open) return;
        const handle = (e: MouseEvent) => {
            const drop = document.getElementById("applicable-drop");
            if (inputRef.current && !inputRef.current.contains(e.target as Node) &&
                drop && !drop.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    const handleSelect = (id: string, label: string) => {
        onChange(id);
        setLabel(label);
        setQuery("");
        setOpen(false);
    };

    const handleClear = () => { onChange(""); setLabel(""); setQuery(""); };

    const placeholder = type === "Service" ? "Search services..." : "Search packages...";

    if (selectedLabel) {
        return (
            <div className={styles.selectedTag}>
                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                    <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={styles.selectedTagText}>{selectedLabel}</span>
                <button type="button" className={styles.selectedTagRemove} onClick={handleClear} title="Remove selection">×</button>
            </div>
        );
    }

    return (
        <div className={styles.searchWrap}>
            <div className={styles.searchInputWrap}>
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={styles.searchIcon}>
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                    ref={inputRef}
                    className={styles.searchInput}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={placeholder}
                    autoComplete="off"
                />
                {loading && <span className={styles.searchSpinner} />}
            </div>

            {mounted && open && results.length > 0 && createPortal(
                <div
                    id="applicable-drop"
                    className={styles.searchDropdown}
                    style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 260) }}
                >
                    {results.map(r => (
                        <div key={r.id} className={styles.searchDropItem}
                            onMouseDown={() => handleSelect(r.id, r.label)}>
                            <span className={styles.searchDropLabel}>{r.label}</span>
                            <span className={styles.searchDropSub}>{r.sub}</span>
                        </div>
                    ))}
                </div>,
                document.body
            )}

            {mounted && open && results.length === 0 && !loading && query.trim() && createPortal(
                <div
                    id="applicable-drop"
                    className={styles.searchDropdown}
                    style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 260) }}
                >
                    <div className={styles.searchDropEmpty}>No results found</div>
                </div>,
                document.body
            )}
        </div>
    );
}

// ── Form default ──────────────────────────────────────────────────────────────
const emptyForm = (): VoucherCreateRequest => ({
    code: generateCode(),
    name: "",
    description: "",
    discountType: "Percent",
    discountValue: 10,
    maxDiscountAmount: undefined,
    minOrderAmount: undefined,
    applicableType: "All",
    applicableId: undefined,
    usageLimit: undefined,
    validFrom: new Date().toISOString().slice(0, 10),
    validTo:   new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
    status: "Active",
});

// ── VoucherModal ──────────────────────────────────────────────────────────────
function VoucherModal({ initial, isEdit, onSave, onClose, saving, error }: {
    initial: VoucherCreateRequest;
    isEdit: boolean;
    onSave: (f: VoucherCreateRequest) => void;
    onClose: () => void;
    saving: boolean;
    error?: string | null;
}) {
    const [form, setForm] = useState<VoucherCreateRequest>(initial);
    const overlayRef = useRef<HTMLDivElement>(null);

    const set = <K extends keyof VoucherCreateRequest>(k: K, v: VoucherCreateRequest[K]) =>
        setForm(f => ({ ...f, [k]: v }));

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...form, discountType: "Percent", status: isEdit ? form.status : "Active" });
    };

    // reset applicableId when type changes
    const handleTypeChange = (t: "All" | "Service" | "Package") => {
        setForm(f => ({ ...f, applicableType: t, applicableId: undefined }));
    };

    return (
        <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{isEdit ? "Edit Voucher" : "Create Voucher"}</h2>
                    <button className={styles.modalClose} onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    {error && (
                        <div className={styles.modalError}>
                            <svg viewBox="0 0 24 24" fill="none" width="15" height="15" style={{ flexShrink: 0 }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Code + Name */}
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Voucher Code *</label>
                            <div className={styles.codeInputWrap}>
                                <input
                                    className={styles.formInputCode}
                                    value={form.code}
                                    onChange={e => set("code", e.target.value.toUpperCase())}
                                    maxLength={100}
                                    required
                                />
                                {!isEdit && (
                                    <button type="button" className={styles.regenBtn} title="Generate new code"
                                        onClick={() => set("code", generateCode())}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                            <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Voucher Name *</label>
                            <input className={styles.formInput} value={form.name}
                                onChange={e => set("name", e.target.value)}
                                placeholder="Display name" maxLength={255} required />
                        </div>
                    </div>

                    {/* Description */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Description</label>
                        <textarea className={styles.formTextarea}
                            value={form.description ?? ""}
                            onChange={e => set("description", e.target.value || undefined)}
                            placeholder="Short description..."
                            rows={2} maxLength={500} />
                    </div>

                    {/* Discount % + Max discount */}
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Discount Value * (0 – 100%)</label>
                            <div className={styles.percentInputWrap}>
                                <input className={styles.formInputPercent} type="number" min={0} max={100}
                                    value={form.discountValue}
                                    onChange={e => set("discountValue", Math.min(100, Math.max(0, Number(e.target.value))))}
                                    required />
                                <span className={styles.percentSuffix}>%</span>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Max Discount (₫)</label>
                            <input className={styles.formInput} type="number" min={1}
                                value={form.maxDiscountAmount ?? ""}
                                onChange={e => set("maxDiscountAmount", e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="No limit" />
                        </div>
                    </div>

                    {/* Min order + Usage limit */}
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Min Order Amount (₫)</label>
                            <input className={styles.formInput} type="number" min={1}
                                value={form.minOrderAmount ?? ""}
                                onChange={e => set("minOrderAmount", e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="No requirement" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Usage Limit</label>
                            <input className={styles.formInput} type="number" min={1}
                                value={form.usageLimit ?? ""}
                                onChange={e => set("usageLimit", e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Unlimited" />
                        </div>
                    </div>

                    {/* Applicable type + search */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Applies To *</label>
                        <select className={styles.formSelect} value={form.applicableType}
                            onChange={e => handleTypeChange(e.target.value as "All" | "Service" | "Package")}>
                            <option value="All">All</option>
                            <option value="Service">Specific Service</option>
                            <option value="Package">Specific Package</option>
                        </select>
                    </div>

                    {form.applicableType !== "All" && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                {form.applicableType === "Service" ? "Select Service *" : "Select Package *"}
                            </label>
                            <ApplicableSearch
                                type={form.applicableType}
                                valueId={form.applicableId}
                                onChange={id => set("applicableId", id || undefined)}
                            />
                            {!form.applicableId && (
                                <span className={styles.formHint}>
                                    {form.applicableType === "Service"
                                        ? "A service must be selected"
                                        : "A package must be selected"}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Status — edit only */}
                    {isEdit && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Status *</label>
                            <select className={styles.formSelect} value={form.status}
                                onChange={e => set("status", e.target.value as VoucherStatus)}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    )}

                    {/* Date range */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Valid Period *</label>
                        <DateRangePicker
                            from={form.validFrom} to={form.validTo}
                            onChange={(f, t) => setForm(prev => ({ ...prev, validFrom: f, validTo: t }))}
                        />
                        {(!form.validFrom || !form.validTo) && (
                            <span className={styles.formHint}>Select a start and end date</span>
                        )}
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.btnCancel} onClick={onClose} disabled={saving}>Cancel</button>
                        <button
                            type="submit"
                            className={styles.btnSave}
                            disabled={
                                saving ||
                                !form.validFrom || !form.validTo ||
                                (form.applicableType !== "All" && !form.applicableId)
                            }
                        >
                            {saving ? "Saving..." : isEdit ? "Update" : "Create Voucher"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminVouchersPage() {
    const [vouchers, setVouchers] = useState<VoucherDTO[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [modalOpen, setModalOpen]   = useState(false);
    const [editTarget, setEditTarget] = useState<VoucherDTO | null>(null);
    const [saving, setSaving]         = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchVouchers = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await adminService.getVouchers();
            setVouchers(res.data ?? []);
        } catch { setError("Failed to load vouchers."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

    const openCreate = () => { setEditTarget(null); setModalError(null); setModalOpen(true); };
    const openEdit   = (v: VoucherDTO) => { setEditTarget(v); setModalError(null); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditTarget(null); setModalError(null); };

    const handleSave = async (form: VoucherCreateRequest) => {
        setSaving(true); setModalError(null);
        try {
            if (editTarget) {
                const res = await adminService.updateVoucher(editTarget.id, form);
                setVouchers(prev => prev.map(v => v.id === editTarget.id ? res.data : v));
            } else {
                const res = await adminService.createVoucher(form);
                setVouchers(prev => [res.data, ...prev]);
            }
            closeModal();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setModalError(msg ?? "Something went wrong. Please try again.");
        } finally { setSaving(false); }
    };

    const handleDelete = async (row: VoucherDTO) => {
        if (!confirm(`Delete voucher "${row.code}"?\nThis action cannot be undone.`)) return;
        try {
            await adminService.deleteVoucher(row.id);
            setVouchers(prev => prev.filter(v => v.id !== row.id));
        } catch { alert("Failed to delete voucher. Please try again."); }
    };

    const actions: ActionDef<VoucherDTO>[] = [
        { label: "Edit",   variant: "edit",   onClick: openEdit },
        { label: "Delete", variant: "delete", onClick: handleDelete },
    ];

    const active  = vouchers.filter(v => resolveStatus(v) === "Active").length;
    const expired = vouchers.filter(v => resolveStatus(v) === "Expired").length;
    const used    = vouchers.reduce((s, v) => s + v.usedCount, 0);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Vouchers</h1>
                    <p className={styles.subtitle}>Manage discount codes for the platform</p>
                </div>
                <button className={styles.btnAdd} onClick={openCreate}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Create Voucher
                </button>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}><span className={styles.statNum}>{vouchers.length}</span><span className={styles.statLabel}>Total</span></div>
                <div className={styles.statCard}><span className={`${styles.statNum} ${styles.statNumGreen}`}>{active}</span><span className={styles.statLabel}>Active</span></div>
                <div className={styles.statCard}><span className={`${styles.statNum} ${styles.statNumGray}`}>{expired}</span><span className={styles.statLabel}>Expired</span></div>
                <div className={styles.statCard}><span className={`${styles.statNum} ${styles.statNumBlue}`}>{used}</span><span className={styles.statLabel}>Total Uses</span></div>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <DataTable<VoucherDTO>
                columns={columns} data={vouchers} actions={actions}
                searchPlaceholder="Search by code or name..."
                searchKeys={["code", "name"] as (keyof VoucherDTO)[]}
                loading={loading} selectable exportable emptyText="No vouchers found."
            />

            {modalOpen && (
                <VoucherModal
                    isEdit={!!editTarget}
                    error={modalError}
                    initial={editTarget ? {
                        code: editTarget.code, name: editTarget.name,
                        description: editTarget.description,
                        discountType: editTarget.discountType,
                        discountValue: editTarget.discountValue,
                        maxDiscountAmount: editTarget.maxDiscountAmount,
                        minOrderAmount: editTarget.minOrderAmount,
                        applicableType: editTarget.applicableType,
                        applicableId: editTarget.applicableId,
                        usageLimit: editTarget.usageLimit,
                        validFrom: editTarget.validFrom.slice(0, 10),
                        validTo:   editTarget.validTo.slice(0, 10),
                        status: editTarget.status,
                    } : emptyForm()}
                    onSave={handleSave} onClose={closeModal} saving={saving}
                />
            )}
        </div>
    );
}

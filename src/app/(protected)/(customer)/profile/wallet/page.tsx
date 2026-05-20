"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import styles from "./page.module.scss";

// ── Types ─────────────────────────────────────────────────────────────────────
type TxType    = "refund" | "cashback" | "withdrawal" | "deposit";
type TxStatus  = "completed" | "pending" | "failed";
type Step      = 1 | 2 | 3 | 4;

interface BankAccount {
    id: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    holderName: string;
    isPrimary?: boolean;
}

interface Transaction {
    id: string;
    type: TxType;
    amount: number;
    date: string;
    description: string;
    reference: string;
    status: TxStatus;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const WALLET = {
    available:      2_450_000,
    pending:          800_000,
    totalDeposited: 14_200_000,
    totalWithdrawn: 11_750_000,
};

const SAVED_BANKS: BankAccount[] = [
    { id: "b1", bankName: "MB Bank",     bankCode: "MB",  accountNumber: "0901234488823", holderName: "NGUYEN VAN A", isPrimary: true  },
    { id: "b2", bankName: "Vietcombank", bankCode: "VCB", accountNumber: "1014564294417", holderName: "NGUYEN VAN A", isPrimary: false },
];

const TRANSACTIONS: Transaction[] = [
    { id: "t1", type: "refund",     amount:  1_200_000, date: "18/05/2026", description: "Hoàn tiền đặt tour bị huỷ",             reference: "BK-20240415-A3F7", status: "completed" },
    { id: "t2", type: "withdrawal", amount: -800_000,   date: "15/05/2026", description: "Rút tiền về MB Bank ****8823",           reference: "WD-20240515-B2C1", status: "completed" },
    { id: "t3", type: "cashback",   amount:  250_000,   date: "10/05/2026", description: "Cashback giới thiệu bạn bè",            reference: "CB-20240510-E4F3", status: "completed" },
    { id: "t4", type: "refund",     amount:  800_000,   date: "08/05/2026", description: "Hoàn tiền một phần — Sapa Trek",       reference: "BK-20240301-B7D2", status: "pending"   },
    { id: "t5", type: "withdrawal", amount: -2_400_000, date: "22/04/2026", description: "Rút tiền về Vietcombank ****4417",      reference: "WD-20240422-G5H8", status: "completed" },
    { id: "t6", type: "deposit",    amount:  3_000_000, date: "10/04/2026", description: "Thưởng hoàn thành tour cao điểm",      reference: "DP-20240410-K9L2", status: "completed" },
    { id: "t7", type: "refund",     amount:  500_000,   date: "02/04/2026", description: "Hoàn phí dịch vụ chênh lệch",         reference: "BK-20240320-F1G9", status: "completed" },
    { id: "t8", type: "withdrawal", amount: -5_000_000, date: "18/03/2026", description: "Rút tiền về MB Bank ****8823",         reference: "WD-20240318-H3I4", status: "failed"    },
];

const QUICK_AMOUNTS = [200_000, 500_000, 1_000_000, 2_000_000];

const BANK_OPTIONS = [
    "MB Bank", "Vietcombank", "Techcombank", "BIDV",
    "Agribank", "VPBank", "Sacombank", "ACB",
    "TPBank", "OCB", "SHB", "VIB",
];

const BANK_CODE: Record<string, string> = {
    "MB Bank": "MB", "Vietcombank": "VCB", "Techcombank": "TCB",
    "BIDV": "BIDV", "Agribank": "AGRI", "VPBank": "VPB",
    "Sacombank": "STB", "ACB": "ACB", "TPBank": "TPB",
    "OCB": "OCB", "SHB": "SHB", "VIB": "VIB",
};

const WITHDRAWAL_FEE = 0;
const MIN_WITHDRAW   = 50_000;

// ── Helpers ───────────────────────────────────────────────────────────────────
function vnd(n: number) {
    return Math.abs(n).toLocaleString("vi-VN") + "đ";
}

function maskAccount(num: string) {
    return num.length > 8 ? num.slice(0, 4) + " **** " + num.slice(-4) : num;
}

const TX_CFG: Record<TxType, { label: string; color: string; bg: string; sign: "+" | "-" }> = {
    refund:     { label: "Hoàn tiền",   color: "#15803d", bg: "#dcfce7", sign: "+" },
    cashback:   { label: "Cashback",    color: "#0369a1", bg: "#e0f2fe", sign: "+" },
    deposit:    { label: "Nạp tiền",    color: "#7c3aed", bg: "#ede9fe", sign: "+" },
    withdrawal: { label: "Rút tiền",    color: "#b91c1c", bg: "#fee2e2", sign: "-" },
};

const ST_CFG: Record<TxStatus, { label: string; color: string; bg: string }> = {
    completed: { label: "Hoàn thành", color: "#15803d", bg: "#dcfce7" },
    pending:   { label: "Đang xử lý", color: "#92400e", bg: "#fef3c7" },
    failed:    { label: "Thất bại",   color: "#b91c1c", bg: "#fee2e2" },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WalletPage() {
    const [step, setStep]               = useState<Step>(1);
    const [amount, setAmount]           = useState("");
    const [amountErr, setAmountErr]     = useState("");
    const [selectedBank, setSelectedBank] = useState<string>(SAVED_BANKS[0].id);
    const [addNew, setAddNew]           = useState(false);
    const [processing, setProcessing]   = useState(false);
    const [txFilter, setTxFilter]       = useState<"all" | TxType>("all");
    const [newBank, setNewBank] = useState({
        bankName: "", accountNumber: "", holderName: "",
    });
    const amountRef = useRef<HTMLInputElement>(null);

    const numAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
    const netAmount = numAmount - WITHDRAWAL_FEE;
    const selectedBankObj = SAVED_BANKS.find(b => b.id === selectedBank);

    useEffect(() => {
        if (step === 1) { setAmountErr(""); }
    }, [step]);

    function handleAmountInput(raw: string) {
        const digits = raw.replace(/\D/g, "");
        setAmount(digits ? parseInt(digits, 10).toLocaleString("vi-VN") : "");
        setAmountErr("");
    }

    function handleQuickAmount(v: number) {
        setAmount(v.toLocaleString("vi-VN"));
        setAmountErr("");
    }

    function validateStep1(): boolean {
        if (!numAmount || numAmount < MIN_WITHDRAW) {
            setAmountErr(`Số tiền tối thiểu là ${vnd(MIN_WITHDRAW)}`);
            amountRef.current?.focus();
            return false;
        }
        if (numAmount > WALLET.available) {
            setAmountErr("Số tiền vượt quá số dư khả dụng");
            return false;
        }
        return true;
    }

    async function handleConfirm() {
        setProcessing(true);
        await new Promise(r => setTimeout(r, 2000));
        setProcessing(false);
        setStep(4);
    }

    function resetFlow() {
        setStep(1);
        setAmount("");
        setAmountErr("");
        setSelectedBank(SAVED_BANKS[0].id);
        setAddNew(false);
        setNewBank({ bankName: "", accountNumber: "", holderName: "" });
    }

    const filteredTx = TRANSACTIONS.filter(t => txFilter === "all" || t.type === txFilter);

    return (
        <>
            <Header variant="solid" />
            <div className={styles.page}>
                <div className={styles.container}>

                    {/* Breadcrumb */}
                    <nav className={styles.breadcrumb}>
                        <Link href="/">Trang chủ</Link>
                        <span>/</span>
                        <Link href="/profile">Hồ sơ</Link>
                        <span>/</span>
                        <span>Ví & Rút tiền</span>
                    </nav>

                    {/* ── Balance hero ── */}
                    <div className={styles.hero}>
                        <div className={styles.heroGlow} />
                        <div className={styles.heroLeft}>
                            <p className={styles.heroLabel}>Số dư khả dụng</p>
                            <p className={styles.heroBalance}>{vnd(WALLET.available)}</p>
                            <div className={styles.heroPending}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                Đang chờ xử lý: <strong>{vnd(WALLET.pending)}</strong>
                            </div>
                        </div>
                        <div className={styles.heroStats}>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatLabel}>Tổng đã nạp</span>
                                <span className={styles.heroStatVal} style={{ color: "#4ade80" }}>{vnd(WALLET.totalDeposited)}</span>
                            </div>
                            <div className={styles.heroStatDivider}/>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatLabel}>Tổng đã rút</span>
                                <span className={styles.heroStatVal} style={{ color: "#fca5a5" }}>{vnd(WALLET.totalWithdrawn)}</span>
                            </div>
                            <div className={styles.heroStatDivider}/>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatLabel}>Số giao dịch</span>
                                <span className={styles.heroStatVal}>{TRANSACTIONS.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Main grid ── */}
                    <div className={styles.grid}>

                        {/* ── Left: Withdraw card ── */}
                        <div className={styles.withdrawCard}>
                            {/* Step indicator */}
                            <div className={styles.steps}>
                                {([
                                    { n: 1, label: "Số tiền"  },
                                    { n: 2, label: "Tài khoản"},
                                    { n: 3, label: "Xác nhận" },
                                ] as const).map((s, i) => (
                                    <div key={s.n} className={styles.stepItem}>
                                        <div className={`${styles.stepCircle}
                                            ${step === s.n ? styles.stepActive : ""}
                                            ${(step > s.n || step === 4) ? styles.stepDone : ""}`}
                                        >
                                            {(step > s.n || step === 4)
                                                ? <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                                : s.n
                                            }
                                        </div>
                                        <span className={`${styles.stepLabel} ${step === s.n ? styles.stepLabelActive : ""}`}>{s.label}</span>
                                        {i < 2 && <div className={`${styles.stepLine} ${(step > s.n || step === 4) ? styles.stepLineDone : ""}`}/>}
                                    </div>
                                ))}
                            </div>

                            {/* ══ STEP 1: Amount ══ */}
                            {step === 1 && (
                                <div className={styles.stepBody}>
                                    <h2 className={styles.stepTitle}>Nhập số tiền muốn rút</h2>
                                    <p className={styles.stepSub}>Số dư khả dụng: <strong>{vnd(WALLET.available)}</strong></p>

                                    {/* Amount input */}
                                    <div className={`${styles.amountWrap} ${amountErr ? styles.amountWrapError : ""}`}>
                                        <span className={styles.amountCurrency}>₫</span>
                                        <input
                                            ref={amountRef}
                                            className={styles.amountInput}
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={amount}
                                            onChange={e => handleAmountInput(e.target.value)}
                                        />
                                        {amount && (
                                            <button className={styles.amountClear} onClick={() => { setAmount(""); setAmountErr(""); }}>
                                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    {amountErr && <p className={styles.amountErr}>{amountErr}</p>}

                                    {/* Quick amounts */}
                                    <div className={styles.quickRow}>
                                        {QUICK_AMOUNTS.map(v => (
                                            <button
                                                key={v}
                                                className={`${styles.quickBtn} ${numAmount === v ? styles.quickBtnActive : ""}`}
                                                onClick={() => handleQuickAmount(v)}
                                            >
                                                {vnd(v)}
                                            </button>
                                        ))}
                                        <button
                                            className={`${styles.quickBtn} ${numAmount === WALLET.available ? styles.quickBtnActive : ""}`}
                                            onClick={() => handleQuickAmount(WALLET.available)}
                                        >
                                            Tất cả
                                        </button>
                                    </div>

                                    {/* Fee info */}
                                    <div className={styles.feeBox}>
                                        <div className={styles.feeRow}>
                                            <span>Số tiền rút</span>
                                            <span>{numAmount ? vnd(numAmount) : "—"}</span>
                                        </div>
                                        <div className={styles.feeRow}>
                                            <span>Phí giao dịch</span>
                                            <span style={{ color: "#16a34a" }}>Miễn phí</span>
                                        </div>
                                        <div className={styles.feeDivider}/>
                                        <div className={`${styles.feeRow} ${styles.feeTotal}`}>
                                            <span>Thực nhận</span>
                                            <strong style={{ color: "#4f46e5" }}>{numAmount ? vnd(numAmount) : "—"}</strong>
                                        </div>
                                    </div>

                                    <button
                                        className={styles.nextBtn}
                                        onClick={() => validateStep1() && setStep(2)}
                                        disabled={!numAmount}
                                    >
                                        Tiếp theo
                                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </button>
                                </div>
                            )}

                            {/* ══ STEP 2: Bank account ══ */}
                            {step === 2 && (
                                <div className={styles.stepBody}>
                                    <h2 className={styles.stepTitle}>Chọn tài khoản ngân hàng</h2>
                                    <p className={styles.stepSub}>Chuyển <strong>{vnd(numAmount)}</strong> về tài khoản sau</p>

                                    {/* Saved accounts */}
                                    <div className={styles.bankList}>
                                        {SAVED_BANKS.map(b => (
                                            <label
                                                key={b.id}
                                                className={`${styles.bankItem} ${selectedBank === b.id && !addNew ? styles.bankItemSelected : ""}`}
                                                onClick={() => { setSelectedBank(b.id); setAddNew(false); }}
                                            >
                                                <div className={styles.bankRadio}>
                                                    <div className={`${styles.radioOuter} ${selectedBank === b.id && !addNew ? styles.radioChecked : ""}`}>
                                                        {selectedBank === b.id && !addNew && <div className={styles.radioDot}/>}
                                                    </div>
                                                </div>
                                                <div className={styles.bankLogo}>{b.bankCode}</div>
                                                <div className={styles.bankInfo}>
                                                    <div className={styles.bankName}>
                                                        {b.bankName}
                                                        {b.isPrimary && <span className={styles.primaryBadge}>Mặc định</span>}
                                                    </div>
                                                    <div className={styles.bankNum}>{maskAccount(b.accountNumber)}</div>
                                                    <div className={styles.bankHolder}>{b.holderName}</div>
                                                </div>
                                            </label>
                                        ))}

                                        {/* Add new account option */}
                                        <label
                                            className={`${styles.bankItem} ${addNew ? styles.bankItemSelected : ""} ${styles.bankItemAdd}`}
                                            onClick={() => setAddNew(true)}
                                        >
                                            <div className={styles.bankRadio}>
                                                <div className={`${styles.radioOuter} ${addNew ? styles.radioChecked : ""}`}>
                                                    {addNew && <div className={styles.radioDot}/>}
                                                </div>
                                            </div>
                                            <div className={styles.bankAddIcon}>
                                                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                </svg>
                                            </div>
                                            <span className={styles.bankAddLabel}>Thêm tài khoản mới</span>
                                        </label>
                                    </div>

                                    {/* New bank form */}
                                    {addNew && (
                                        <div className={styles.newBankForm}>
                                            <div className={styles.formField}>
                                                <label className={styles.fieldLabel}>Ngân hàng</label>
                                                <select
                                                    className={styles.fieldSelect}
                                                    value={newBank.bankName}
                                                    onChange={e => setNewBank(p => ({ ...p, bankName: e.target.value }))}
                                                >
                                                    <option value="">Chọn ngân hàng…</option>
                                                    {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                                </select>
                                            </div>
                                            <div className={styles.formField}>
                                                <label className={styles.fieldLabel}>Số tài khoản</label>
                                                <input
                                                    className={styles.fieldInput}
                                                    type="text"
                                                    placeholder="Nhập số tài khoản"
                                                    value={newBank.accountNumber}
                                                    onChange={e => setNewBank(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, "") }))}
                                                    maxLength={20}
                                                />
                                            </div>
                                            <div className={styles.formField}>
                                                <label className={styles.fieldLabel}>Tên chủ tài khoản</label>
                                                <input
                                                    className={styles.fieldInput}
                                                    type="text"
                                                    placeholder="NGUYEN VAN A"
                                                    value={newBank.holderName}
                                                    onChange={e => setNewBank(p => ({ ...p, holderName: e.target.value.toUpperCase() }))}
                                                />
                                                <p className={styles.fieldHint}>Nhập đúng tên in hoa như trên tài khoản ngân hàng</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.stepBtns}>
                                        <button className={styles.backBtn} onClick={() => setStep(1)}>
                                            <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            Quay lại
                                        </button>
                                        <button
                                            className={styles.nextBtn}
                                            onClick={() => setStep(3)}
                                            disabled={addNew && (!newBank.bankName || !newBank.accountNumber || !newBank.holderName)}
                                        >
                                            Tiếp theo
                                            <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 3: Confirm ══ */}
                            {step === 3 && (
                                <div className={styles.stepBody}>
                                    <h2 className={styles.stepTitle}>Xác nhận rút tiền</h2>
                                    <p className={styles.stepSub}>Vui lòng kiểm tra thông tin trước khi xác nhận</p>

                                    <div className={styles.confirmCard}>
                                        {/* Amount display */}
                                        <div className={styles.confirmAmount}>
                                            <p className={styles.confirmAmountLabel}>Số tiền rút</p>
                                            <p className={styles.confirmAmountVal}>{vnd(numAmount)}</p>
                                        </div>

                                        <div className={styles.confirmRows}>
                                            <div className={styles.confirmRow}>
                                                <span>Ngân hàng thụ hưởng</span>
                                                <strong>
                                                    {addNew
                                                        ? `${newBank.bankName}`
                                                        : selectedBankObj?.bankName
                                                    }
                                                </strong>
                                            </div>
                                            <div className={styles.confirmRow}>
                                                <span>Số tài khoản</span>
                                                <strong>
                                                    {addNew
                                                        ? newBank.accountNumber
                                                        : maskAccount(selectedBankObj?.accountNumber ?? "")
                                                    }
                                                </strong>
                                            </div>
                                            <div className={styles.confirmRow}>
                                                <span>Chủ tài khoản</span>
                                                <strong>
                                                    {addNew
                                                        ? newBank.holderName
                                                        : selectedBankObj?.holderName
                                                    }
                                                </strong>
                                            </div>
                                            <div className={styles.confirmRow}>
                                                <span>Phí giao dịch</span>
                                                <span style={{ color: "#16a34a", fontWeight: 600 }}>Miễn phí</span>
                                            </div>
                                            <div className={`${styles.confirmRow} ${styles.confirmRowTotal}`}>
                                                <span>Thực nhận</span>
                                                <strong style={{ color: "#4f46e5", fontSize: 18 }}>{vnd(netAmount)}</strong>
                                            </div>
                                        </div>

                                        <div className={styles.confirmNote}>
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ flexShrink: 0 }}>
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                                <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            </svg>
                                            Giao dịch thường xử lý trong <strong>1–3 ngày làm việc</strong>. Tiền sẽ được chuyển vào tài khoản của bạn sau khi xác minh thành công.
                                        </div>
                                    </div>

                                    <div className={styles.stepBtns}>
                                        <button className={styles.backBtn} onClick={() => setStep(2)}>
                                            <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            Quay lại
                                        </button>
                                        <button
                                            className={styles.confirmBtn}
                                            onClick={handleConfirm}
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <span className={styles.btnSpinner}/>
                                                    Đang xử lý…
                                                </>
                                            ) : (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                                    Xác nhận rút tiền
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 4: Success ══ */}
                            {step === 4 && (
                                <div className={styles.successBody}>
                                    <div className={styles.successIconWrap}>
                                        <div className={styles.successRing}/>
                                        <div className={styles.successIcon}>
                                            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                                                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    </div>

                                    <h2 className={styles.successTitle}>Yêu cầu đã gửi!</h2>
                                    <p className={styles.successSub}>
                                        Yêu cầu rút <strong>{vnd(numAmount)}</strong> đang được xử lý.<br/>
                                        Tiền sẽ về tài khoản trong <strong>1–3 ngày làm việc</strong>.
                                    </p>

                                    <div className={styles.successInfo}>
                                        <div className={styles.successRow}>
                                            <span>Ngân hàng</span>
                                            <strong>{addNew ? newBank.bankName : selectedBankObj?.bankName}</strong>
                                        </div>
                                        <div className={styles.successRow}>
                                            <span>Tài khoản</span>
                                            <strong>{addNew ? newBank.accountNumber : maskAccount(selectedBankObj?.accountNumber ?? "")}</strong>
                                        </div>
                                        <div className={styles.successRow}>
                                            <span>Thực nhận</span>
                                            <strong style={{ color: "#4f46e5" }}>{vnd(netAmount)}</strong>
                                        </div>
                                        <div className={styles.successRow}>
                                            <span>Mã giao dịch</span>
                                            <strong style={{ fontFamily: "monospace" }}>WD-{Date.now().toString(36).toUpperCase().slice(-8)}</strong>
                                        </div>
                                    </div>

                                    <button className={styles.nextBtn} style={{ width: "100%", justifyContent: "center", marginTop: 20 }} onClick={resetFlow}>
                                        Rút thêm tiền
                                    </button>
                                    <Link href="/profile" className={styles.backToProfileLink}>
                                        Về hồ sơ của tôi
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* ── Right: Transaction history ── */}
                        <div className={styles.historyCard}>
                            <div className={styles.historyHeader}>
                                <h3 className={styles.historyTitle}>Lịch sử giao dịch</h3>
                                {/* Filter tabs */}
                                <div className={styles.txFilters}>
                                    {(["all", "refund", "cashback", "withdrawal", "deposit"] as const).map(f => (
                                        <button
                                            key={f}
                                            className={`${styles.txFilter} ${txFilter === f ? styles.txFilterActive : ""}`}
                                            onClick={() => setTxFilter(f)}
                                        >
                                            {f === "all" ? "Tất cả" : TX_CFG[f as TxType].label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.txList}>
                                {filteredTx.length === 0 ? (
                                    <div className={styles.txEmpty}>
                                        <svg viewBox="0 0 24 24" fill="none" width="36" height="36">
                                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="#d1d5db" strokeWidth="1.5"/>
                                            <path d="M7 8h10M7 12h6M7 16h4" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                        <p>Không có giao dịch nào</p>
                                    </div>
                                ) : filteredTx.map(tx => {
                                    const tc  = TX_CFG[tx.type];
                                    const sc  = ST_CFG[tx.status];
                                    const isOut = tx.amount < 0;
                                    return (
                                        <div key={tx.id} className={styles.txItem}>
                                            <div className={styles.txIcon} style={{ background: tc.bg, color: tc.color }}>
                                                {tx.type === "withdrawal" && (
                                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                )}
                                                {tx.type === "refund" && (
                                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8"/></svg>
                                                )}
                                                {tx.type === "cashback" && (
                                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.8"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>
                                                )}
                                                {tx.type === "deposit" && (
                                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                )}
                                            </div>
                                            <div className={styles.txInfo}>
                                                <div className={styles.txTop}>
                                                    <span className={styles.txDesc}>{tx.description}</span>
                                                    <span className={`${styles.txAmount} ${isOut ? styles.txOut : styles.txIn}`}>
                                                        {tc.sign}{vnd(tx.amount)}
                                                    </span>
                                                </div>
                                                <div className={styles.txBottom}>
                                                    <span className={styles.txRef}>{tx.reference}</span>
                                                    <span className={styles.txDate}>{tx.date}</span>
                                                    <span className={styles.txStatus} style={{ background: sc.bg, color: sc.color }}>
                                                        {sc.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

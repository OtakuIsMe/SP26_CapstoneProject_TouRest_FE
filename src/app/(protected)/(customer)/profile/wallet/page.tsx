"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import { walletService, type WalletDTO, type WalletTransactionDTO, type SavedBankDTO } from "@/libs/services/wallet.service";
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

// ── Constants ─────────────────────────────────────────────────────────────────
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

const MIN_WITHDRAW = 50_000;

const TX_CFG: Record<TxType, { label: string; color: string; bg: string; sign: "+" | "-" }> = {
    refund:     { label: "Refund",      color: "#15803d", bg: "#dcfce7", sign: "+" },
    cashback:   { label: "Cashback",    color: "#0369a1", bg: "#e0f2fe", sign: "+" },
    deposit:    { label: "Earning",     color: "#7c3aed", bg: "#ede9fe", sign: "+" },
    withdrawal: { label: "Withdrawal",  color: "#b91c1c", bg: "#fee2e2", sign: "-" },
};

const ST_CFG: Record<TxStatus, { label: string; color: string; bg: string }> = {
    completed: { label: "Completed",   color: "#15803d", bg: "#dcfce7" },
    pending:   { label: "Processing",  color: "#92400e", bg: "#fef3c7" },
    failed:    { label: "Failed",      color: "#b91c1c", bg: "#fee2e2" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function currency(n: number) {
    return Math.abs(n).toLocaleString("vi-VN") + "₫";
}

function maskAccount(num: string) {
    return num.length > 8 ? num.slice(0, 4) + " **** " + num.slice(-4) : num;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mapTransaction(tx: WalletTransactionDTO): Transaction {
    let type: TxType;
    if (tx.type === "Credit") {
        if (tx.reason === "Refund")         type = "refund";
        else if (tx.reason === "BookingEarning") type = "deposit";
        else                                 type = "cashback";
    } else {
        type = "withdrawal";
    }
    const status: TxStatus = tx.reason === "Payout" ? "pending" : "completed";
    return {
        id:          tx.id,
        type,
        amount:      tx.type === "Credit" ? tx.amount : -tx.amount,
        date:        fmtDate(tx.createdAt),
        description: tx.note ?? `${tx.reason.replace(/([A-Z])/g, " $1").trim()} transaction`,
        reference:   tx.referenceId
            ? tx.referenceId.slice(0, 8).toUpperCase()
            : tx.id.slice(0, 8).toUpperCase(),
        status,
    };
}

function mapBank(b: SavedBankDTO, idx: number): BankAccount {
    return {
        id:            b.bankAccount,
        bankName:      b.bankName,
        bankCode:      BANK_CODE[b.bankName] ?? b.bankName.slice(0, 3).toUpperCase(),
        accountNumber: b.bankAccount,
        holderName:    b.accountHolder,
        isPrimary:     idx === 0,
    };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WalletPage() {
    const [step, setStep]               = useState<Step>(1);
    const [amount, setAmount]           = useState("");
    const [amountErr, setAmountErr]     = useState("");
    const [selectedBank, setSelectedBank] = useState<string>("");
    const [addNew, setAddNew]           = useState(false);
    const [processing, setProcessing]   = useState(false);
    const [txFilter, setTxFilter]       = useState<"all" | TxType>("all");
    const [newBank, setNewBank]         = useState({ bankName: "", accountNumber: "", holderName: "" });
    const amountRef = useRef<HTMLInputElement>(null);

    // ── API state ──────────────────────────────────────────────────────────────
    const [wallet,       setWallet]       = useState<WalletDTO | null>(null);
    const [banks,        setBanks]        = useState<BankAccount[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading,      setLoading]      = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [wRes, txRes, bRes] = await Promise.all([
                walletService.getMyWallet(),
                walletService.getMyTransactions(),
                walletService.getSavedBanks(),
            ]);
            if (wRes.data)  setWallet(wRes.data);
            if (txRes.data) setTransactions(txRes.data.map(mapTransaction));
            if (bRes.data && bRes.data.length > 0) {
                const mapped = bRes.data.map(mapBank);
                setBanks(mapped);
                setSelectedBank(mapped[0].id);
            } else {
                setAddNew(true);
            }
        } catch {
            // silently ignore — page still renders with empty state
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { if (step === 1) setAmountErr(""); }, [step]);

    // ── Derived values ────────────────────────────────────────────────────────
    const numAmount       = parseInt(amount.replace(/\D/g, ""), 10) || 0;
    const availableBalance = wallet?.balance ?? 0;
    const selectedBankObj  = banks.find(b => b.id === selectedBank);

    const totalDeposited = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalWithdrawn = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    // ── Handlers ──────────────────────────────────────────────────────────────
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
            setAmountErr(`Minimum withdrawal is ${currency(MIN_WITHDRAW)}`);
            amountRef.current?.focus();
            return false;
        }
        if (numAmount > availableBalance) {
            setAmountErr("Amount exceeds your available balance");
            return false;
        }
        return true;
    }

    async function handleConfirm() {
        setProcessing(true);
        try {
            const bankData = addNew
                ? { bankAccount: newBank.accountNumber, bankName: newBank.bankName, accountHolder: newBank.holderName }
                : { bankAccount: selectedBankObj!.accountNumber, bankName: selectedBankObj!.bankName, accountHolder: selectedBankObj!.holderName };

            await walletService.requestPayout({ amount: numAmount, ...bankData });

            // Refresh wallet balance
            const wRes = await walletService.getMyWallet();
            if (wRes.data) setWallet(wRes.data);

            setStep(4);
        } catch {
            setAmountErr("Withdrawal request failed. Please try again.");
            setStep(1);
        } finally {
            setProcessing(false);
        }
    }

    function resetFlow() {
        setStep(1);
        setAmount("");
        setAmountErr("");
        setSelectedBank(banks[0]?.id ?? "");
        setAddNew(banks.length === 0);
        setNewBank({ bankName: "", accountNumber: "", holderName: "" });
        fetchData();
    }

    const filteredTx = transactions.filter(t => txFilter === "all" || t.type === txFilter);

    return (
        <>
            <Header variant="solid" />
            <div className={styles.page}>
                <div className={styles.container}>

                    {/* Breadcrumb */}
                    <nav className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <Link href="/profile">Profile</Link>
                        <span>/</span>
                        <span>Wallet & Withdrawal</span>
                    </nav>

                    {/* ── Balance hero ── */}
                    <div className={styles.hero}>
                        <div className={styles.heroGlow} />
                        <div className={styles.heroLeft}>
                            <p className={styles.heroLabel}>Available Balance</p>
                            <p className={styles.heroBalance}>
                                {loading ? "—" : currency(availableBalance)}
                            </p>
                            {(wallet?.pendingBalance ?? 0) > 0 && (
                                <div className={styles.heroPending}>
                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                    Pending: <strong>{currency(wallet!.pendingBalance)}</strong>
                                </div>
                            )}
                        </div>
                        <div className={styles.heroStats}>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatLabel}>Total Received</span>
                                <span className={styles.heroStatVal} style={{ color: "#4ade80" }}>
                                    {loading ? "—" : currency(totalDeposited)}
                                </span>
                            </div>
                            <div className={styles.heroStatDivider}/>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatLabel}>Total Withdrawn</span>
                                <span className={styles.heroStatVal} style={{ color: "#fca5a5" }}>
                                    {loading ? "—" : currency(totalWithdrawn)}
                                </span>
                            </div>
                            <div className={styles.heroStatDivider}/>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatLabel}>Transactions</span>
                                <span className={styles.heroStatVal}>{loading ? "—" : transactions.length}</span>
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
                                    { n: 1, label: "Amount"   },
                                    { n: 2, label: "Account"  },
                                    { n: 3, label: "Confirm"  },
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
                                    <h2 className={styles.stepTitle}>Enter withdrawal amount</h2>
                                    <p className={styles.stepSub}>Available balance: <strong>{currency(availableBalance)}</strong></p>

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

                                    <div className={styles.quickRow}>
                                        {QUICK_AMOUNTS.map(v => (
                                            <button
                                                key={v}
                                                className={`${styles.quickBtn} ${numAmount === v ? styles.quickBtnActive : ""}`}
                                                onClick={() => handleQuickAmount(v)}
                                            >
                                                {currency(v)}
                                            </button>
                                        ))}
                                        <button
                                            className={`${styles.quickBtn} ${numAmount === availableBalance && availableBalance > 0 ? styles.quickBtnActive : ""}`}
                                            onClick={() => handleQuickAmount(availableBalance)}
                                            disabled={availableBalance === 0}
                                        >
                                            All
                                        </button>
                                    </div>

                                    <div className={styles.feeBox}>
                                        <div className={styles.feeRow}>
                                            <span>Withdrawal amount</span>
                                            <span>{numAmount ? currency(numAmount) : "—"}</span>
                                        </div>
                                        <div className={styles.feeRow}>
                                            <span>Transaction fee</span>
                                            <span style={{ color: "#16a34a" }}>Free</span>
                                        </div>
                                        <div className={styles.feeDivider}/>
                                        <div className={`${styles.feeRow} ${styles.feeTotal}`}>
                                            <span>You receive</span>
                                            <strong style={{ color: "#4f46e5" }}>{numAmount ? currency(numAmount) : "—"}</strong>
                                        </div>
                                    </div>

                                    <button
                                        className={styles.nextBtn}
                                        onClick={() => validateStep1() && setStep(2)}
                                        disabled={!numAmount || loading}
                                    >
                                        Next
                                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </button>
                                </div>
                            )}

                            {/* ══ STEP 2: Bank account ══ */}
                            {step === 2 && (
                                <div className={styles.stepBody}>
                                    <h2 className={styles.stepTitle}>Select bank account</h2>
                                    <p className={styles.stepSub}>Transfer <strong>{currency(numAmount)}</strong> to</p>

                                    <div className={styles.bankList}>
                                        {banks.map(b => (
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
                                                        {b.isPrimary && <span className={styles.primaryBadge}>Default</span>}
                                                    </div>
                                                    <div className={styles.bankNum}>{maskAccount(b.accountNumber)}</div>
                                                    <div className={styles.bankHolder}>{b.holderName}</div>
                                                </div>
                                            </label>
                                        ))}

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
                                            <span className={styles.bankAddLabel}>Add new account</span>
                                        </label>
                                    </div>

                                    {addNew && (
                                        <div className={styles.newBankForm}>
                                            <div className={styles.formField}>
                                                <label className={styles.fieldLabel}>Bank</label>
                                                <select
                                                    className={styles.fieldSelect}
                                                    value={newBank.bankName}
                                                    onChange={e => setNewBank(p => ({ ...p, bankName: e.target.value }))}
                                                >
                                                    <option value="">Select bank…</option>
                                                    {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                                </select>
                                            </div>
                                            <div className={styles.formField}>
                                                <label className={styles.fieldLabel}>Account number</label>
                                                <input
                                                    className={styles.fieldInput}
                                                    type="text"
                                                    placeholder="Enter account number"
                                                    value={newBank.accountNumber}
                                                    onChange={e => setNewBank(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, "") }))}
                                                    maxLength={20}
                                                />
                                            </div>
                                            <div className={styles.formField}>
                                                <label className={styles.fieldLabel}>Account holder name</label>
                                                <input
                                                    className={styles.fieldInput}
                                                    type="text"
                                                    placeholder="NGUYEN VAN A"
                                                    value={newBank.holderName}
                                                    onChange={e => setNewBank(p => ({ ...p, holderName: e.target.value.toUpperCase() }))}
                                                />
                                                <p className={styles.fieldHint}>Enter your name exactly as it appears on your bank account</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.stepBtns}>
                                        <button className={styles.backBtn} onClick={() => setStep(1)}>
                                            <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            Back
                                        </button>
                                        <button
                                            className={styles.nextBtn}
                                            onClick={() => setStep(3)}
                                            disabled={addNew && (!newBank.bankName || !newBank.accountNumber || !newBank.holderName)}
                                        >
                                            Next
                                            <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ══ STEP 3: Confirm ══ */}
                            {step === 3 && (
                                <div className={styles.stepBody}>
                                    <h2 className={styles.stepTitle}>Confirm withdrawal</h2>
                                    <p className={styles.stepSub}>Please review the details before confirming</p>

                                    <div className={styles.confirmCard}>
                                        <div className={styles.confirmAmount}>
                                            <p className={styles.confirmAmountLabel}>Withdrawal amount</p>
                                            <p className={styles.confirmAmountVal}>{currency(numAmount)}</p>
                                        </div>

                                        <div className={styles.confirmRows}>
                                            <div className={styles.confirmRow}>
                                                <span>Bank</span>
                                                <strong>{addNew ? newBank.bankName : selectedBankObj?.bankName}</strong>
                                            </div>
                                            <div className={styles.confirmRow}>
                                                <span>Account number</span>
                                                <strong>{addNew ? newBank.accountNumber : maskAccount(selectedBankObj?.accountNumber ?? "")}</strong>
                                            </div>
                                            <div className={styles.confirmRow}>
                                                <span>Account holder</span>
                                                <strong>{addNew ? newBank.holderName : selectedBankObj?.holderName}</strong>
                                            </div>
                                            <div className={styles.confirmRow}>
                                                <span>Transaction fee</span>
                                                <span style={{ color: "#16a34a", fontWeight: 600 }}>Free</span>
                                            </div>
                                            <div className={`${styles.confirmRow} ${styles.confirmRowTotal}`}>
                                                <span>You receive</span>
                                                <strong style={{ color: "#4f46e5", fontSize: 18 }}>{currency(numAmount)}</strong>
                                            </div>
                                        </div>

                                        <div className={styles.confirmNote}>
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ flexShrink: 0 }}>
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                                <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            </svg>
                                            Withdrawals are typically processed within <strong>1–3 business days</strong>. Funds will be transferred after verification.
                                        </div>
                                    </div>

                                    <div className={styles.stepBtns}>
                                        <button className={styles.backBtn} onClick={() => setStep(2)}>
                                            <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            Back
                                        </button>
                                        <button
                                            className={styles.confirmBtn}
                                            onClick={handleConfirm}
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <><span className={styles.btnSpinner}/> Processing…</>
                                            ) : (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                                    Confirm withdrawal
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

                                    <h2 className={styles.successTitle}>Request submitted!</h2>
                                    <p className={styles.successSub}>
                                        Your withdrawal of <strong>{currency(numAmount)}</strong> is being processed.<br/>
                                        Funds will arrive within <strong>1–3 business days</strong>.
                                    </p>

                                    <div className={styles.successInfo}>
                                        <div className={styles.successRow}>
                                            <span>Bank</span>
                                            <strong>{addNew ? newBank.bankName : selectedBankObj?.bankName}</strong>
                                        </div>
                                        <div className={styles.successRow}>
                                            <span>Account</span>
                                            <strong>{addNew ? newBank.accountNumber : maskAccount(selectedBankObj?.accountNumber ?? "")}</strong>
                                        </div>
                                        <div className={styles.successRow}>
                                            <span>Amount</span>
                                            <strong style={{ color: "#4f46e5" }}>{currency(numAmount)}</strong>
                                        </div>
                                    </div>

                                    <button
                                        className={styles.nextBtn}
                                        style={{ width: "100%", justifyContent: "center", marginTop: 20 }}
                                        onClick={resetFlow}
                                    >
                                        Withdraw more
                                    </button>
                                    <Link href="/profile" className={styles.backToProfileLink}>
                                        Back to profile
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* ── Right: Transaction history ── */}
                        <div className={styles.historyCard}>
                            <div className={styles.historyHeader}>
                                <h3 className={styles.historyTitle}>Transaction History</h3>
                                <div className={styles.txFilters}>
                                    {(["all", "refund", "cashback", "withdrawal", "deposit"] as const).map(f => (
                                        <button
                                            key={f}
                                            className={`${styles.txFilter} ${txFilter === f ? styles.txFilterActive : ""}`}
                                            onClick={() => setTxFilter(f)}
                                        >
                                            {f === "all" ? "All" : TX_CFG[f as TxType].label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.txList}>
                                {loading ? (
                                    <div className={styles.txEmpty}>
                                        <p style={{ color: "#9ca3af" }}>Loading transactions…</p>
                                    </div>
                                ) : filteredTx.length === 0 ? (
                                    <div className={styles.txEmpty}>
                                        <svg viewBox="0 0 24 24" fill="none" width="36" height="36">
                                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="#d1d5db" strokeWidth="1.5"/>
                                            <path d="M7 8h10M7 12h6M7 16h4" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                        <p>No transactions yet</p>
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
                                                        {tc.sign}{currency(tx.amount)}
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

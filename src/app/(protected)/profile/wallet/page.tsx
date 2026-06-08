"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import { walletService, type WalletDTO, type WalletTransactionDTO } from "@/libs/services/wallet.service";
import styles from "./page.module.scss";

type TxType   = "refund" | "cashback" | "withdrawal" | "earning" | "topup";
type TxStatus = "completed" | "pending" | "failed";

interface Transaction {
    id: string;
    type: TxType;
    amount: number;
    date: string;
    description: string;
    reference: string;
    status: TxStatus;
}

const TX_CFG: Record<TxType, { label: string; color: string; bg: string; sign: "+" | "-" }> = {
    refund:     { label: "Refund",      color: "#15803d", bg: "#dcfce7", sign: "+" },
    cashback:   { label: "Cashback",    color: "#0369a1", bg: "#e0f2fe", sign: "+" },
    earning:    { label: "Earning",     color: "#7c3aed", bg: "#ede9fe", sign: "+" },
    topup:      { label: "Top Up",      color: "#0891b2", bg: "#e0f7fa", sign: "+" },
    withdrawal: { label: "Withdrawal",  color: "#b91c1c", bg: "#fee2e2", sign: "-" },
};

const ST_CFG: Record<TxStatus, { label: string; color: string; bg: string }> = {
    completed: { label: "Completed",  color: "#15803d", bg: "#dcfce7" },
    pending:   { label: "Processing", color: "#92400e", bg: "#fef3c7" },
    failed:    { label: "Failed",     color: "#b91c1c", bg: "#fee2e2" },
};

const FILTER_TABS = [
    { key: "all",       label: "All"        },
    { key: "earning",   label: "Earning"    },
    { key: "topup",     label: "Top Up"     },
    { key: "refund",    label: "Refund"     },
    { key: "cashback",  label: "Cashback"   },
    { key: "withdrawal",label: "Withdrawal" },
] as const;

function currency(n: number) {
    return Math.abs(n).toLocaleString("vi-VN") + "₫";
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mapTransaction(tx: WalletTransactionDTO): Transaction {
    let type: TxType;
    if (tx.type === "Credit") {
        if (tx.reason === "Refund")             type = "refund";
        else if (tx.reason === "BookingEarning") type = "earning";
        else if (tx.note?.startsWith("TopUp#")) type = "topup";
        else                                     type = "cashback";
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

export default function WalletPage() {
    const [wallet,       setWallet]       = useState<WalletDTO | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [txFilter,     setTxFilter]     = useState<"all" | TxType>("all");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [wRes, txRes] = await Promise.all([
                walletService.getMyWallet(),
                walletService.getMyTransactions(),
            ]);
            if (wRes.data)  setWallet(wRes.data);
            if (txRes.data) setTransactions(txRes.data.map(mapTransaction));
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const availableBalance = wallet?.balance ?? 0;
    const totalReceived    = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalWithdrawn   = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const filteredTx       = transactions.filter(t => txFilter === "all" || t.type === txFilter);

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
                        <span>Wallet</span>
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
                        <div className={styles.heroRight}>
                            <div className={styles.heroStats}>
                                <div className={styles.heroStat}>
                                    <span className={styles.heroStatLabel}>Total Received</span>
                                    <span className={styles.heroStatVal} style={{ color: "#4ade80" }}>
                                        {loading ? "—" : currency(totalReceived)}
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
                            <Link href="/profile/wallet/topup" className={styles.topUpBtn}>
                                <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                </svg>
                                Top Up
                            </Link>
                        </div>
                    </div>

                    {/* ── Transaction history ── */}
                    <div className={styles.historyCard}>
                        <div className={styles.historyHeader}>
                            <h3 className={styles.historyTitle}>Transaction History</h3>
                            <div className={styles.txFilters}>
                                {FILTER_TABS.map(f => (
                                    <button
                                        key={f.key}
                                        className={`${styles.txFilter} ${txFilter === f.key ? styles.txFilterActive : ""}`}
                                        onClick={() => setTxFilter(f.key as "all" | TxType)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.txList}>
                            {loading ? (
                                <div className={styles.txEmpty}>
                                    <div className={styles.spinner} />
                                </div>
                            ) : filteredTx.length === 0 ? (
                                <div className={styles.txEmpty}>
                                    <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#d1d5db" strokeWidth="1.5"/>
                                        <path d="M7 8h10M7 12h6M7 16h4" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                    <p>No transactions yet</p>
                                </div>
                            ) : filteredTx.map(tx => {
                                const tc    = TX_CFG[tx.type];
                                const sc    = ST_CFG[tx.status];
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
                                            {tx.type === "earning" && (
                                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            )}
                                            {tx.type === "topup" && (
                                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 10h20M12 13v4M10 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
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
            <Footer />
        </>
    );
}

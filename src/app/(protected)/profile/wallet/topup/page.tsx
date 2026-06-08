"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layouts/header/header";
import Footer from "@/components/layouts/footer/footer";
import { walletService, type WalletTopUpDTO } from "@/libs/services/wallet.service";
import styles from "./page.module.scss";

const QR_EXPIRE_SECONDS = 15 * 60;
const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

function currency(n: number) {
    return Math.abs(n).toLocaleString("vi-VN") + "₫";
}

export default function WalletTopUpPage() {
    const [amount, setAmount]       = useState("");
    const [amountErr, setAmountErr] = useState("");

    const [topUp, setTopUp]         = useState<WalletTopUpDTO | null>(null);
    const [qrStatus, setQrStatus]   = useState<"idle" | "loading" | "success" | "paid" | "error">("idle");
    const [qrError, setQrError]     = useState("");
    const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRE_SECONDS);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const amountRef = useRef<HTMLInputElement>(null);

    const numAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;

    const clearTimers = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    };

    useEffect(() => () => clearTimers(), []);

    // Countdown timer while QR is active
    useEffect(() => {
        if (qrStatus !== "success") return;
        timerRef.current = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) {
                    clearInterval(timerRef.current!); timerRef.current = null;
                    setQrStatus("idle");
                    setTopUp(null);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [qrStatus]);

    // Poll payment status every 4s
    useEffect(() => {
        if (qrStatus !== "success" || !topUp) return;
        pollRef.current = setInterval(async () => {
            try {
                const res = await walletService.getTopUpStatus(topUp.orderCode);
                if (res.data?.status === "Paid") {
                    clearTimers();
                    await walletService.finalizeTopUp(topUp.orderCode).catch(() => {});
                    setQrStatus("paid");
                }
            } catch { /* ignore */ }
        }, 4000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [qrStatus, topUp]);

    function handleAmountInput(raw: string) {
        const digits = raw.replace(/\D/g, "");
        setAmount(digits ? parseInt(digits, 10).toLocaleString("vi-VN") : "");
        setAmountErr("");
    }

    function validate(): boolean {
        if (!numAmount || numAmount < 10_000) {
            setAmountErr("Minimum top-up is 10,000₫");
            amountRef.current?.focus();
            return false;
        }
        if (numAmount > 100_000_000) {
            setAmountErr("Maximum top-up is 100,000,000₫");
            return false;
        }
        return true;
    }

    async function handleGenerateQr() {
        if (!validate()) return;
        clearTimers();
        setQrStatus("loading");
        setQrError("");
        try {
            const res = await walletService.createTopUp(numAmount);
            if (res.data?.qrCode) {
                setTopUp(res.data);
                setQrStatus("success");
                setSecondsLeft(QR_EXPIRE_SECONDS);
            } else {
                setQrStatus("error");
                setQrError("No QR code returned. Please try again.");
            }
        } catch {
            setQrStatus("error");
            setQrError("Connection error. Please try again.");
        }
    }

    function handleReset() {
        clearTimers();
        setTopUp(null);
        setQrStatus("idle");
        setAmount("");
        setAmountErr("");
    }

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const expirePercent = (secondsLeft / QR_EXPIRE_SECONDS) * 100;
    const timerColor = expirePercent > 40 ? "#2a9d8f" : expirePercent > 15 ? "#f59e0b" : "#ef4444";

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
                        <Link href="/profile/wallet">Wallet</Link>
                        <span>/</span>
                        <span>Top Up</span>
                    </nav>

                    <div className={styles.grid}>

                        {/* ── Left: Amount selector ── */}
                        <div className={styles.leftCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardIcon}>
                                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                                        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
                                        <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className={styles.cardTitle}>Top Up Wallet</h2>
                                    <p className={styles.cardSub}>Add funds via PayOS — instant credit</p>
                                </div>
                            </div>

                            {/* Amount input */}
                            <div className={styles.section}>
                                <label className={styles.label}>Enter amount</label>
                                <div className={`${styles.amountWrap} ${amountErr ? styles.amountWrapErr : ""}`}>
                                    <span className={styles.currency}>₫</span>
                                    <input
                                        ref={amountRef}
                                        className={styles.amountInput}
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => handleAmountInput(e.target.value)}
                                        disabled={qrStatus === "success"}
                                    />
                                    {amount && qrStatus !== "success" && (
                                        <button className={styles.clearBtn} onClick={() => { setAmount(""); setAmountErr(""); }}>
                                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                {amountErr && <p className={styles.amountErr}>{amountErr}</p>}
                            </div>

                            {/* Quick amounts */}
                            <div className={styles.quickGrid}>
                                {QUICK_AMOUNTS.map(v => (
                                    <button
                                        key={v}
                                        className={`${styles.quickBtn} ${numAmount === v ? styles.quickBtnActive : ""}`}
                                        onClick={() => { setAmount(v.toLocaleString("vi-VN")); setAmountErr(""); }}
                                        disabled={qrStatus === "success"}
                                    >
                                        {currency(v)}
                                    </button>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className={styles.summary}>
                                <div className={styles.summaryRow}>
                                    <span>Amount</span>
                                    <span>{numAmount ? currency(numAmount) : "—"}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Fee</span>
                                    <span className={styles.free}>Free</span>
                                </div>
                                <div className={styles.summaryDivider} />
                                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                                    <span>You receive</span>
                                    <strong>{numAmount ? currency(numAmount) : "—"}</strong>
                                </div>
                            </div>

                            {/* Actions */}
                            {qrStatus !== "success" && qrStatus !== "paid" && (
                                <button
                                    className={styles.generateBtn}
                                    onClick={handleGenerateQr}
                                    disabled={!numAmount || qrStatus === "loading"}
                                >
                                    {qrStatus === "loading" ? (
                                        <><span className={styles.spinner} /> Generating QR…</>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
                                                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
                                                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
                                                <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3v3M18 21h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            </svg>
                                            Generate QR Code
                                        </>
                                    )}
                                </button>
                            )}

                            {qrStatus === "success" && (
                                <button className={styles.cancelBtn} onClick={handleReset}>
                                    Cancel &amp; change amount
                                </button>
                            )}

                            {qrError && (
                                <div className={styles.errorBox}>
                                    <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                        <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                    {qrError}
                                </div>
                            )}

                            <div className={styles.note}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ flexShrink: 0, marginTop: 2 }}>
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                                    <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                                QR code expires in 15 minutes. Funds are credited instantly after payment.
                            </div>
                        </div>

                        {/* ── Right: QR / Success ── */}
                        <div className={styles.rightCard}>

                            {/* Idle placeholder */}
                            {(qrStatus === "idle" || qrStatus === "loading" || qrStatus === "error") && (
                                <div className={styles.qrPlaceholder}>
                                    <div className={styles.qrPlaceholderIcon}>
                                        <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                                            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                                            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                                            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                                            <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    <p className={styles.qrPlaceholderText}>
                                        {qrStatus === "loading" ? "Generating QR code…" : "Enter an amount and click Generate QR Code"}
                                    </p>
                                </div>
                            )}

                            {/* QR active */}
                            {qrStatus === "success" && topUp && (
                                <div className={styles.qrSection}>
                                    <div className={styles.qrHeader}>
                                        <span className={styles.qrAmount}>{currency(topUp.amount)}</span>
                                        <span className={styles.qrLabel}>Scan to pay</span>
                                    </div>

                                    <div className={styles.qrImageWrap}>
                                        <Image
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(topUp.qrCode ?? "")}`}
                                            alt="PayOS QR Code"
                                            width={220}
                                            height={220}
                                            className={styles.qrImage}
                                            unoptimized
                                        />
                                    </div>

                                    {/* Countdown ring */}
                                    <div className={styles.timer}>
                                        <svg width="56" height="56" viewBox="0 0 56 56">
                                            <circle cx="28" cy="28" r="24" fill="none" stroke="#f3f4f6" strokeWidth="4"/>
                                            <circle
                                                cx="28" cy="28" r="24" fill="none"
                                                stroke={timerColor} strokeWidth="4"
                                                strokeDasharray={`${2 * Math.PI * 24}`}
                                                strokeDashoffset={`${2 * Math.PI * 24 * (1 - expirePercent / 100)}`}
                                                strokeLinecap="round"
                                                style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                                            />
                                        </svg>
                                        <span className={styles.timerText} style={{ color: timerColor }}>
                                            {minutes}:{seconds.toString().padStart(2, "0")}
                                        </span>
                                    </div>
                                    <p className={styles.timerLabel}>QR expires in</p>

                                    {topUp.checkoutUrl && (
                                        <a
                                            href={topUp.checkoutUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.payosBtn}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
                                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Open PayOS payment page
                                        </a>
                                    )}

                                    <p className={styles.qrHint}>
                                        Open your banking app and scan the QR code, or click the link above.
                                        This page will update automatically when payment is received.
                                    </p>
                                </div>
                            )}

                            {/* Success */}
                            {qrStatus === "paid" && topUp && (
                                <div className={styles.successSection}>
                                    <div className={styles.successRing}>
                                        <div className={styles.successIcon}>
                                            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                                                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className={styles.successTitle}>Payment received!</h3>
                                    <p className={styles.successSub}>
                                        <strong>{currency(topUp.amount)}</strong> has been added to your wallet.
                                    </p>
                                    <div className={styles.successActions}>
                                        <button className={styles.topUpAgainBtn} onClick={handleReset}>
                                            Top up again
                                        </button>
                                        <Link href="/profile/wallet" className={styles.walletBtn}>
                                            View wallet
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormField from "@/components/commons/form-field/form-field";
import { authService } from "@/libs/services/auth.service";
import styles from "./page.module.scss";

const PHONE_RE = /^0[35789]\d{8}$/;

export default function SignUpPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setPhoneError("");

        if (phone && !PHONE_RE.test(phone)) {
            setPhoneError("Invalid phone number (e.g. 0912345678)");
            return;
        }

        setLoading(true);

        try {
            await authService.register({ username, email, password, phone: phone || undefined });
            router.push("/signin");
        } catch (err: any) {
            const msg = err?.response?.data?.Message || err?.response?.data?.message || "Registration failed. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <h1 className={styles.heading}>Create Account</h1>
            <p className={styles.subtitle}>
                Already have an account? <Link href="/signin">Sign in</Link>
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
                {error && <p className={styles.error}>{error}</p>}

                <FormField
                    label="Username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <FormField
                    label="Email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                {/* Phone Number */}
                <div className={styles.phoneField}>
                    <span className={styles.phoneLabel}>Phone Number</span>
                    <div className={styles.phoneRow}>
                        <button type="button" className={styles.phoneCode}>
                            🇻🇳 +84
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <input
                            type="tel"
                            className={styles.phoneInput}
                            placeholder="Phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    {phoneError && <p className={styles.error}>{phoneError}</p>}
                </div>

                {/* Password */}
                <div className={styles.passwordField}>
                    <span className={styles.passwordLabel}>Password</span>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            className={styles.passwordInput}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className={styles.eyeBtn}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                </button>

            </form>
        </>
    );
}

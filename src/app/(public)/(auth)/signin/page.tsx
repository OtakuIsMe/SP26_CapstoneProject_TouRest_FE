"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import FormField from "@/components/commons/form-field/form-field";
import { authService } from "@/libs/services/auth.service";
import { StorageKeys } from "@/constants/storage";
import styles from "./page.module.scss";

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectAfterLogin = searchParams.get("redirect");
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await authService.login({ email, password });
            localStorage.setItem(StorageKeys.ACCESS_TOKEN, res.data.accessToken);

            const me = await authService.getMe();
            const role    = me.data.role;
            const rawSubRole = me.data.subRole ?? null;
            // Map backend sub-role names to RBAC keys used by the permission matrix
            const AGENCY_SUB_ROLE_MAP: Record<string, string> = {
                manager:   "admin",
                tourguide: "tour_guide",
            };
            const subRole = (role?.toUpperCase() === "AGENCY" && rawSubRole)
                ? (AGENCY_SUB_ROLE_MAP[rawSubRole.toLowerCase()] ?? rawSubRole)
                : rawSubRole;
            document.cookie = `role=${role}; path=/`;
            // Persist sub-role so the RBAC hook and middleware can read it
            if (subRole) {
                localStorage.setItem("sub_role", subRole);
                document.cookie = `sub_role=${subRole}; path=/`;
            } else {
                localStorage.removeItem("sub_role");
                document.cookie = "sub_role=; path=/; max-age=0";
            }

            // For customers, honour the ?redirect= param (e.g. came from booking page)
            if (role === "customer" && redirectAfterLogin) {
                router.push(redirectAfterLogin);
                return;
            }

            const roleRedirect: Record<string, string> = {
                customer: "/",
                admin: "/admin/dashboard",
                agency: "/agency/dashboard",
                provider: "/provider/dashboard",
            };
            router.push(roleRedirect[role] ?? "/");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Login failed. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <h1 className={styles.heading}>Sign In</h1>
            <p className={styles.subtitle}>
                Don&apos;t have an account? <Link href="/signup">Sign up</Link>
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
                {error && <p className={styles.error}>{error}</p>}

                <FormField
                    label="Email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

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
                    {loading ? "Signing in..." : "Sign In"}
                </button>

            </form>
        </>
    );
}

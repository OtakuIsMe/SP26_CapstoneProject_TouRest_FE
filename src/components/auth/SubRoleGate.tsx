"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSubRole } from "@/hooks/useSubRole";
import { Permission } from "@/libs/rbac/types";

interface SubRoleGateProps {
    /** The permission required to see the children. */
    needs: Permission;
    /**
     * What to render when access is denied.
     * - undefined (default): render nothing (hide the feature)
     * - ReactNode: render this instead (e.g. disabled button, lock icon)
     * - "redirect": navigate to `redirectTo` (for page-level blocking)
     */
    fallback?: React.ReactNode | "redirect";
    /** Used with fallback="redirect". Defaults to the previous page. */
    redirectTo?: string;
    /**
     * Pass the main role so the hook can apply the default sub-role
     * when the API hasn't returned one yet.
     */
    mainRole?: "provider" | "agency";
    children: React.ReactNode;
}

/**
 * Conditionally renders children based on the current user's sub-role.
 *
 * Examples:
 *
 *   // Hide a button entirely:
 *   <SubRoleGate needs="provider.packages.create">
 *       <CreatePackageButton />
 *   </SubRoleGate>
 *
 *   // Show a disabled state instead:
 *   <SubRoleGate needs="agency.guides.assign" fallback={<DisabledBtn />}>
 *       <AssignGuideButton />
 *   </SubRoleGate>
 *
 *   // Block an entire page (put near the top of the page component):
 *   <SubRoleGate needs="provider.analytics.view" fallback="redirect" redirectTo="/provider/dashboard">
 *       <AnalyticsPage />
 *   </SubRoleGate>
 */
export default function SubRoleGate({
    needs,
    fallback,
    redirectTo,
    mainRole,
    children,
}: SubRoleGateProps) {
    const { can, ready } = useSubRole(mainRole);
    const router = useRouter();

    const allowed = can(needs);

    useEffect(() => {
        if (ready && !allowed && fallback === "redirect") {
            router.replace(redirectTo ?? "/");
        }
    }, [ready, allowed, fallback, redirectTo, router]);

    // While sub-role is loading, render nothing to avoid flicker.
    // For redirect mode this also prevents a flash of the protected content.
    if (!ready) return null;

    if (!allowed) {
        if (fallback === "redirect") return null;   // redirect fires in useEffect
        if (fallback !== undefined) return <>{fallback}</>;
        return null;                                // hide silently
    }

    return <>{children}</>;
}

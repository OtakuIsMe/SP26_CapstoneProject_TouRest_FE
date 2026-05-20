"use client";

import { useEffect, useState } from "react";
import { SubRole, Permission, DEFAULT_SUB_ROLE } from "@/libs/rbac/types";
import { hasPermission } from "@/libs/rbac/permissions";
import { StorageKeys } from "@/constants/storage";

/**
 * Reads the current user's sub-role from localStorage and exposes
 * permission-check helpers.
 *
 * Sub-role is written to localStorage on login (from the API response).
 * When the API doesn't return a subRole yet, DEFAULT_SUB_ROLE is used
 * (most-permissive for each main role) so existing flows keep working.
 *
 * Usage:
 *   const { subRole, can, is } = useSubRole();
 *   if (!can("provider.packages.create")) return null;
 *
 * Passing mainRole enables the default fallback:
 *   const { can } = useSubRole("provider");  // defaults to "manager"
 */
export function useSubRole(mainRole?: "provider" | "agency") {
    const [subRole, setSubRole] = useState<SubRole | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(StorageKeys.SUB_ROLE) as SubRole | null;
        if (stored) {
            setSubRole(stored);
        } else if (mainRole) {
            // API hasn't returned a subRole yet → use the default for this role
            setSubRole(DEFAULT_SUB_ROLE[mainRole]);
        }
    }, [mainRole]);

    /** Returns true if the current sub-role has this permission. */
    function can(permission: Permission): boolean {
        if (!subRole) return false;
        return hasPermission(subRole, permission);
    }

    /** Returns true if the current sub-role exactly matches. */
    function is(role: SubRole): boolean {
        return subRole === role;
    }

    /** Returns true when the sub-role is known (avoids flicker decisions). */
    const ready = subRole !== null;

    return { subRole, can, is, ready };
}

/**
 * RBAC permission matrix — single source of truth.
 *
 * To restrict a feature:
 *   1. Add a Permission key to types.ts  (if it doesn't exist yet)
 *   2. Grant it to the sub-roles that should have access below
 *   3. Use <SubRoleGate needs="..."> or can("...") at the call site
 *
 * To add a new sub-role:
 *   1. Add it to the SubRole union in types.ts
 *   2. Add an entry to ROLE_PERMISSIONS below
 */

import { Permission, SubRole } from "./types";

export const ROLE_PERMISSIONS: Record<SubRole, Permission[]> = {

    // ── Provider: Manager ─────────────────────────────────────────────────────
    manager: [
        "provider.dashboard.view",
        "provider.services.view",
        "provider.services.manage",   // create / edit / delete
        "provider.packages.view",
        "provider.packages.manage",
        "provider.results.view",      // view only, cannot send
        "provider.jobs.view",
        "provider.jobs.manage",       // assign staff to stops
        "provider.staff.view",        // staff management page
        "provider.finance.view",
        "provider.settings.manage",
    ],

    // ── Provider: Staff ───────────────────────────────────────────────────────
    staff: [
        "provider.dashboard.view",
        "provider.services.view",     // view only
        "provider.packages.view",     // view only
        "provider.results.view",
        "provider.results.send",      // only staff can send medical results
        "provider.jobs.view",         // only assigned stops
    ],

    // ── Agency: Manager (admin) ───────────────────────────────────────────────
    admin: [
        "agency.dashboard.view",
        "agency.tours.view",
        "agency.tours.manage",        // create / edit / delete
        "agency.vehicles.view",
        "agency.vehicles.manage",
        "agency.schedule.view",
        "agency.schedule.manage",
        "agency.guides.view",         // only managers see guides page
        "agency.tracking.view",       // manager view only
        "agency.finance.view",
        "agency.settings.manage",
    ],

    // ── Agency: Tour Guide ────────────────────────────────────────────────────
    tour_guide: [
        "agency.dashboard.view",
        "agency.tours.view",          // view only
        "agency.vehicles.view",       // view only
        "agency.schedule.view",       // own assigned schedules only
        "agency.jobs.view",           // accept / reject job assignments
        "agency.tracking.view",
        "agency.tracking.send",       // only tour guide can mark activities
    ],
};

/** Returns true if the given sub-role has the requested permission. */
export function hasPermission(subRole: SubRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[subRole]?.includes(permission) ?? false;
}

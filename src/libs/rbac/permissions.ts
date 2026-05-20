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
    // Full control over the provider workspace.
    manager: [
        "provider.dashboard.view",
        "provider.bookings.view",
        "provider.bookings.manage",
        "provider.services.view",
        "provider.services.create",
        "provider.services.edit",
        "provider.services.delete",
        "provider.packages.view",
        "provider.packages.create",
        "provider.packages.edit",
        "provider.packages.delete",
        "provider.results.view",
        "provider.results.send",
        "provider.customers.view",
        "provider.jobs.view",
        "provider.analytics.view",
        "provider.finance.view",
        "provider.settings.manage",
    ],

    // ── Provider: Staff ───────────────────────────────────────────────────────
    // Day-to-day work only: view bookings, send medical results, see customers.
    // Cannot create/edit services or packages, cannot see finance or analytics.
    staff: [
        "provider.dashboard.view",
        "provider.bookings.view",
        "provider.results.view",
        "provider.results.send",
        "provider.customers.view",
        "provider.jobs.view",
    ],

    // ── Agency: Admin ─────────────────────────────────────────────────────────
    // Full control over the agency workspace.
    admin: [
        "agency.dashboard.view",
        "agency.bookings.view",
        "agency.bookings.manage",
        "agency.tours.view",
        "agency.tours.create",
        "agency.tours.edit",
        "agency.tours.delete",
        "agency.vehicles.view",
        "agency.vehicles.manage",
        "agency.schedule.view",
        "agency.schedule.manage",
        "agency.guides.view",
        "agency.guides.assign",
        "agency.analytics.view",
        "agency.finance.view",
        "agency.settings.manage",
    ],

    // ── Agency: Tour Guide ────────────────────────────────────────────────────
    // Can view their assigned schedule and tour info only.
    // Cannot manage bookings, finance, settings, or assign other guides.
    tour_guide: [
        "agency.dashboard.view",
        "agency.tours.view",
        "agency.schedule.view",
        "agency.guides.view",
    ],
};

/** Returns true if the given sub-role has the requested permission. */
export function hasPermission(subRole: SubRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[subRole]?.includes(permission) ?? false;
}

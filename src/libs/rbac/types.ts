// ── Sub-roles ──────────────────────────────────────────────────────────────────
export type ProviderSubRole = "manager" | "staff";
export type AgencySubRole   = "admin" | "tour_guide";
export type SubRole         = ProviderSubRole | AgencySubRole;

// ── Permission keys ────────────────────────────────────────────────────────────
// Naming convention: "<main-role>.<resource>.<action>"
// Add new keys here, then grant them in permissions.ts.
export type Permission =
    // ── Provider ──────────────────────────────────────────────────────────────
    | "provider.dashboard.view"
    | "provider.bookings.view"
    | "provider.bookings.manage"       // approve / reject requests
    | "provider.services.view"
    | "provider.services.create"
    | "provider.services.edit"
    | "provider.services.delete"
    | "provider.packages.view"
    | "provider.packages.create"
    | "provider.packages.edit"
    | "provider.packages.delete"
    | "provider.results.view"
    | "provider.results.send"
    | "provider.customers.view"
    | "provider.jobs.view"
    | "provider.analytics.view"
    | "provider.finance.view"
    | "provider.settings.manage"
    // ── Agency ────────────────────────────────────────────────────────────────
    | "agency.dashboard.view"
    | "agency.bookings.view"
    | "agency.bookings.manage"         // approve / cancel bookings
    | "agency.tours.view"
    | "agency.tours.create"
    | "agency.tours.edit"
    | "agency.tours.delete"
    | "agency.vehicles.view"
    | "agency.vehicles.manage"
    | "agency.schedule.view"
    | "agency.schedule.manage"
    | "agency.guides.view"
    | "agency.guides.assign"
    | "agency.analytics.view"
    | "agency.finance.view"
    | "agency.settings.manage";

// Helper: default sub-role when the API doesn't return one yet
export const DEFAULT_SUB_ROLE: Record<"provider" | "agency", SubRole> = {
    provider: "manager",
    agency:   "admin",
};

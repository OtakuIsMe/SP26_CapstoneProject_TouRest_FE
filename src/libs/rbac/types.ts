// ── Sub-roles ──────────────────────────────────────────────────────────────────
export type ProviderSubRole = "manager" | "staff";
export type AgencySubRole   = "admin" | "tour_guide";
export type SubRole         = ProviderSubRole | AgencySubRole;

// ── Permission keys ────────────────────────────────────────────────────────────
export type Permission =
    // ── Provider ──────────────────────────────────────────────────────────────
    | "provider.dashboard.view"
    | "provider.services.view"
    | "provider.services.manage"      // create / edit / delete
    | "provider.packages.view"
    | "provider.packages.manage"      // create / edit / delete
    | "provider.results.view"
    | "provider.results.send"         // only staff can send results
    | "provider.jobs.view"
    | "provider.jobs.manage"          // assign staff to stops
    | "provider.staff.view"           // staff management page (manager only)
    | "provider.finance.view"
    | "provider.settings.manage"
    // ── Agency ────────────────────────────────────────────────────────────────
    | "agency.dashboard.view"
    | "agency.tours.view"
    | "agency.tours.manage"           // create / edit / delete
    | "agency.vehicles.view"
    | "agency.vehicles.manage"
    | "agency.schedule.view"
    | "agency.schedule.manage"
    | "agency.guides.view"            // manager only
    | "agency.jobs.view"              // tour guide job acceptance
    | "agency.tracking.view"
    | "agency.tracking.send"          // only tour guide can mark activities
    | "agency.finance.view"
    | "agency.settings.manage";

// Helper: default sub-role when the API doesn't return one yet
export const DEFAULT_SUB_ROLE: Record<"provider" | "agency", SubRole> = {
    provider: "manager",
    agency:   "admin",
};

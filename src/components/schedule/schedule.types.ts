import type { AgencyScheduleDTO } from "@/types/itinerary.type";

export type RunStatus = "confirmed" | "pending" | "ongoing" | "completed" | "cancelled";

export type ScheduleCalendarMode = "agency-manager" | "agency-guide" | "admin";

export interface TourRun {
    id: string;
    tourName: string;
    tourCode: string;
    startDate: string;
    endDate: string;
    departureTime: string;
    guide: string;
    slots: number;
    booked: number;
    status: RunStatus;
    destination: string;
    agencyName?: string;
    notes?: string;
}

export const STATUS_CFG: Record<RunStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    confirmed: { label: "Confirmed", color: "#065f46", bg: "#d1fae5", border: "#10b981", dot: "#22c55e" },
    pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7", border: "#f59e0b", dot: "#f59e0b" },
    ongoing:   { label: "Ongoing",   color: "#1d4ed8", bg: "#dbeafe", border: "#3b82f6", dot: "#3b82f6" },
    completed: { label: "Completed", color: "#1e40af", bg: "#dbeafe", border: "#3b82f6", dot: "#3b82f6" },
    cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2", border: "#ef4444", dot: "#ef4444" },
};

export const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const WEEKDAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

export const parseDate  = (s: string) => new Date(s + "T00:00:00");
export const isSameDay  = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export function fmtDate(s: string) {
    return new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function toDateStr(dt: string): string {
    const d = new Date(dt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtTime(dt: string): string {
    const d = new Date(dt);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function normalizeStatus(s: string): RunStatus {
    const lower = s?.toLowerCase() ?? "pending";
    if (lower === "confirmed" || lower === "pending" || lower === "ongoing" || lower === "completed" || lower === "cancelled")
        return lower as RunStatus;
    return "pending";
}

export function mapAgencyScheduleToTourRun(s: AgencyScheduleDTO, agencyName?: string): TourRun {
    return {
        id:            s.id,
        tourName:      s.itineraryName,
        tourCode:      s.id.slice(0, 8).toUpperCase(),
        startDate:     toDateStr(s.startTime),
        endDate:       toDateStr(s.endTime),
        departureTime: s.firstActivityTime ?? fmtTime(s.startTime),
        guide:         s.guideName ?? "Unassigned",
        slots:         s.spot,
        booked:        s.spot - s.spotLeft,
        status:        normalizeStatus(s.status),
        destination:   "",
        agencyName,
    };
}

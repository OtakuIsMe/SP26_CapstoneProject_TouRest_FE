"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import TourMapBuilder from "@/components/commons/tour-map-builder/tour-map-builder";
import { agencyService, ProviderMarker, CreateItineraryPayload } from "@/libs/services/agency.service";
import { userService } from "@/libs/services/user.service";
import type { UserDTO } from "@/types/user.type";
import { providerService } from "@/libs/services/provider.service";
import type { ServiceDTO } from "@/types/service.type";
import type { PackageWithServicesDTO } from "@/types/package.type";

// ── Types ─────────────────────────────────────────────────────────────────────
type TourStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

interface TourStop {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

interface ActivityItem {
    id: string;
    type: "service" | "package" | "custom";
    name: string;
    serviceName?: string;
    serviceId?: string;
    packageBasePrice?: number;
    startTime: string;
    endTime: string;
    price: number;
    note: string;
}

interface StopWithActivities extends TourStop {
    activities: ActivityItem[];
    providerId?: string;
}

interface TourSchedule {
    id: string;
    startTime: string;
    endTime: string;
    spot: number;
    spotLeft: number;
    guideId?: string;
    guideName?: string;
}

interface Itinerary {
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    status: TourStatus;
    stopCount: number;
    stops: { name: string; address: string }[];
    schedules: TourSchedule[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<TourStatus, { label: string; color: string; bg: string; accent: string }> = {
    ACTIVE:   { label: "Active",   color: "#15803d", bg: "#dcfce7", accent: "#22c55e" },
    DRAFT:    { label: "Draft",    color: "#b45309", bg: "#fef3c7", accent: "#f59e0b" },
    INACTIVE: { label: "Inactive", color: "#6b7280", bg: "#f3f4f6", accent: "#d1d5db" },
};

function fmtPrice(n: number) { return n.toLocaleString("vi-VN") + "đ"; }
function uid() { return Math.random().toString(36).slice(2); }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgencyToursPage() {
    const [tours, setTours] = useState<Itinerary[]>([]);
    const [toursLoading, setToursLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TourStatus | "">("");

    // Detail drawer
    const [detailTour, setDetailTour] = useState<Itinerary | null>(null);

    // Schedule modal
    const [schedTarget,  setSchedTarget]  = useState<Itinerary | null>(null);
    const [schedStart,   setSchedStart]   = useState("");
    const [schedEnd,     setSchedEnd]     = useState("");
    const [schedSpot,    setSchedSpot]    = useState("");
    const [schedGuideId, setSchedGuideId] = useState("");
    const [schedErr,     setSchedErr]     = useState("");
    const [agencyUsers,  setAgencyUsers]  = useState<UserDTO[]>([]);
    const [agencyId,     setAgencyId]     = useState<string>("");

    // Wizard modal
    const [wizOpen, setWizOpen]     = useState(false);
    const [wizStep, setWizStep]     = useState(1);
    const [editMode, setEditMode]   = useState(false);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);
    // step1
    const [wName, setWName]         = useState("");
    const [wDesc, setWDesc]         = useState("");
    const [wDays, setWDays]         = useState("");
    const [wStatus, setWStatus]     = useState<TourStatus>("DRAFT");
    const [wImages, setWImages]     = useState<File[]>([]);
    const [wImagePreviews, setWImagePreviews] = useState<string[]>([]);
    // step 2 – map itinerary
    const [wStops, setWStops]     = useState<StopWithActivities[]>([]);
    const [providerMarkers, setProviderMarkers] = useState<ProviderMarker[]>([]);
    const [confirmProvider, setConfirmProvider] = useState<ProviderMarker | null>(null);

    useEffect(() => {
        agencyService.getMe()
            .then(meRes => {
                if (!meRes.data) return;
                setAgencyId(meRes.data.id);
                // Pre-fetch all users for guide dropdown
                userService.getAllUsers()
                    .then(r => { if (r.data) setAgencyUsers(r.data); })
                    .catch(() => {});
                return agencyService.getMyItineraries();
            })
            .then(res => {
                if (res?.data) {
                    setTours(res.data.map(dto => ({
                        id: dto.id,
                        name: dto.name,
                        description: dto.description ?? "",
                        price: dto.price,
                        durationDays: dto.durationDays,
                        status: dto.status.toUpperCase() as TourStatus,
                        stopCount: dto.stopCount ?? 0,
                        stops: [],
                        schedules: [],
                    })));
                }
            })
            .catch(() => {})
            .finally(() => setToursLoading(false));
    }, []);

    useEffect(() => {
        agencyService.getProviderMarkers().then(res => {
            if (res.data) setProviderMarkers(res.data);
        }).catch(() => {});
    }, []);
    // pending stop (when user clicks the map)
    const [pendingMarker, setPendingMarker]         = useState<{ lat: number; lng: number } | null>(null);
    const [pendingName, setPendingName]             = useState("");
    const [pendingAddress, setPendingAddress]       = useState("");
    const [pendingAddrLoading, setPendingAddrLoading] = useState(false);
    // activity sub-modal
    const [actTarget, setActTarget] = useState<string | null>(null); // stopId
    const [actType, setActType]     = useState<"service"|"package"|"custom">("service");
    const [actServiceId, setActServiceId] = useState("");
    const [actPackageId, setActPackageId] = useState("");
    const [actCustomName, setActCustomName] = useState("");
    const [actStart, setActStart]   = useState("");
    const [actEnd, setActEnd]       = useState("");
    const [actPrice, setActPrice]   = useState("");
    const [actNote, setActNote]     = useState("");
    const [actServices, setActServices] = useState<ServiceDTO[]>([]);
    const [actPackages, setActPackages] = useState<PackageWithServicesDTO[]>([]);
    const [actDataLoading, setActDataLoading] = useState(false);
    const [providerPackagesCache, setProviderPackagesCache] = useState<Record<string, PackageWithServicesDTO[]>>({});
    const [wizSubmitting, setWizSubmitting] = useState(false);
    const [wizError, setWizError] = useState("");

    // Filtered tours
    const filtered = tours.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total:     tours.length,
        active:    tours.filter(t => t.status === "ACTIVE").length,
        draft:     tours.filter(t => t.status === "DRAFT").length,
        schedules: tours.reduce((acc, t) => acc + t.schedules.length, 0),
    };

    // ── Schedule handlers ────────────────────────────────────────────────────
    function openSched(tour: Itinerary) {
        setSchedTarget(tour);
        setSchedStart("");
        setSchedEnd("");
        setSchedSpot("");
        setSchedGuideId("");
        setSchedErr("");
    }

    async function submitSched() {
        if (!schedStart || !schedEnd)          { setSchedErr("Please select both start and end dates."); return; }
        if (schedEnd <= schedStart)            { setSchedErr("End date must be after start date."); return; }
        const spotNum = parseInt(schedSpot, 10);
        if (!schedSpot || isNaN(spotNum) || spotNum < 1) { setSchedErr("Spot must be at least 1."); return; }
        try {
            const res = await agencyService.addSchedule(
                schedTarget!.id,
                new Date(schedStart).toISOString(),
                new Date(schedEnd).toISOString(),
                spotNum,
                schedGuideId || undefined,
            );
            if (res.data) {
                const d = res.data;
                const newSched: TourSchedule = {
                    id: d.id, startTime: d.startTime, endTime: d.endTime,
                    spot: d.spot, spotLeft: d.spotLeft, guideId: d.guideId, guideName: d.guideName,
                };
                setTours(prev => prev.map(t =>
                    t.id === schedTarget!.id ? { ...t, schedules: [...t.schedules, newSched] } : t
                ));
                if (detailTour?.id === schedTarget!.id) {
                    setDetailTour(prev => prev ? { ...prev, schedules: [...prev.schedules, newSched] } : prev);
                }
            }
            setSchedTarget(null);
        } catch {
            setSchedErr("Failed to add schedule. Please try again.");
        }
    }

    // ── Wizard helpers ───────────────────────────────────────────────────────
    function handleMapClick(lat: number, lng: number) {
        setPendingMarker({ lat, lng });
        setPendingName("");
        setPendingAddress("");
        setPendingAddrLoading(true);
        fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "vi,en" } }
        )
            .then(r => r.json())
            .then(data => {
                if (data?.address) {
                    const parts = [
                        data.address.road || data.address.suburb || data.address.neighbourhood,
                        data.address.city || data.address.town || data.address.county,
                        data.address.state,
                    ].filter(Boolean);
                    setPendingAddress(parts.join(", "));
                } else if (data?.display_name) {
                    setPendingAddress(data.display_name.split(",").slice(0, 3).join(",").trim());
                }
            })
            .catch(() => {})
            .finally(() => setPendingAddrLoading(false));
    }

    function confirmPendingStop() {
        if (!pendingMarker || !pendingName.trim()) return;
        setWStops(prev => [...prev, {
            id: uid(),
            name: pendingName.trim(),
            address: pendingAddress.trim(),
            latitude: pendingMarker.lat,
            longitude: pendingMarker.lng,
            activities: [],
        }]);
        setPendingMarker(null);
        setPendingName("");
        setPendingAddress("");
    }

    function confirmProviderAsStop() {
        if (!confirmProvider) return;
        setWStops(prev => [...prev, {
            id: uid(),
            name: confirmProvider.name,
            address: confirmProvider.address ?? "",
            latitude: Number(confirmProvider.latitude),
            longitude: Number(confirmProvider.longitude),
            activities: [],
            providerId: confirmProvider.id,
        }]);
        setConfirmProvider(null);
    }

    function removeStop(id: string) { setWStops(prev => prev.filter(s => s.id !== id)); }

    function openAddActivity(stopId: string) {
        const stop = wStops.find(s => s.id === stopId);
        const defaultType = stop?.providerId ? "service" : "custom";
        setActTarget(stopId);
        setActType(defaultType);
        setActServiceId("");
        setActPackageId("");
        setActCustomName("");
        setActStart("");
        setActEnd("");
        setActPrice("");
        setActNote("");
        setActServices([]);
        setActPackages([]);
        if (stop?.providerId) {
            if (defaultType === "service") fetchActServices(stop.providerId);
            // Pre-fetch packages into cache for bundle detection (silent)
            if (!providerPackagesCache[stop.providerId]) {
                providerService.getPackagesByProvider(stop.providerId).then(res => {
                    if (res.data) setProviderPackagesCache(prev => ({ ...prev, [stop.providerId!]: res.data }));
                }).catch(() => {});
            }
        }
    }

    function fetchActServices(providerId: string) {
        setActDataLoading(true);
        providerService.getServicesByProvider(providerId)
            .then(res => setActServices(res.data ?? []))
            .catch(() => {})
            .finally(() => setActDataLoading(false));
    }

    function fetchActPackages(providerId: string) {
        setActDataLoading(true);
        providerService.getPackagesByProvider(providerId)
            .then(res => setActPackages(res.data ?? []))
            .catch(() => {})
            .finally(() => setActDataLoading(false));
    }

    function addMinutes(time: string, minutes: number): string {
        if (!time) return "";
        const [h, m] = time.split(":").map(Number);
        const total = h * 60 + m + minutes;
        const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
        const mm = String(total % 60).padStart(2, "0");
        return `${hh}:${mm}`;
    }

    function handleActServiceSelect(id: string) {
        setActServiceId(id);
        const svc = actServices.find(s => s.id === id);
        if (svc && actStart) setActEnd(addMinutes(actStart, svc.durationMinutes));
    }

    function handleActPackageSelect(id: string) {
        setActPackageId(id);
        const pkg = actPackages.find(p => p.id === id);
        if (pkg && actStart) {
            const total = pkg.services.reduce((sum, s) => sum + s.serviceDurationMinutes, 0);
            setActEnd(addMinutes(actStart, total));
        }
    }

    function handleActStartChange(val: string) {
        setActStart(val);
        if (!val) return;
        if (actType === "service" && actServiceId) {
            const svc = actServices.find(s => s.id === actServiceId);
            if (svc) setActEnd(addMinutes(val, svc.durationMinutes));
        } else if (actType === "package" && actPackageId) {
            const pkg = actPackages.find(p => p.id === actPackageId);
            if (pkg) {
                const total = pkg.services.reduce((sum, s) => sum + s.serviceDurationMinutes, 0);
                setActEnd(addMinutes(val, total));
            }
        }
    }

    function handleActTypeChange(type: "service" | "package" | "custom") {
        setActType(type);
        setActServiceId("");
        setActPackageId("");
        const providerId = wStops.find(s => s.id === actTarget)?.providerId;
        if (!providerId) return;
        if (type === "service" && actServices.length === 0) fetchActServices(providerId);
        if (type === "package" && actPackages.length === 0) fetchActPackages(providerId);
    }

    function confirmAddActivity() {
        if (!actTarget) return;
        const stopIdx = wStops.findIndex(s => s.id === actTarget);
        if (stopIdx === -1) return;
        const newActs: ActivityItem[] = [];

        if (actType === "service" && actServiceId) {
            const svc = actServices.find(s => s.id === actServiceId)!;
            newActs.push({ id: uid(), type: "service", name: svc.name, serviceId: svc.id, startTime: actStart, endTime: actEnd, price: Number(actPrice) || svc.price, note: actNote });
        } else if (actType === "package" && actPackageId) {
            const pkg = actPackages.find(p => p.id === actPackageId)!;
            let cursor = actStart;
            for (const ps of pkg.services) {
                const dur = Number(ps.serviceDurationMinutes) || 60;
                const end = cursor ? addMinutes(cursor, dur) : "";
                newActs.push({ id: uid(), type: "package", name: ps.serviceName, serviceId: ps.serviceId, serviceName: pkg.name, packageBasePrice: pkg.basePrice, startTime: cursor, endTime: end, price: ps.servicePrice, note: actNote });
                if (end) cursor = end;
            }
        } else if (actType === "custom" && actCustomName) {
            newActs.push({ id: uid(), type: "custom", name: actCustomName, startTime: actStart, endTime: actEnd, price: Number(actPrice) || 0, note: actNote });
        }

        if (!newActs.length) return;

        const currentStop = wStops.find(s => s.id === actTarget)!;
        const candidateStop: StopWithActivities = { ...currentStop, activities: [...currentStop.activities, ...newActs] };

        // Auto-detect and apply bundle when adding services
        if (actType === "service") {
            const bundle = detectBundle(candidateStop);
            if (bundle) {
                const matchedIds = new Set(bundle.matched.map(a => a.id));
                const firstStart = bundle.matched.reduce((e, a) => (!e || (a.startTime && a.startTime < e)) ? a.startTime : e, "");
                let cursor = firstStart;
                const pkgActs: ActivityItem[] = bundle.pkg.services.map(ps => {
                    const dur = Number(ps.serviceDurationMinutes) || 60;
                    const end = cursor ? addMinutes(cursor, dur) : "";
                    const act: ActivityItem = { id: uid(), type: "package", name: ps.serviceName, serviceId: ps.serviceId, serviceName: bundle.pkg.name, packageBasePrice: bundle.pkg.basePrice, startTime: cursor, endTime: end, price: ps.servicePrice, note: "" };
                    if (end) cursor = end;
                    return act;
                });
                const finalActivities = [...candidateStop.activities.filter(a => !matchedIds.has(a.id)), ...pkgActs];
                setWStops(prev => prev.map(s => s.id === actTarget ? { ...s, activities: finalActivities } : s));
                setActTarget(null);
                return;
            }
        }

        setWStops(prev => prev.map(s => s.id === actTarget ? candidateStop : s));
        setActTarget(null);
    }

    function removeActivity(stopId: string, actId: string) {
        setWStops(prev => prev.map(s => {
            if (s.id !== stopId) return s;
            const target = s.activities.find(a => a.id === actId);
            if (target?.type === "package" && target.serviceName) {
                const pkgName = target.serviceName;
                return {
                    ...s,
                    activities: s.activities
                        .filter(a => a.id !== actId)
                        .map(a => a.type === "package" && a.serviceName === pkgName
                            ? { ...a, type: "service" as const, serviceName: undefined }
                            : a),
                };
            }
            return { ...s, activities: s.activities.filter(a => a.id !== actId) };
        }));
    }

    function detectBundle(stop: StopWithActivities): { pkg: PackageWithServicesDTO; matched: ActivityItem[]; savings: number } | null {
        if (!stop.providerId) return null;
        const packages = providerPackagesCache[stop.providerId] ?? [];
        const serviceActs = stop.activities.filter(a => a.type === "service" && a.serviceId);
        const serviceIdSet = new Set(serviceActs.map(a => a.serviceId!));
        for (const pkg of packages) {
            const pkgIds = pkg.services.map(s => s.serviceId);
            if (pkgIds.length < 2) continue;
            if (pkgIds.every(id => serviceIdSet.has(id))) {
                const matched = serviceActs.filter(a => pkgIds.includes(a.serviceId!));
                const individualTotal = matched.reduce((sum, a) => sum + a.price, 0);
                const savings = individualTotal - pkg.basePrice;
                if (savings > 0) return { pkg, matched, savings };
            }
        }
        return null;
    }


    function openEdit(tour: Itinerary) {
        setEditMode(true);
        setEditTargetId(tour.id);
        setWName(tour.name);
        setWDesc(tour.description);
        setWDays(String(tour.durationDays));
        setWStatus(tour.status);
        setWizStep(1);
        setWizError("");
        setWizOpen(true);
    }

    function closeWizard() {
        setWizOpen(false);
        setWizStep(1);
        setEditMode(false);
        setEditTargetId(null);
        setWName(""); setWDesc(""); setWDays(""); setWStatus("DRAFT");
        setWImages([]); setWImagePreviews([]);
        setWStops([]);
        setPendingMarker(null); setPendingName(""); setPendingAddress("");
    }

    async function submitWizard() {
        setWizError("");
        setWizSubmitting(true);

        // ── Edit mode ────────────────────────────────────────────────────────
        if (editMode && editTargetId) {
            const target = tours.find(t => t.id === editTargetId)!;
            try {
                const res = await agencyService.updateItinerary(editTargetId, {
                    agencyId: editTargetId,
                    name: wName.trim(),
                    description: wDesc.trim(),
                    price: target.price,
                    durationDays: Number(wDays) || 1,
                    status: wStatus,
                });
                if (res.data) {
                    const updated: Itinerary = {
                        ...target,
                        name: res.data.name,
                        description: res.data.description ?? "",
                        durationDays: res.data.durationDays,
                        price: res.data.price,
                        status: res.data.status.toUpperCase() as TourStatus,
                    };
                    setTours(prev => prev.map(t => t.id === updated.id ? updated : t));
                    if (detailTour?.id === updated.id) setDetailTour(prev => prev ? { ...prev, ...updated } : prev);
                }
                closeWizard();
            } catch {
                setWizError("Failed to save changes. Please try again.");
            } finally {
                setWizSubmitting(false);
            }
            return;
        }

        // ── Create mode ──────────────────────────────────────────────────────
        const totalPrice = wStops.reduce((grand, stop) => {
            const seen = new Set<string>();
            return grand + stop.activities.reduce((sum, a) => {
                if (a.type === "package" && a.serviceName && a.packageBasePrice !== undefined) {
                    if (seen.has(a.serviceName)) return sum;
                    seen.add(a.serviceName);
                    return sum + a.packageBasePrice;
                }
                return sum + a.price;
            }, 0);
        }, 0);
        const stops = wStops.map((stop, idx) => ({
            stopOrder: idx,
            name: stop.name,
            longitude: stop.longitude,
            latitude: stop.latitude,
            address: stop.address ?? "",
            providerId: stop.providerId,
            activities: stop.activities
                .filter(a => a.serviceId)
                .map((act, jdx) => ({
                    serviceId: act.serviceId!,
                    activityOrder: jdx,
                    startTime: act.startTime || "",
                    endTime: act.endTime || "",
                    price: act.price,
                    note: act.note,
                })),
        }));
        const formData = new FormData();
        formData.append("name", wName.trim());
        formData.append("description", wDesc.trim());
        formData.append("duration", String(Number(wDays) || 1));
        formData.append("price", String(totalPrice));
        formData.append("stopsJson", JSON.stringify(stops));
        wImages.forEach(f => formData.append("images", f));
        try {
            const created = await agencyService.createItinerary(formData);
            if (created.data) {
                const dto = created.data;
                setTours(prev => [{
                    id: dto.id,
                    name: dto.name,
                    description: dto.description ?? "",
                    price: dto.price,
                    durationDays: dto.durationDays,
                    status: dto.status.toUpperCase() as TourStatus,
                    stopCount: dto.stopCount ?? 0,
                    stops: [],
                    schedules: [],
                }, ...prev]);
            }
            closeWizard();
        } catch {
            setWizError("Failed to create tour. Please try again.");
        } finally {
            setWizSubmitting(false);
        }
    }

    const ACTIVITY_TYPE_COLOR: Record<string, { bg: string; color: string }> = {
        service: { bg: "#eff6ff", color: "#3b82f6" },
        package: { bg: "#f5f3ff", color: "#7c3aed" },
        custom:  { bg: "#f0fdf4", color: "#16a34a" },
    };

    return (
        <div className={styles.page}>

            {/* ── Stats ── */}
            <div className={styles.statsRow}>
                {[
                    { label: "Total Tours",      value: stats.total,     bg: "#eff6ff", color: "#3b82f6",
                      icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg> },
                    { label: "Active Tours",     value: stats.active,    bg: "#f0fdf4", color: "#16a34a",
                      icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                    { label: "Drafts",           value: stats.draft,     bg: "#fffbeb", color: "#d97706",
                      icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
                    { label: "Upcoming Schedules", value: stats.schedules, bg: "#f5f3ff", color: "#7c3aed",
                      icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
                ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div className={styles.statBody}>
                            <p className={styles.statLabel}>{s.label}</p>
                            <p className={styles.statValue}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Top bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <div className={styles.searchBox}>
                        <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        <input placeholder="Search tours…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value as TourStatus | "")}>
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DRAFT">Draft</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>
                <button className={styles.addBtn} onClick={() => { setWizOpen(true); setWizStep(1); }}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    New Tour
                </button>
            </div>

            {/* ── Tour cards ── */}
            <div className={styles.tourGrid}>
                {toursLoading && <p style={{ color: "#6b7280", gridColumn: "1/-1" }}>Loading tours…</p>}
                {!toursLoading && filtered.length === 0 && <p style={{ color: "#6b7280", gridColumn: "1/-1" }}>No tours found.</p>}
                {filtered.map(tour => {
                    const cfg = STATUS_CFG[tour.status];
                    const upcomingCount = tour.schedules.filter(s => new Date(s.endTime) >= new Date()).length;
                    return (
                        <div key={tour.id} className={styles.tourCard} style={{ borderTop: `3px solid ${cfg.accent}` }}>

                            {/* ── Head: name + badge + description ── */}
                            <div className={styles.tourCardHead}>
                                <div className={styles.tourCardTopRow}>
                                    <h3 className={styles.tourName}>{tour.name}</h3>
                                    <span className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                </div>
                                {tour.description && <p className={styles.tourDesc}>{tour.description}</p>}
                            </div>

                            {/* ── Meta pills ── */}
                            <div className={styles.tourMeta}>
                                <span className={styles.tourMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    {tour.durationDays} days
                                </span>
                                <span className={styles.tourMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    {fmtPrice(tour.price)}
                                </span>
                                <span className={styles.tourMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                                    {tour.stopCount} {tour.stopCount === 1 ? "stop" : "stops"}
                                </span>
                                {upcomingCount > 0 && (
                                    <span className={styles.tourMetaItem} style={{ marginLeft: "auto", background: "#f5f3ff", border: "1px solid #ede9fe", color: "#6d28d9" }}>
                                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                        {upcomingCount} upcoming
                                    </span>
                                )}
                            </div>

                            {/* ── Stop route chips ── */}
                            {tour.stops.length > 0 && (
                                <div className={styles.tourStops}>
                                    {tour.stops.map((s, i) => (
                                        <div key={s.name} className={styles.stopChipWrapper}>
                                            <span className={styles.stopChipNum}>{i + 1}</span>
                                            <span className={styles.stopChipName}>{s.name}</span>
                                            {i < tour.stops.length - 1 && (
                                                <span className={styles.stopArrow}>
                                                    <svg viewBox="0 0 16 8" fill="none" width="16" height="8">
                                                        <path d="M0 4h14M10 1l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Actions footer ── */}
                            <div className={styles.tourCardActions}>
                                <button className={styles.actionBtn} onClick={() => {
                                        setDetailTour(tour);
                                        agencyService.getSchedules(tour.id).then(res => {
                                            if (res.data) {
                                                const scheds: TourSchedule[] = res.data.map(s => ({
                                                    id: s.id, startTime: s.startTime, endTime: s.endTime,
                                                    spot: s.spot, spotLeft: s.spotLeft, guideId: s.guideId, guideName: s.guideName,
                                                }));
                                                setDetailTour(prev => prev?.id === tour.id ? { ...prev, schedules: scheds } : prev);
                                                setTours(prev => prev.map(t => t.id === tour.id ? { ...t, schedules: scheds } : t));
                                            }
                                        }).catch(() => {});
                                    }}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                                    View
                                </button>
                                <button className={styles.actionBtn} onClick={() => openEdit(tour)}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    Edit
                                </button>
                                <button className={`${styles.actionBtn} ${styles.actionBtnGreen}`} onClick={() => openSched(tour)}>
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    + Schedule
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ════════════════ DETAIL DRAWER ════════════════ */}
            {detailTour && (
                <div className={styles.drawerOverlay} onClick={() => setDetailTour(null)}>
                    <aside className={styles.drawer} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className={styles.drawerHeader}>
                            <div className={styles.drawerHeaderLeft}>
                                <span
                                    className={styles.drawerStatusDot}
                                    style={{ background: STATUS_CFG[detailTour.status].accent }}
                                />
                                <div>
                                    <h2 className={styles.drawerTitle}>{detailTour.name}</h2>
                                    <span
                                        className={styles.drawerStatusBadge}
                                        style={{ background: STATUS_CFG[detailTour.status].bg, color: STATUS_CFG[detailTour.status].color }}
                                    >
                                        {STATUS_CFG[detailTour.status].label}
                                    </span>
                                </div>
                            </div>
                            <button className={styles.drawerCloseBtn} onClick={() => setDetailTour(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className={styles.drawerBody}>

                            {/* Overview */}
                            <section className={styles.drawerSection}>
                                <h3 className={styles.drawerSectionTitle}>
                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    Overview
                                </h3>
                                <div className={styles.drawerMetaGrid}>
                                    <div className={styles.drawerMetaCell}>
                                        <span className={styles.drawerMetaLabel}>Price</span>
                                        <span className={styles.drawerMetaValue} style={{ color: "#4f46e5" }}>{fmtPrice(detailTour.price)}</span>
                                    </div>
                                    <div className={styles.drawerMetaCell}>
                                        <span className={styles.drawerMetaLabel}>Duration</span>
                                        <span className={styles.drawerMetaValue}>{detailTour.durationDays} day{detailTour.durationDays !== 1 ? "s" : ""}</span>
                                    </div>
                                    <div className={styles.drawerMetaCell}>
                                        <span className={styles.drawerMetaLabel}>Stops</span>
                                        <span className={styles.drawerMetaValue}>{detailTour.stopCount}</span>
                                    </div>
                                    <div className={styles.drawerMetaCell}>
                                        <span className={styles.drawerMetaLabel}>Upcoming</span>
                                        <span className={styles.drawerMetaValue}>
                                            {detailTour.schedules.filter(s => new Date(s.endTime) >= new Date()).length}
                                        </span>
                                    </div>
                                </div>
                                {detailTour.description && (
                                    <p className={styles.drawerDesc}>{detailTour.description}</p>
                                )}
                            </section>

                            {/* Stops */}
                            {detailTour.stops.length > 0 && (
                                <section className={styles.drawerSection}>
                                    <h3 className={styles.drawerSectionTitle}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                                        Itinerary Stops
                                    </h3>
                                    <div className={styles.drawerStopList}>
                                        {detailTour.stops.map((s, i) => (
                                            <div key={i} className={styles.drawerStopRow}>
                                                <div className={styles.drawerStopTrack}>
                                                    <span className={styles.drawerStopNum}>{i + 1}</span>
                                                    {i < detailTour.stops.length - 1 && <span className={styles.drawerStopLine} />}
                                                </div>
                                                <div className={styles.drawerStopInfo}>
                                                    <p className={styles.drawerStopName}>{s.name}</p>
                                                    <p className={styles.drawerStopAddr}>{s.address}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Schedules */}
                            <section className={styles.drawerSection}>
                                <div className={styles.drawerSectionTitleRow}>
                                    <h3 className={styles.drawerSectionTitle}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                        Schedules
                                    </h3>
                                    <button
                                        className={styles.drawerAddSchedBtn}
                                        onClick={() => { const t = detailTour; setDetailTour(null); setTimeout(() => openSched(t), 50); }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                        Add
                                    </button>
                                </div>

                                {detailTour.schedules.length === 0 ? (
                                    <div className={styles.drawerEmptySched}>
                                        <svg viewBox="0 0 24 24" fill="none" width="28" height="28"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#d1d5db" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                        <p>No schedules yet</p>
                                        <span>Add a departure date to start accepting bookings</span>
                                    </div>
                                ) : (
                                    <div className={styles.drawerSchedList}>
                                        {detailTour.schedules
                                            .slice()
                                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                            .map((sched, idx) => {
                                                const start = new Date(sched.startTime);
                                                const end   = new Date(sched.endTime);
                                                const days  = Math.ceil((end.getTime() - start.getTime()) / 86400000);
                                                const isPast    = end < new Date();
                                                const isActive  = start <= new Date() && end >= new Date();
                                                const isUpcoming = start > new Date();
                                                const schedStatus = isPast ? "past" : isActive ? "active" : "upcoming";
                                                const SCHED_CFG = {
                                                    past:     { label: "Past",     bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
                                                    active:   { label: "Active",   bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
                                                    upcoming: { label: "Upcoming", bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
                                                };
                                                const cfg = SCHED_CFG[schedStatus];
                                                const fmt = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                                                return (
                                                    <div key={sched.id} className={styles.drawerSchedCard}>
                                                        <div className={styles.drawerSchedIndex}>{idx + 1}</div>
                                                        <div className={styles.drawerSchedContent}>
                                                            <div className={styles.drawerSchedDates}>
                                                                <div className={styles.drawerSchedDateBlock}>
                                                                    <span className={styles.drawerSchedDateLabel}>Departure</span>
                                                                    <span className={styles.drawerSchedDateValue}>{fmt(start)}</span>
                                                                </div>
                                                                <div className={styles.drawerSchedArrow}>
                                                                    <svg viewBox="0 0 24 6" fill="none" width="32" height="6">
                                                                        <path d="M0 3h20M16 1l4 2-4 2" stroke="#d1d5db" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    </svg>
                                                                    <span className={styles.drawerSchedDays}>{days}d</span>
                                                                </div>
                                                                <div className={styles.drawerSchedDateBlock}>
                                                                    <span className={styles.drawerSchedDateLabel}>Return</span>
                                                                    <span className={styles.drawerSchedDateValue}>{fmt(end)}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                                                <span
                                                                    className={styles.drawerSchedStatusBadge}
                                                                    style={{ background: cfg.bg, color: cfg.color }}
                                                                >
                                                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
                                                                    {cfg.label}
                                                                </span>
                                                                {sched.spot > 0 && (
                                                                    <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:999, background: sched.spotLeft === 0 ? "#fee2e2" : "#f3f4f6", color: sched.spotLeft === 0 ? "#dc2626" : "#6b7280" }}>
                                                                        {sched.spotLeft}/{sched.spot} spots
                                                                    </span>
                                                                )}
                                                                {sched.guideName && (
                                                                    <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:999, background:"#eef2ff", color:"#4f46e5" }}>
                                                                        {sched.guideName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className={styles.drawerSchedDeleteBtn}
                                                            title="Remove schedule"
                                                            onClick={() => {
                                                                agencyService.deleteSchedule(detailTour.id, sched.id).then(() => {
                                                                    const updated = { ...detailTour, schedules: detailTour.schedules.filter(s => s.id !== sched.id) };
                                                                    setTours(prev => prev.map(t => t.id === detailTour.id ? updated : t));
                                                                    setDetailTour(updated);
                                                                }).catch(() => {});
                                                            }}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </section>
                        </div>
                    </aside>
                </div>
            )}

            {/* ════════════════ SCHEDULE MODAL ════════════════ */}
            {schedTarget && (
                <div className={styles.overlay} onClick={() => setSchedTarget(null)}>
                    <div className={styles.schedModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>Add Schedule</h3>
                                <p className={styles.modalSubtitle}>{schedTarget.name}</p>
                            </div>
                            <button className={styles.modalCloseBtn} onClick={() => setSchedTarget(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p style={{ fontSize:13, color:"#6b7280", margin:"0 0 14px" }}>
                                Set the departure and return dates for this tour run. Guests will see this as an available booking slot.
                            </p>

                            {/* Row 1: Dates */}
                            <div className={styles.fieldRow}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Departure Date <span className={styles.required}>*</span></label>
                                    <input
                                        className={`${styles.input} ${schedErr && !schedStart ? styles.inputError : ""}`}
                                        type="date" value={schedStart}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setSchedStart(val);
                                            setSchedErr("");
                                            if (val && schedTarget) {
                                                const d = new Date(val);
                                                d.setDate(d.getDate() + schedTarget.durationDays);
                                                setSchedEnd(d.toISOString().slice(0, 10));
                                            }
                                        }}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Return Date <span className={styles.required}>*</span></label>
                                    <input
                                        className={`${styles.input} ${schedErr && !schedEnd ? styles.inputError : ""}`}
                                        type="date" value={schedEnd} min={schedStart}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setSchedEnd(val);
                                            setSchedErr("");
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Duration preview */}
                            {schedStart && schedEnd && (
                                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:9, padding:"10px 14px", fontSize:13, color:"#15803d", display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    {schedTarget?.durationDays} days · {new Date(schedStart).toLocaleDateString("en-GB")} → {new Date(schedEnd).toLocaleDateString("en-GB")}
                                </div>
                            )}

                            {/* Row 2: Spot + Guide */}
                            <div className={styles.fieldRow}>
                                <div className={styles.field}>
                                    <label className={styles.label}>
                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ verticalAlign:"middle", marginRight:4 }}>
                                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                        Spots (capacity) <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        className={`${styles.input} ${schedErr && (!schedSpot || parseInt(schedSpot) < 1) ? styles.inputError : ""}`}
                                        type="number" min="1" placeholder="e.g. 20"
                                        value={schedSpot}
                                        onChange={e => { setSchedSpot(e.target.value); setSchedErr(""); }}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>
                                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ verticalAlign:"middle", marginRight:4 }}>
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                                        </svg>
                                        Tour Guide
                                    </label>
                                    <select
                                        className={`${styles.input} ${styles.select}`}
                                        value={schedGuideId}
                                        onChange={e => setSchedGuideId(e.target.value)}
                                    >
                                        <option value="">— No guide assigned —</option>
                                        {agencyUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.username}{u.fullName ? ` (${u.fullName})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Spot summary */}
                            {schedSpot && parseInt(schedSpot) > 0 && (
                                <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:9, padding:"10px 14px", fontSize:13, color:"#1d4ed8", display:"flex", alignItems:"center", gap:7 }}>
                                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                                    {schedSpot} spots available · all open on departure
                                </div>
                            )}

                            {schedErr && <p className={styles.errorMsg} style={{ marginTop:10 }}>{schedErr}</p>}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setSchedTarget(null)}>Cancel</button>
                            <button className={styles.btnSubmit} onClick={submitSched}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                Add Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ CREATE TOUR WIZARD ════════════════ */}
            {wizOpen && (
                <div className={styles.overlay} onClick={closeWizard}>
                    <div className={styles.wizardModal} onClick={e => e.stopPropagation()}>

                        {/* Step bar — hidden in edit mode */}
                        <div className={styles.wizardSteps} style={editMode ? { display: "none" } : undefined}>
                            {[
                                { n:1, label:"Basic Info"    },
                                { n:2, label:"Itinerary Map" },
                                { n:3, label:"Review"        },
                            ].map((s, i, arr) => (
                                <div key={s.n} className={styles.wizardStep}>
                                    <div className={`${styles.stepCircle} ${wizStep > s.n ? styles.stepCircleDone : wizStep === s.n ? styles.stepCircleActive : ""}`}>
                                        {wizStep > s.n
                                            ? <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            : s.n
                                        }
                                    </div>
                                    <span className={`${styles.stepLabel} ${wizStep > s.n ? styles.stepLabelDone : wizStep === s.n ? styles.stepLabelActive : ""}`}>{s.label}</span>
                                    {i < arr.length - 1 && <div className={`${styles.stepLine} ${wizStep > s.n ? styles.stepLineDone : ""}`} />}
                                </div>
                            ))}
                        </div>

                        {/* ── Step 1: Basic Info ── */}
                        {wizStep === 1 && (
                            <div className={styles.wizardBody}>
                                <div>
                                    <p className={styles.stepTitle}>{editMode ? "Edit Tour" : "Basic Information"}</p>
                                    <p className={styles.stepSubtitle}>{editMode ? "Update the tour name, description, duration and status." : "Give your itinerary a name, description and duration."}</p>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Tour Name <span className={styles.required}>*</span></label>
                                    <input className={styles.input} placeholder="e.g. Ha Long Bay Wellness Retreat" value={wName} onChange={e => setWName(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Description</label>
                                    <textarea className={styles.textarea} placeholder="Briefly describe this tour…" rows={3} value={wDesc} onChange={e => setWDesc(e.target.value)} />
                                </div>
                                <div className={`${styles.fieldRow} ${editMode ? "" : ""}`}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Duration (days) <span className={styles.required}>*</span></label>
                                        <input className={styles.input} type="number" min="1" placeholder="3" value={wDays} onChange={e => setWDays(e.target.value)} />
                                    </div>
                                    {editMode && (
                                        <div className={styles.field}>
                                            <label className={styles.label}>Status</label>
                                            <select className={`${styles.input} ${styles.select}`} value={wStatus} onChange={e => setWStatus(e.target.value as TourStatus)}>
                                                <option value="DRAFT">Draft</option>
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                {!editMode && (
                                    <div className={styles.field}>
                                        <label className={styles.label}>Tour Images</label>
                                        <label className={styles.imageUploadArea}>
                                            <input
                                                type="file" accept="image/*" multiple style={{ display: "none" }}
                                                onChange={e => {
                                                    const files = Array.from(e.target.files ?? []);
                                                    setWImages(prev => [...prev, ...files]);
                                                    setWImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                                                    e.target.value = "";
                                                }}
                                            />
                                            <svg viewBox="0 0 24 24" fill="none" width="20" height="20" style={{ color: "#9ca3af" }}>
                                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span style={{ fontSize: 13, color: "#6b7280" }}>Click to upload images</span>
                                        </label>
                                        {wImagePreviews.length > 0 && (
                                            <div className={styles.imagePreviews}>
                                                {wImagePreviews.map((src, i) => (
                                                    <div key={i} className={styles.imagePreviewWrap}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={src} alt="" className={styles.imagePreviewImg} />
                                                        <button type="button" className={styles.imagePreviewRemove} onClick={() => {
                                                            setWImages(prev => prev.filter((_, j) => j !== i));
                                                            setWImagePreviews(prev => prev.filter((_, j) => j !== i));
                                                        }}>×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 2: Itinerary Map ── */}
                        {wizStep === 2 && (
                            <div className={styles.wizardBodyFull}>
                                <div className={styles.mapItineraryStep}>
                                    <div>
                                        <p className={styles.stepTitle}>Build Your Itinerary</p>
                                        <p className={styles.stepSubtitle}>Click on the map to add stops. For each stop, add services or packages as activities.</p>
                                    </div>
                                    <div className={styles.mapItineraryContent}>
                                        {/* Left: interactive map */}
                                        <TourMapBuilder
                                            stops={wStops.map(s => ({ id: s.id, name: s.name, latitude: s.latitude, longitude: s.longitude }))}
                                            onMapClick={handleMapClick}
                                            providers={providerMarkers}
                                            onProviderClick={p => setConfirmProvider(p)}
                                        />

                                        {/* Right: stops panel */}
                                        <div className={styles.stopsScrollPanel}>
                                            {wStops.length === 0 ? (
                                                <div className={styles.emptyStopsHint}>
                                                    <svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/></svg>
                                                    <p>No stops yet</p>
                                                    <p>Click anywhere on the map to pin your first stop</p>
                                                </div>
                                            ) : (
                                                wStops.map((stop, idx) => (
                                                    <div key={stop.id} className={styles.stopPanelCard}>
                                                        <div className={styles.stopPanelHead}>
                                                            <span className={styles.stopNumBadge}>{idx + 1}</span>
                                                            <div className={styles.stopPanelInfo}>
                                                                <p className={styles.stopPanelName}>{stop.name}</p>
                                                                {stop.address && <p className={styles.stopPanelAddr}>{stop.address}</p>}
                                                            </div>
                                                            <button className={styles.stopDeleteBtn} onClick={() => removeStop(stop.id)}>
                                                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                                            </button>
                                                        </div>
                                                        {stop.activities.length > 0 && (
                                                            <div className={styles.stopPanelActivities}>
                                                                {stop.activities.map(act => {
                                                                    const tc = ACTIVITY_TYPE_COLOR[act.type];
                                                                    return (
                                                                        <div key={act.id} className={styles.stopPanelActivity}>
                                                                            <span style={{ background: tc.bg, color: tc.color, fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4, flexShrink: 0, textTransform: "uppercase" }}>{act.type}</span>
                                                                            <span className={styles.stopPanelActivityName}>{act.name}</span>
                                                                            {(act.startTime || act.endTime) && (
                                                                                <span className={styles.stopPanelActivityTime}>
                                                                                    {act.startTime || "?"}{act.endTime ? `–${act.endTime}` : ""}
                                                                                </span>
                                                                            )}
                                                                            <button className={styles.stopPanelActivityDelete} onClick={() => removeActivity(stop.id, act.id)}>
                                                                                <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <button className={styles.stopPanelAddActBtn} onClick={() => openAddActivity(stop.id)}>
                                                            <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                                            Add Activity
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {wStops.length > 0 && (() => {
                                            const total = wStops.reduce((grand, stop) => {
                                                const seen = new Set<string>();
                                                return grand + stop.activities.reduce((sum, a) => {
                                                    if (a.type === "package" && a.serviceName && a.packageBasePrice !== undefined) {
                                                        if (seen.has(a.serviceName)) return sum;
                                                        seen.add(a.serviceName);
                                                        return sum + a.packageBasePrice;
                                                    }
                                                    return sum + a.price;
                                                }, 0);
                                            }, 0);
                                            return total > 0 ? (
                                                <div style={{ padding: "10px 14px", borderTop: "1px solid #e5e7eb", background: "#f9fafb", borderRadius: "0 0 10px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Total activities</span>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>{fmtPrice(total)}</span>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Review ── */}
                        {wizStep === 3 && (
                            <div className={styles.wizardBody}>
                                <div>
                                    <p className={styles.stepTitle}>Review & Create</p>
                                    <p className={styles.stepSubtitle}>Double-check everything before creating the tour.</p>
                                </div>
                                <div className={styles.reviewSection}>
                                    <p className={styles.reviewSectionTitle}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8"/></svg>
                                        Basic Info
                                    </p>
                                    <div className={styles.reviewRow}><span className={styles.reviewKey}>Name</span><span className={styles.reviewVal}>{wName || "—"}</span></div>
                                    <div className={styles.reviewRow}><span className={styles.reviewKey}>Duration</span><span className={styles.reviewVal}>{wDays || "—"} days</span></div>
                                    <div className={styles.reviewRow}><span className={styles.reviewKey}>Status</span><span className={styles.reviewVal}>Draft</span></div>
                                </div>
                                <div className={styles.reviewSection}>
                                    <p className={styles.reviewSectionTitle}>
                                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                                        Itinerary ({wStops.length} stops)
                                    </p>
                                    {wStops.map((s, i) => (
                                        <div key={s.id} className={styles.reviewStop}>
                                            <span className={styles.reviewStopNum}>{i + 1}</span>
                                            <div className={styles.reviewStopInfo}>
                                                <p className={styles.reviewStopName}>{s.name || `Stop ${i + 1}`}</p>
                                                {s.address && <p className={styles.reviewStopAddr}>{s.address}</p>}
                                                {s.activities.map(a => (
                                                    <p key={a.id} className={styles.reviewActivity}>
                                                        <svg viewBox="0 0 24 24" fill="none" width="10" height="10"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                                        {a.name} {a.price > 0 ? `— ${fmtPrice(a.price)}` : ""}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {wStops.length === 0 && <p style={{ fontSize:13, color:"#9ca3af" }}>No stops added.</p>}
                                </div>
                            </div>
                        )}

                        {/* Wizard footer */}
                        <div className={styles.wizardFooter}>
                            <button className={styles.btnBack} onClick={() => { if (!editMode && wizStep > 1) setWizStep(s => s - 1); else closeWizard(); }}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                {!editMode && wizStep > 1 ? "Back" : "Cancel"}
                            </button>
                            <div className={styles.wizardFooterRight}>
                                {!editMode && <span style={{ fontSize:12, color:"#9ca3af" }}>Step {wizStep} of 3</span>}
                                {editMode
                                    ? <button className={styles.btnNext} onClick={submitWizard} disabled={wizSubmitting}>
                                        {wizSubmitting ? "Saving…" : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                Save Changes
                                            </>
                                        )}
                                      </button>
                                    : wizStep < 3
                                        ? <button className={styles.btnNext} onClick={() => { setWizError(""); setWizStep(s => s + 1); }} disabled={wizStep === 1 && !wName.trim()}>
                                            Next
                                            <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                          </button>
                                        : <button className={styles.btnNext} onClick={submitWizard} disabled={wizSubmitting}>
                                            {wizSubmitting ? "Creating…" : (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                    Create Tour
                                                </>
                                            )}
                                          </button>
                                }
                                {wizError && <p style={{ fontSize: 12, color: "#ef4444", margin: "6px 0 0", textAlign: "right" }}>{wizError}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ ADD ACTIVITY SUB-MODAL ════════════════ */}
            {actTarget && (
                <div className={styles.overlay} style={{ zIndex:500 }} onClick={() => setActTarget(null)}>
                    <div className={styles.activityModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>Add Activity</h3>
                                <p className={styles.modalSubtitle}>{wStops.find(s => s.id === actTarget)?.name || "Stop"}</p>
                            </div>
                            <button className={styles.modalCloseBtn} onClick={() => setActTarget(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className={styles.modalBody} style={{ overflowY:"auto", maxHeight:"55vh" }}>
                            {/* Type tabs */}
                            <div className={styles.activityTypeTabs}>
                                {(wStops.find(s => s.id === actTarget)?.providerId
                                    ? (["service","package","custom"] as const)
                                    : (["custom"] as const)
                                ).map(t => (
                                    <button key={t} className={`${styles.activityTypeTab} ${actType === t ? styles.activityTypeTabActive : ""}`} onClick={() => handleActTypeChange(t)}>
                                        {t === "service" ? "Service" : t === "package" ? "Package" : "Custom"}
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize:11.5, color:"#9ca3af", margin:"4px 0 12px" }}>
                                {actType === "service" && "Pick a single provider service"}
                                {actType === "package" && "Pick a package — all included services will be added at once"}
                                {actType === "custom" && "Add a custom activity (meal, sightseeing, transfer, etc.)"}
                            </p>

                            {/* Service picker */}
                            {actType === "service" && (
                                <div className={styles.field}>
                                    <label className={styles.label}>Select Service</label>
                                    {actDataLoading ? (
                                        <p style={{ fontSize:12, color:"#9ca3af" }}>Loading…</p>
                                    ) : actServices.length === 0 ? (
                                        <p style={{ fontSize:12, color:"#9ca3af" }}>No services found for this provider.</p>
                                    ) : (
                                        <div className={styles.serviceGrid}>
                                            {actServices.map(svc => (
                                                <div key={svc.id} className={`${styles.serviceOption} ${actServiceId === svc.id ? styles.serviceOptionSelected : ""}`} onClick={() => handleActServiceSelect(svc.id)}>
                                                    <p className={styles.serviceOptName}>{svc.name}</p>
                                                    <p className={styles.serviceOptMeta}>{svc.durationMinutes} min · {fmtPrice(svc.price)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Package picker */}
                            {actType === "package" && (
                                <div className={styles.field}>
                                    <label className={styles.label}>Select Package</label>
                                    {actDataLoading ? (
                                        <p style={{ fontSize:12, color:"#9ca3af" }}>Loading…</p>
                                    ) : actPackages.length === 0 ? (
                                        <p style={{ fontSize:12, color:"#9ca3af" }}>No packages found for this provider.</p>
                                    ) : (
                                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                            {actPackages.map(pkg => (
                                                <div key={pkg.id} className={`${styles.serviceOption} ${actPackageId === pkg.id ? styles.serviceOptionSelected : ""}`} onClick={() => handleActPackageSelect(pkg.id)} style={{ gridColumn:"1/-1" }}>
                                                    <p className={styles.serviceOptName}>{pkg.name} — {fmtPrice(pkg.basePrice)}</p>
                                                    <p className={styles.serviceOptMeta}>{pkg.services.map(s => s.serviceName).join(", ")}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Custom */}
                            {actType === "custom" && (
                                <div className={styles.field}>
                                    <label className={styles.label}>Activity Name <span className={styles.required}>*</span></label>
                                    <input className={styles.input} placeholder="e.g. Lunch at local restaurant" value={actCustomName} onChange={e => setActCustomName(e.target.value)} />
                                </div>
                            )}

                            {/* Time + price + note */}
                            <div className={styles.fieldRow} style={{ marginTop:12 }}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Start Time</label>
                                    <input className={styles.input} type="time" value={actStart} onChange={e => handleActStartChange(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>End Time</label>
                                    <input className={styles.input} type="time" value={actEnd} onChange={e => setActEnd(e.target.value)} />
                                </div>
                            </div>
                            {actType !== "package" && (
                                <div className={styles.field}>
                                    <label className={styles.label}>Price (₫) {actType === "service" && <span className={styles.hint}>— leave blank to use service default</span>}</label>
                                    <input className={styles.input} type="number" min="0" placeholder="0" value={actPrice} onChange={e => setActPrice(e.target.value)} />
                                </div>
                            )}
                            <div className={styles.field}>
                                <label className={styles.label}>Note</label>
                                <input className={styles.input} placeholder="Optional note for this activity" value={actNote} onChange={e => setActNote(e.target.value)} />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setActTarget(null)}>Cancel</button>
                            <button className={styles.btnSubmit}
                                disabled={actType === "service" ? !actServiceId : actType === "package" ? !actPackageId : !actCustomName}
                                onClick={confirmAddActivity}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                Add to Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ════════════════ PENDING STOP DIALOG ════════════════ */}
            {pendingMarker && (
                <div className={styles.overlay} style={{ zIndex: 600 }} onClick={() => setPendingMarker(null)}>
                    <div className={styles.pendingStopModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>New Stop</h3>
                                <p className={styles.modalSubtitle}>
                                    {pendingMarker.lat.toFixed(5)}, {pendingMarker.lng.toFixed(5)}
                                </p>
                            </div>
                            <button className={styles.modalCloseBtn} onClick={() => setPendingMarker(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.field}>
                                <label className={styles.label}>Stop Name <span className={styles.required}>*</span></label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Ha Long Bay"
                                    value={pendingName}
                                    onChange={e => setPendingName(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && pendingName.trim()) confirmPendingStop(); }}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Address / Location
                                    {pendingAddrLoading && <span style={{ color:"#9ca3af", fontWeight:400, marginLeft:6 }}>— detecting…</span>}
                                </label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Quảng Ninh, Vietnam"
                                    value={pendingAddress}
                                    onChange={e => setPendingAddress(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setPendingMarker(null)}>Cancel</button>
                            <button
                                className={styles.btnSubmit}
                                disabled={!pendingName.trim()}
                                onClick={confirmPendingStop}
                            >
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                Add Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ PROVIDER CONFIRM DIALOG ════════════════ */}
            {confirmProvider && (
                <div className={styles.overlay} style={{ zIndex: 600 }} onClick={() => setConfirmProvider(null)}>
                    <div className={styles.pendingStopModal} onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>Add as Stop?</h3>
                                <p className={styles.modalSubtitle}>{confirmProvider.name}</p>
                            </div>
                            <button className={styles.modalCloseBtn} onClick={() => setConfirmProvider(null)}>
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {confirmProvider.address && (
                                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 4px" }}>{confirmProvider.address}</p>
                            )}
                            {confirmProvider.contactPhone && (
                                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{confirmProvider.contactPhone}</p>
                            )}
                            <p style={{ fontSize: 13, color: "#374151", marginTop: 12 }}>
                                Use <strong>{confirmProvider.name}</strong> as the next stop on this tour?
                            </p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnCancel} onClick={() => setConfirmProvider(null)}>Cancel</button>
                            <button className={styles.btnSubmit} onClick={confirmProviderAsStop}>
                                <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                                Add Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

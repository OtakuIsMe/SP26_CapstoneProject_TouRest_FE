"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./tour-map-builder.module.scss";

export interface StopPoint {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

interface TourMapBuilderProps {
    stops: StopPoint[];
    onMapClick: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [16.047079, 108.20623]; // Vietnam center
const DEFAULT_ZOOM = 5;

function createNumberedIcon(L: typeof import("leaflet"), num: number) {
    return L.divIcon({
        html: `<div style="position:relative;width:30px;height:38px;display:flex;flex-direction:column;align-items:center">
            <div style="width:30px;height:30px;background:#4f46e5;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 3px 10px rgba(79,70,229,0.45)">
                <span style="transform:rotate(45deg);color:#ffffff;font-weight:700;font-size:12px;font-family:ui-sans-serif,system-ui,sans-serif;line-height:1">${num}</span>
            </div>
        </div>`,
        className: "",
        iconSize: [30, 38],
        iconAnchor: [15, 38],
        popupAnchor: [0, -42],
    });
}

export default function TourMapBuilder({ stops, onMapClick }: TourMapBuilderProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
    const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
    const lineRef = useRef<import("leaflet").Polyline | null>(null);
    const onClickRef = useRef(onMapClick);
    const [loaded, setLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);

    // Keep callback in sync without re-running map init
    useEffect(() => { onClickRef.current = onMapClick; }, [onMapClick]);

    // Init map once
    useEffect(() => {
        if (!mapRef.current) return;
        let destroyed = false;

        import("leaflet").then((L) => {
            if (destroyed || !mapRef.current) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current!, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                zoomControl: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
                onClickRef.current(e.latlng.lat, e.latlng.lng);
            });

            mapInstanceRef.current = map;
            setLoaded(true);
        });

        return () => {
            destroyed = true;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markersRef.current.clear();
                lineRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync numbered markers whenever stops or loaded changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !loaded) return;

        import("leaflet").then((L) => {
            // Remove all old markers
            markersRef.current.forEach(m => m.remove());
            markersRef.current.clear();

            // Re-add all current stops with correct numbering
            stops.forEach((stop, i) => {
                const icon = createNumberedIcon(L, i + 1);
                const marker = L.marker([stop.latitude, stop.longitude], { icon }).addTo(map);
                marker.bindPopup(
                    `<div style="font-family:ui-sans-serif,sans-serif;min-width:120px">
                        <p style="font-weight:700;font-size:13px;margin:0 0 2px;color:#111827">Stop ${i + 1}: ${stop.name}</p>
                        <p style="font-size:11px;color:#6b7280;margin:0">${stop.latitude.toFixed(5)}, ${stop.longitude.toFixed(5)}</p>
                    </div>`,
                    { maxWidth: 220 }
                );
                markersRef.current.set(stop.id, marker);
            });

            // Draw / update connecting polyline
            if (lineRef.current) {
                lineRef.current.remove();
                lineRef.current = null;
            }
            if (stops.length >= 2) {
                const latlngs = stops.map(s => [s.latitude, s.longitude] as [number, number]);
                lineRef.current = L.polyline(latlngs, {
                    color: "#4f46e5",
                    weight: 2.5,
                    opacity: 0.65,
                    dashArray: "7 5",
                }).addTo(map);
            }

            // Fit viewport to show all stops
            if (stops.length > 0) {
                const latlngs = stops.map(s => [s.latitude, s.longitude] as [number, number]);
                if (stops.length === 1) {
                    map.setView(latlngs[0], 13);
                } else {
                    map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
                }
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stops, loaded]);

    async function handleSearch() {
        if (!searchQuery.trim() || !mapInstanceRef.current) return;
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
                { headers: { "Accept-Language": "vi,en" } }
            );
            const data = await res.json();
            if (!data.length) return;
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            mapInstanceRef.current.setView([lat, lng], 13);
        } catch { /* ignore */ } finally {
            setSearching(false);
        }
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.searchBar}>
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style={{ color: "#9ca3af", flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search a location to navigate…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                />
                <button type="button" className={styles.searchBtn} disabled={searching} onClick={handleSearch}>
                    {searching ? "…" : "Go"}
                </button>
            </div>

            <div className={styles.mapContainer}>
                <div ref={mapRef} className={styles.map} />
                {!loaded && (
                    <div className={styles.loadingOverlay}>
                        <span className={styles.spinner} />
                        Loading map…
                    </div>
                )}
            </div>

            <p className={styles.hint}>
                <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                </svg>
                Click anywhere on the map to add a stop
            </p>
        </div>
    );
}

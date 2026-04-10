"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./map-picker.module.scss";

interface MapPickerProps {
    latitude?: number;
    longitude?: number;
    onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009]; // Ho Chi Minh City
const DEFAULT_ZOOM = 13;

export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
    const markerRef = useRef<import("leaflet").Marker | null>(null);

    const [loaded, setLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [display, setDisplay] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    );

    useEffect(() => {
        if (!mapRef.current) return;

        let destroyed = false;

        // Dynamically import leaflet (avoids SSR issues)
        import("leaflet").then((L) => {
            // StrictMode cleanup ran before this resolved — bail out
            if (destroyed || !mapRef.current) return;
            // Fix default icon paths broken by webpack
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const initialCenter: [number, number] =
                latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;

            const map = L.map(mapRef.current!, {
                center: initialCenter,
                zoom: DEFAULT_ZOOM,
                zoomControl: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            // Place initial marker if coordinates provided
            if (latitude && longitude) {
                const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
                markerRef.current = marker;

                marker.on("dragend", () => {
                    const pos = marker.getLatLng();
                    setDisplay({ lat: pos.lat, lng: pos.lng });
                    onChange(pos.lat, pos.lng);
                });
            }

            // Click map → place / move marker
            map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
                const { lat, lng } = e.latlng;

                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                    markerRef.current = marker;

                    marker.on("dragend", () => {
                        const pos = marker.getLatLng();
                        setDisplay({ lat: pos.lat, lng: pos.lng });
                        onChange(pos.lat, pos.lng);
                    });
                }

                setDisplay({ lat, lng });
                onChange(lat, lng);
            });

            mapInstanceRef.current = map;
            setLoaded(true);
        });

        return () => {
            destroyed = true;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

            const { lat, lon } = data[0];
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lon);

            const L = await import("leaflet");
            const map = mapInstanceRef.current;

            map.setView([latNum, lngNum], 16);

            if (markerRef.current) {
                markerRef.current.setLatLng([latNum, lngNum]);
            } else {
                const marker = L.marker([latNum, lngNum], { draggable: true }).addTo(map);
                markerRef.current = marker;

                marker.on("dragend", () => {
                    const pos = marker.getLatLng();
                    setDisplay({ lat: pos.lat, lng: pos.lng });
                    onChange(pos.lat, pos.lng);
                });
            }

            setDisplay({ lat: latNum, lng: lngNum });
            onChange(latNum, lngNum);
        } catch {
            // silently ignore search errors
        } finally {
            setSearching(false);
        }
    }

    return (
        <div className={styles.wrapper}>
            {/* Search — use div to avoid nested <form> hydration error */}
            <div className={styles.searchBar}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search address or place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                />
                <button type="button" className={styles.searchBtn} disabled={searching} onClick={handleSearch}>
                    {searching ? "..." : "Search"}
                </button>
            </div>

            {/* Map */}
            <div className={styles.mapContainer}>
                <div ref={mapRef} className={styles.map} />
                {!loaded && (
                    <div className={styles.overlay}>
                        <span className={styles.spinner} />
                        Loading map...
                    </div>
                )}
            </div>

            {/* Coordinates badge */}
            {display && (
                <div className={styles.coords}>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>
                        <b>Lat:</b> {display.lat.toFixed(6)}&nbsp;&nbsp;
                        <b>Lng:</b> {display.lng.toFixed(6)}
                    </span>
                </div>
            )}

            <p className={styles.hint}>Click on the map or drag the marker to set your location</p>
        </div>
    );
}

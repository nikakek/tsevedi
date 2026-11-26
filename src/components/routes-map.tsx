"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export type MapPlace = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  href: string;
  served: boolean;
  routes: number;
};
export type MapLine = Array<[number, number]>;

const GEORGIA_BOUNDS: [[number, number], [number, number]] = [
  [41.05, 40.0],
  [43.6, 46.7],
];

/** Leaflet + OpenStreetMap. Loaded only in the browser; markers are SVG circles (no image assets). */
export function RoutesMap({
  places,
  lines,
  openLabel,
  label,
}: {
  places: MapPlace[];
  lines: MapLine[];
  openLabel: string;
  label: string;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      map = L.map(container.current, { scrollWheelZoom: false, zoomSnap: 0.5 }).fitBounds(
        GEORGIA_BOUNDS,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      for (const line of lines) {
        L.polyline(line, { color: "#d0202a", weight: 3, opacity: 0.65 }).addTo(map);
      }

      for (const place of places.toSorted((a, b) => Number(a.served) - Number(b.served))) {
        const marker = L.circleMarker([place.lat, place.lng], {
          radius: place.served ? 7 : 4,
          color: "#fff",
          weight: place.served ? 2 : 1,
          fillColor: place.served ? "#d0202a" : "#8a837c",
          fillOpacity: 1,
        }).addTo(map);
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = place.name;
        const link = document.createElement("a");
        link.href = place.href;
        link.textContent = place.served ? `${openLabel} (${place.routes}) →` : `${openLabel} →`;
        link.style.display = "block";
        popup.append(title, link);
        marker.bindPopup(popup);
        marker.bindTooltip(place.name, { direction: "top", offset: [0, -6] });
      }
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [places, lines, openLabel]);

  return (
    <div
      ref={container}
      role="region"
      aria-label={label}
      className="border-line h-[70dvh] min-h-96 w-full overflow-hidden rounded-2xl border"
    />
  );
}

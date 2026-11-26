"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./routes-map.css";
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

/** Leaflet + OpenStreetMap, loaded only in the browser. Markers are CSS dots (no image assets). */
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

    (async () => {
      const L = (await import("leaflet")).default;
      // leaflet.markercluster is a classic plugin that extends the global `L`.
      (window as unknown as { L: typeof L }).L = L;
      await import("leaflet.markercluster");
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

      // Nearby towns merge into one numbered bubble; tapping it zooms in until they separate.
      // Without this, neighbouring markers overlap on a phone and some can't be tapped at all.
      const cluster = L.markerClusterGroup({
        maxClusterRadius: 44,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (group) => {
          const served = group
            .getAllChildMarkers()
            .some((m) => (m.options as { served?: boolean }).served);
          return L.divIcon({
            className: "map-cluster",
            html: `<span class="map-cluster-bubble${served ? " map-cluster-bubble--served" : ""}">${group.getChildCount()}</span>`,
            iconSize: [44, 44],
          });
        },
      });

      // Each marker is a 36px touch target around a smaller visible dot, so it's easy to hit on
      // phones and with a mouse. Places with routes get a bigger red dot and sit on top.
      for (const place of places.toSorted((a, b) => Number(a.served) - Number(b.served))) {
        const icon = L.divIcon({
          className: "map-pin",
          html: `<span class="map-pin-dot${place.served ? " map-pin-dot--served" : ""}"></span>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -12],
          tooltipAnchor: [0, -14],
        });
        const marker = L.marker([place.lat, place.lng], {
          icon,
          title: place.name,
          alt: place.name,
          riseOnHover: true,
          zIndexOffset: place.served ? 1000 : 0,
          keyboard: true,
          served: place.served,
        } as import("leaflet").MarkerOptions);
        const popup = document.createElement("div");
        popup.className = "map-popup";
        const title = document.createElement("strong");
        title.textContent = place.name;
        const link = document.createElement("a");
        link.href = place.href;
        link.textContent = place.served ? `${openLabel} (${place.routes}) →` : `${openLabel} →`;
        popup.append(title, link);
        marker.bindPopup(popup);
        marker.bindTooltip(place.name, { direction: "top" });
        cluster.addLayer(marker);
      }
      map.addLayer(cluster);
    })();

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
      className="border-line h-[75dvh] min-h-96 w-full overflow-hidden rounded-2xl border"
    />
  );
}

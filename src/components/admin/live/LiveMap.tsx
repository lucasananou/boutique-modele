"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LiveSession } from "@/store/live";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

const VISITOR_COLOR = "#14b8a6"; // teal
const ORDER_COLOR = "#4f46e5"; // indigo/bleu

// Tuiles vectorielles OpenFreeMap (style Positron gris/blanc, sans clé API).
// Vectoriel => labels nets qui se densifient au zoom + langue paramétrable (FR).
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

interface Props {
  sessions: LiveSession[];
}

type VisitorFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  { order: boolean }
>;
type GeoLiveSession = LiveSession & { latitude: number; longitude: number };

function hasCoordinates(session: LiveSession): session is GeoLiveSession {
  return (
    session.latitude != null &&
    session.longitude != null &&
    session.status !== "INACTIVE"
  );
}

const SECONDS_PER_REV = 150;
const MAX_SPIN_ZOOM = 4.2;

export function LiveMap({ sessions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);

  const seenRef = useRef<Set<string>>(new Set());
  // Dès que l'utilisateur manipule la carte, on coupe toute animation auto.
  const userControlledRef = useRef(false);
  const lastFlyRef = useRef(0);

  const sessionsRef = useRef<LiveSession[]>(sessions);
  sessionsRef.current = sessions;

  // ---- Init MapLibre ----
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      // Worker servi depuis public/maplibre/ (copié au build, cf. scripts/copy-maplibre-worker.mjs).
      maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      if (cancelled || !containerRef.current) return;

      const currentMap = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: [10, 46],
        zoom: 2.1,
        minZoom: 1,
        maxZoom: 16,
        dragRotate: false,
        attributionControl: false,
      });
      map = currentMap;
      mapRef.current = currentMap;

      currentMap.addControl(
        new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
        "top-right",
      );
      currentMap.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

      // Rotation lente du globe, tant que l'utilisateur n'a pas pris la main.
      const spinGlobe = () => {
        if (userControlledRef.current) return;
        if (currentMap.getZoom() >= MAX_SPIN_ZOOM) return;
        const center = currentMap.getCenter();
        center.lng -= 360 / SECONDS_PER_REV;
        currentMap.easeTo({ center, duration: 1000, easing: (n: number) => n });
      };

      // Tout geste utilisateur (drag, molette, tactile) coupe définitivement l'auto.
      const takeControl = () => {
        userControlledRef.current = true;
      };
      currentMap.on("mousedown", takeControl);
      currentMap.on("touchstart", takeControl);
      currentMap.on("dragstart", takeControl);
      currentMap.on("wheel", takeControl);
      currentMap.on("moveend", spinGlobe);

      currentMap.on("style.load", () => {
        try {
          currentMap.setProjection({ type: "globe" });
        } catch {}

        // Labels en français (schéma OpenMapTiles : name:fr → name:latin → name)
        try {
          const layers = currentMap.getStyle().layers ?? [];
          for (const layer of layers) {
            if (layer.type === "symbol" && layer.layout && "text-field" in layer.layout) {
              currentMap.setLayoutProperty(layer.id, "text-field", [
                "coalesce",
                ["get", "name:fr"],
                ["get", "name:latin"],
                ["get", "name"],
              ]);
            }
          }
        } catch {}

        // Source + couches visiteurs (ajoutées au-dessus)
        currentMap.addSource("visitors", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        currentMap.addLayer({
          id: "visitors-halo",
          type: "circle",
          source: "visitors",
          filter: ["==", ["get", "order"], true],
          paint: {
            "circle-radius": 13,
            "circle-color": ORDER_COLOR,
            "circle-opacity": 0.16,
            "circle-blur": 0.9,
          },
        });
        currentMap.addLayer({
          id: "visitors-main",
          type: "circle",
          source: "visitors",
          paint: {
            "circle-radius": ["case", ["get", "order"], 6.5, 5],
            "circle-color": ["case", ["get", "order"], ORDER_COLOR, VISITOR_COLOR],
            "circle-stroke-width": 1.6,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });

        readyRef.current = true;
        applyData(sessionsRef.current);
        spinGlobe();
      });
    })().catch(console.error);

    const ro = new ResizeObserver(() => mapRef.current?.resize());
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      map?.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  function applyData(sess: LiveSession[]) {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const geo = sess.filter(hasCoordinates);

    const source = map.getSource("visitors") as GeoJSONSource | undefined;
    if (source) {
      const data: VisitorFeatureCollection = {
        type: "FeatureCollection",
        features: geo.map((s) => ({
          type: "Feature",
          properties: { order: s.status === "CONVERTED" },
          geometry: { type: "Point", coordinates: [s.longitude, s.latitude] },
        })),
      };
      source.setData(data);
    }

    // Recentrage sur un nouveau visiteur — seulement en mode passif (pas si l'utilisateur explore)
    const fresh = geo.filter((s) => !seenRef.current.has(s.id));
    const firstLoad = seenRef.current.size === 0;
    geo.forEach((s) => seenRef.current.add(s.id));

    if (!firstLoad && fresh.length > 0 && !userControlledRef.current) {
      const now = Date.now();
      if (now - lastFlyRef.current > 8000) {
        lastFlyRef.current = now;
        const target = fresh[fresh.length - 1];
        map.flyTo({
          center: [target.longitude, target.latitude],
          zoom: 3.4,
          duration: 2600,
          essential: true,
        });
      }
    }
  }

  // ---- Mise à jour des points ----
  useEffect(() => {
    applyData(sessions);
  }, [sessions]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />
      <style>{`
        .maplibregl-ctrl-top-right { margin-top: 60px; margin-right: 12px; }
        .maplibregl-ctrl-top-right .maplibregl-ctrl-group {
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(20,21,26,0.1);
          border: 1px solid rgba(20,21,26,0.06);
        }
        .maplibregl-ctrl-bottom-left { opacity: 0.5; }
        .maplibregl-canvas { outline: none; }
      `}</style>
    </>
  );
}

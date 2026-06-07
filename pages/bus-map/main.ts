import "./style.css";
import { getBusLocation, getBusSvg } from "./util";

// typing import for cdn based library
const maplibregl = (window as any).maplibregl as typeof import("maplibre-gl");

(() => {
  const mapElem = document.querySelector<HTMLElement>(".map");
  if (!mapElem) {
    console.error("unable to find map element");
    return;
  }

  // https://maps.app.goo.gl/8DLumLtUiaHeW1Kk6
  const center: [number, number] = [101.6417106035067, 3.2199094390155625];

  const map = new maplibregl.Map({
    container: mapElem,
    style: "https://tiles.openfreemap.org/styles/bright",
    center: [center[0], center[1] + 0.005],
    zoom: 14,
    dragRotate: false,
    touchPitch: false,
    attributionControl: false,
  });

  map.addControl(new maplibregl.AttributionControl(), "bottom-left");

  // add css classes during movement in map
  map.on("movestart", () => {
    mapElem.classList.add("map--moving");
  });

  map.on("moveend", () => {
    mapElem.classList.remove("map--moving");
  });

  map.on("load", () => {
    const layers = map.getStyle().layers ?? [];

    // remove point of interest
    layers.forEach((layer) => {
      const layerId = layer.id.toLowerCase();
      if (layerId.startsWith("poi")) {
        map.setLayoutProperty(layer.id, "visibility", "none");
        return;
      }

      // console.log(layerId)
    });
  });

  // center marker
  new maplibregl.Marker({ color: "#dc3545", scale: 0.8 }).setLngLat(center).addTo(map);

  // marker caching
  type BusMarkerModel = {
    marker: maplibregl.Marker;
    iconElem: HTMLDivElement;
  };

  const busMarkers = new Map<string, BusMarkerModel>();
  const refreshMs = 20_000;
  let isPageVisible = !document.hidden;

  // skip timers when page is not active
  document.addEventListener("visibilitychange", () => {
    isPageVisible = !document.hidden;
  });

  const mapTime = document.querySelector<HTMLElement>(".map__time")!;
  mapTime.dataset.lastUpdateAt = String(Date.now());

  const updateTimeProgress = () => {
    if (!isPageVisible) {
      return;
    }

    const lastUpdateAt = Number(mapTime.dataset.lastUpdateAt!);
    const elapsed = Date.now() - lastUpdateAt;
    const progress = Math.min(1, elapsed / refreshMs);
    mapTime.style.setProperty("--refresh-progress", String(progress));
  };

  updateTimeProgress();
  setInterval(updateTimeProgress, 200);

  const populateBusOnMap = async () => {
    if (!isPageVisible) {
      return;
    }

    const busData = await getBusLocation();
    if (busData.length === 0) {
      return;
    }

    const seenIds = new Set<string>();

    busData.forEach(({ routeId, plate, bearing, latitude, longitude, speed }) => {
      const position: [number, number] = [longitude, latitude];

      const markerId = `${routeId}-${plate}`;
      seenIds.add(markerId);

      const existingMarker = busMarkers.get(markerId);
      if (existingMarker) {
        existingMarker.marker.setLngLat(position);
        existingMarker.iconElem.classList.toggle("render-map-icon--driving", speed > 0);
        existingMarker.iconElem.style.setProperty("--rotate", `${bearing}deg`);
        return;
      }

      const iconElem = document.createElement("div");
      iconElem.className = "render-map-icon";
      iconElem.classList.toggle("render-map-icon--driving", speed > 0);
      iconElem.style.setProperty("--rotate", `${bearing}deg`);
      iconElem.style.setProperty("--plate", `"${plate}"`);
      iconElem.innerHTML = getBusSvg();

      const marker = new maplibregl.Marker({
        element: iconElem,
        anchor: "center",
      })
        .setLngLat(position)
        .addTo(map);

      busMarkers.set(markerId, { marker, iconElem });
    });

    busMarkers.forEach((val, markerId) => {
      if (!seenIds.has(markerId)) {
        val.marker.remove();
        busMarkers.delete(markerId);
      }
    });

    const now = Date.now();
    mapTime.dataset.lastUpdateAt = String(now);
    mapTime.textContent = "Last updated: " + new Date(now).toLocaleTimeString().toUpperCase();
    updateTimeProgress();
  };

  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleRefresh = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(async () => {
      await populateBusOnMap();
      scheduleRefresh();
    }, refreshMs);
  };

  populateBusOnMap();
  scheduleRefresh();

  // custom map controls
  const controls = document.querySelector<HTMLElement>(".map__controls")!;
  controls.addEventListener("click", (evt) => {
    const target = evt.target;
    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest<HTMLButtonElement>("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    if (action === "reload") {
      populateBusOnMap();
      scheduleRefresh();
      return;
    }

    if (action === "recenter") {
      map.easeTo({ center, zoom: 15 });
    }
  });
})();

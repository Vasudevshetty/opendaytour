import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoibmlzY2hheWhyMTEiLCJhIjoiY20yeHB2dGwzMDZsMDJrcjRweHA3NnQwdyJ9.zJ4eHE9IMQ6RowiONFur0A";

const markerColors = {
  inactive: "#6B7280", // gray
  active: "#2563EB", // blue
  user: "#EF4444", // red
};

// Helper to create a styled marker element
function createMarkerElement(isActive) {
  const el = document.createElement("div");
  el.className = isActive ? "marker marker-active" : "marker";
  el.style.width = isActive ? "26px" : "20px";
  el.style.height = isActive ? "26px" : "20px";
  el.style.borderRadius = "50%";
  el.style.background = isActive ? markerColors.active : markerColors.inactive;
  el.style.border = isActive ? "4px solid #fff" : "2px solid #fff";
  el.style.boxShadow = isActive
    ? "0 0 10px 2px #2563EB88"
    : "0 0 4px rgba(0,0,0,0.2)";
  el.style.cursor = "pointer";
  if (isActive) {
    el.style.transform = "scale(1.1)";
    el.style.zIndex = "2";
  }
  return el;
}

const MapWithTour = ({ steps, currentStep, setCurrentStep, userLocation }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: steps[0].coordinate,
        zoom: 18, // further increased zoom
        pitch: 75, // more human POV tilt
        bearing: 20, // slight rotation for perspective
      });
      mapRef.current.on("load", () => {
        mapRef.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: steps.map((s) => s.coordinate),
            },
          },
        });
        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": markerColors.active,
            "line-width": 4,
          },
        });
      });
    }
    // Markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = steps.map((step, idx) => {
      const el = createMarkerElement(idx === currentStep);
      el.addEventListener("click", () => setCurrentStep(idx));
      const marker = new mapboxgl.Marker(el)
        .setLngLat(step.coordinate)
        .addTo(mapRef.current);
      return marker;
    });
    // User marker
    if (userLocation) {
      if (userMarkerRef.current) userMarkerRef.current.remove();
      const el = document.createElement("div");
      el.className = "marker-user";
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.background = markerColors.user;
      el.style.border = "2px solid #fff";
      el.style.boxShadow = "0 0 6px 2px #EF4444AA";
      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat(userLocation)
        .addTo(mapRef.current);
    }
    // Center map on current step
    if (mapRef.current && steps[currentStep]) {
      mapRef.current.flyTo({
        center: steps[currentStep].coordinate,
        zoom: 18, // further increased zoom
        pitch: 75, // more human POV tilt
        bearing: 20, // match initial perspective
      });
    }
    return () => {
      markersRef.current.forEach((m) => m.remove());
      if (userMarkerRef.current) userMarkerRef.current.remove();
    };
    // eslint-disable-next-line
  }, [steps, currentStep, userLocation]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-screen fixed top-0 left-0 z-10"
      style={{ minHeight: "60vh" }}
    />
  );
};

export default MapWithTour;

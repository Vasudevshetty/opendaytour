import { useRef, useEffect, useState } from "react";
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

// Helper: Map currentStep (spot index) to the correct direction step index
function getDirectionStepForSpot(legs, spotIdx) {
  if (!Array.isArray(legs) || spotIdx <= 0) return 0;
  let stepIdx = 0;
  for (let i = 0; i < spotIdx && i < legs.length; i++) {
    stepIdx += legs[i].steps.length;
  }
  return stepIdx;
}

const MapWithTour = ({
  steps,
  currentStep,
  setCurrentStep,
  userLocation,
  recenterKey,
}) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const [directions, setDirections] = useState([]);
  const [legs, setLegs] = useState([]); // Store legs for mapping

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

  // Add effect to recenter map to userLocation when recenterKey changes
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo({
        center: userLocation,
        zoom: 18,
        pitch: 75,
        bearing: 20,
        essential: true,
      });
    }
  }, [recenterKey, userLocation]);

  // Fetch route and directions from Mapbox Directions API
  useEffect(() => {
    async function fetchRoute() {
      if (steps.length < 2) return;
      const coords = steps.map((s) => s.coordinate.join(",")).join(";");
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const routeGeo = data.routes[0].geometry;
        const allLegs = data.routes[0].legs;
        setLegs(allLegs);
        const stepDirections = allLegs.flatMap((leg) =>
          leg.steps.map((step) => step.maneuver.instruction)
        );
        setDirections(stepDirections);
        if (mapRef.current.getSource("route")) {
          mapRef.current.getSource("route").setData({
            type: "Feature",
            properties: {},
            geometry: routeGeo,
          });
        } else {
          mapRef.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: routeGeo,
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
        }
      }
    }
    if (mapRef.current && steps.length > 1) {
      fetchRoute();
    }
  }, [steps]);

  // Compute the direction step index for the current spot
  const directionStepIdx = getDirectionStepForSpot(legs, currentStep);
  const legSteps = legs[currentStep]?.steps?.length || 0;
  // Local state for which sub-step (direction) is active within this spot
  const [subStep, setSubStep] = useState(0);
  useEffect(() => {
    setSubStep(0);
  }, [currentStep, directionStepIdx]);

  function handlePrev() {
    if (subStep > 0) {
      setSubStep(subStep - 1);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }
  function handleNext() {
    if (subStep < legSteps - 1) {
      setSubStep(subStep + 1);
    } else if (currentStep < steps.length - 2) {
      setCurrentStep(currentStep + 1);
    }
  }

  return (
    <div className="relative w-full h-screen">
      <div
        ref={mapContainer}
        className="w-full h-screen fixed top-0 left-0 z-10"
        style={{ minHeight: "60vh" }}
      />
      {/* Directions Card - step-by-step slider style, synced to route sub-steps */}
      <div className="fixed top-0 left-0 right-0 z-20 flex justify-center pointer-events-none font-dm-sans tracking-tight">
        <div
          className="backdrop-blur-sm bg-black/90 border border-gray-700 shadow-2xl rounded-t-3xl w-full max-w-md mx-auto p-6 mb-0 pointer-events-auto flex flex-col items-center relative overflow-hidden"
          style={{
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.7)",
            borderTop: "2px solid #22223b",
            borderLeft: "1px solid #22223b",
            borderRight: "1px solid #22223b",
            minHeight: 120,
            maxHeight: 220,
          }}
        >
          <h3 className="text-lg font-extrabold mb-2 text-center text-cyan-300 drop-shadow-lg">
            Spot {currentStep + 1} of {steps.length} — Step {subStep + 1} of{" "}
            {legSteps}
          </h3>
          <div className="flex items-center justify-between w-full gap-2">
            <button
              className="bg-gray-800 text-gray-200 px-4 py-2 rounded-full shadow hover:bg-gray-700 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-base font-semibold"
              onClick={handlePrev}
              disabled={currentStep === 0 && subStep === 0}
            >
              Previous
            </button>
            <div className="flex-1 text-center text-cyan-400 font-bold text-base px-2 py-1 flex flex-col items-center">
              <span className="mb-1">
                {directions.length > 0 && (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto"
                  >
                    <path d="M12 19V5" />
                    <path d="M5 12l7-7 7 7" />
                  </svg>
                )}
              </span>
              <span>
                {directions.length > 0
                  ? directions[directionStepIdx + subStep]
                  : "No directions available."}
              </span>
            </div>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-full shadow hover:bg-blue-800 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-base font-semibold"
              onClick={handleNext}
              disabled={
                currentStep === steps.length - 2 && subStep === legSteps - 1
              }
            >
              Next
            </button>
          </div>
          {/* Slider dots for sub-steps */}
          <div className="flex gap-1 mt-3">
            {Array.from({ length: legSteps }).map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === subStep ? "bg-cyan-400" : "bg-gray-500"
                } inline-block transition-all`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapWithTour;

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
      <div className="fixed top-2 left-0 right-0 z-20 flex justify-center pointer-events-none font-dm-sans tracking-tight">
        <div
          className="backdrop-blur-md bg-black/90 rounded-full w-full mx-2 max-w-sm  py-3 px-8 mb-0 pointer-events-auto flex flex-col items-center relative overflow-hidden"
          style={{
            minHeight: 60,
            maxHeight: 140,
          }}
        >
          <h3 className="text-[0.6rem] font-bold mb-1 text-center text-cyan-300 tracking-wide uppercase letter-spacing-1 drop-shadow">
            Step {subStep + 1} of {legSteps}
          </h3>
          <div className="flex items-center justify-between w-full gap-2">
            <button
              className="bg-gray-800 text-gray-200 px-2 py-1 rounded-full shadow hover:bg-gray-700 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
              onClick={handlePrev}
              disabled={currentStep === 0 && subStep === 0}
              style={{ minWidth: 48 }}
            >
              Prev
            </button>
            <div className="flex-1 text-center text-cyan-200 font-medium text-xl px-1 py-1 flex flex-col items-center min-h-[28px]">
              <span style={{ wordBreak: "break-word", lineHeight: "1.4" }}>
                {directions.length > 0
                  ? directions[directionStepIdx + subStep]
                  : "No directions available."}
              </span>
            </div>
            <button
              className="bg-cyan-600 text-white px-2 py-1 rounded-full shadow hover:bg-cyan-800 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
              onClick={handleNext}
              disabled={
                currentStep === steps.length - 2 && subStep === legSteps - 1
              }
              style={{ minWidth: 48 }}
            >
              Next
            </button>
          </div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: legSteps }).map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${
                  idx === subStep ? "bg-cyan-400" : "bg-gray-600"
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

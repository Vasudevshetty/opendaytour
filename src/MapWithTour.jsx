import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion } from "framer-motion";
import { tourSteps } from "./data/tourSteps";
import StepCard from "./StepCard";
import Confetti from "./Confetti";

mapboxgl.accessToken =
  "pk.eyJ1IjoibmlzY2hheWhyMTEiLCJhIjoiY20yeHB2dGwzMDZsMDJrcjRweHA3NnQwdyJ9.zJ4eHE9IMQ6RowiONFur0A";

const markerColors = {
  inactive: "#6B7280",
  active: "#2563EB",
  user: "#EF4444",
};

function createMarkerElement(isActive) {
  const el = document.createElement("div");
  el.className = "custom-marker";
  el.style.width = isActive ? "32px" : "26px";
  el.style.height = isActive ? "40px" : "32px";
  el.style.background = "none";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.cursor = "pointer";
  el.innerHTML = `
    <div style="position: relative;">
      <svg width="100%" height="100%" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="drop-shadow(0 2px 6px rgba(0,0,0,0.2))">
          <path d="M16 0C8.268 0 2 6.268 2 14.001c0 7.732 12.07 24.13 13.01 25.39a2 2 0 0 0 3.98 0C17.93 38.13 30 21.733 30 14.001 30 6.268 23.732 0 16 0z"
            fill="${isActive ? markerColors.active : markerColors.inactive}"
            stroke="#fff" stroke-width="2"/>
          <circle cx="16" cy="14" r="6" fill="#fff"/>
          <circle cx="16" cy="14" r="4" fill="${
            isActive ? markerColors.active : markerColors.inactive
          }"/>
        </g>
      </svg>
    </div>
  `;
  if (isActive) {
    el.style.transform = "scale(1.1)";
    el.style.zIndex = "2";
  }
  el.classList.add("group");
  return el;
}

function getDirectionStepForSpot(legs, spotIdx) {
  if (!Array.isArray(legs) || spotIdx <= 0) return 0;
  let stepIdx = 0;
  for (let i = 0; i < spotIdx && i < legs.length; i++) {
    stepIdx += legs[i].steps.length;
  }
  return stepIdx;
}

// Helper to get the current maneuver coordinate and bearing for the substep
function getCurrentManeuverView(legs, steps, currentStep, subStep) {
  if (
    legs[currentStep] &&
    legs[currentStep].steps &&
    legs[currentStep].steps[subStep]
  ) {
    const step = legs[currentStep].steps[subStep];
    const coord = step.maneuver.location;
    // If geometry exists, calculate bearing from first to last point
    let bearing = 20;
    if (
      step.geometry &&
      step.geometry.coordinates &&
      step.geometry.coordinates.length > 1
    ) {
      const [from, to] = [
        step.geometry.coordinates[0],
        step.geometry.coordinates[step.geometry.coordinates.length - 1],
      ];
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
      if (bearing < 0) bearing += 360;
    }
    return { coord, bearing };
  }
  // fallback to step marker
  return { coord: steps[currentStep]?.coordinate, bearing: 20 };
}

const MapWithTour = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [resetKey, setResetKey] = useState(0); // force remount for reset
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const popupRef = useRef(
    new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
  );
  const [directions, setDirections] = useState([]);
  const [legs, setLegs] = useState([]);
  const steps = tourSteps;

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Show confetti on final step
  useEffect(() => {
    if (currentStep === tourSteps.length - 1) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [currentStep]);

  // Map and marker logic
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: steps[0].coordinate,
        zoom: 18,
      });
    }

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = steps.map((step, idx) => {
      const el = createMarkerElement(idx === currentStep, idx + 1);
      el.addEventListener("click", () => setCurrentStep(idx));

      // Show popup on hover or if marker is active
      const showPopup = () => {
        const isActive = idx === currentStep;
        popupRef.current
          .setLngLat(step.coordinate)
          .setHTML(
            `<div id="popup-content-${idx}" style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: ${isActive ? "2.1em" : "1.7em"};
                height: ${isActive ? "2.1em" : "1.7em"};
                background: ${
                  isActive ? markerColors.active : markerColors.inactive
                };
                color: #fff;
                font-weight: 700;
                font-size: 1.1em;
                border-radius: 50%;
                box-shadow: 0 2px 8px 0 rgba(0,0,0,0.18);
                border: 2px solid #fff;
                transform: scale(${isActive ? "1.13" : "1"});
                transition: all 0.18s cubic-bezier(.4,0,.2,1);
              ">${idx + 1}</span>
              <span class="tour-popup-title${
                isActive ? " text-cyan-400" : ""
              }" style="
                color: ${isActive ? "#67e8f9" : "#fff"};
                font-size: 1em;
                font-weight: 700;
                letter-spacing: 0.02em;
                text-shadow: 0 1px 2px rgba(0,0,0,0.18);">
                ${step.name || `Spot ${idx + 1}`}
              </span>
            </div>`
          )
          .addTo(mapRef.current);
        setTimeout(() => {
          document.querySelectorAll(".mapboxgl-popup").forEach((popup) => {
            // Bring popup above marker
            popup.style.zIndex = isActive ? "1002" : "1001";
          });
          document.querySelectorAll(".mapboxgl-popup-content").forEach((el) => {
            el.style.background = "rgba(17,24,39,0.95)";
            el.style.color = "#fff";
            el.style.borderRadius = "1rem";
            el.style.boxShadow = "0 4px 24px 0 rgba(0,0,0,0.25)";
            el.style.padding = isActive ? "0.7rem 1.5rem" : "0.5rem 1.2rem";
            el.style.fontFamily = "'DM Sans', sans-serif";
            el.style.fontSize = "0.95rem";
            el.style.fontWeight = "500";
            el.style.minWidth = "110px";
            el.style.textAlign = "center";
            el.style.border = "none";
            el.style.display = "inline-block";
            if (isActive) {
              el.style.overflow = "visible";
              el.style.position = "relative";
              el.style.zIndex = "1002";
              el.style.animation = "popupScaleIn 0.32s cubic-bezier(.4,0,.2,1)";
            }
          });
          // Add keyframes for popup scale animation if not present
          if (!document.getElementById("popup-scale-keyframes")) {
            const style = document.createElement("style");
            style.id = "popup-scale-keyframes";
            style.innerHTML = `@keyframes popupScaleIn { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`;
            document.head.appendChild(style);
          }
        }, 0);
      };

      if (idx === currentStep) {
        showPopup();
      }

      el.addEventListener("mouseenter", showPopup);
      el.addEventListener("mouseleave", () => {
        if (idx !== currentStep) popupRef.current.remove();
      });

      return new mapboxgl.Marker(el)
        .setLngLat(step.coordinate)
        .addTo(mapRef.current);
    });

    if (userLocation) {
      if (userMarkerRef.current) userMarkerRef.current.remove();
      const el = document.createElement("div");
      el.style.width = "24px";
      el.style.height = "32px";
      el.style.background = "none";
      el.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="drop-shadow(0 2px 6px rgba(0,0,0,0.2))">
            <path d="M16 0C8.268 0 2 6.268 2 14.001c0 7.732 12.07 24.13 13.01 25.39a2 2 0 0 0 3.98 0C17.93 38.13 30 21.733 30 14.001 30 6.268 23.732 0 16 0z" fill="${markerColors.user}" stroke="#fff" stroke-width="2"/>
            <circle cx="16" cy="14" r="6" fill="#fff"/>
            <circle cx="16" cy="14" r="4" fill="${markerColors.user}"/>
          </g>
        </svg>
      `;
      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat(userLocation)
        .addTo(mapRef.current);

      // Add always-on popup for user location
      new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 30,
      })
        .setLngLat(userLocation)
        .setHTML(
          `<div style="background:rgba(17,24,39,0.95);color:#ef4444;border-radius:1rem;padding:0.5rem 1.2rem;font-family:'DM Sans',sans-serif;font-size:0.95rem;font-weight:700;min-width:90px;text-align:center;border:none;box-shadow:none;">You are here</div>`
        )
        .addTo(mapRef.current);
      // Directly style the user popup content
      setTimeout(() => {
        const popupContent = document.querySelectorAll(
          ".mapboxgl-popup-content"
        );
        popupContent.forEach((el) => {
          el.style.background = "rgba(17,24,39,0.95)";
          el.style.color = "#fff";
          el.style.borderRadius = "1rem";
          el.style.boxShadow = "0 4px 24px 0 rgba(0,0,0,0.25)";
          el.style.padding = "0.5rem 1.2rem";
          el.style.fontFamily = "'DM Sans', sans-serif";
          el.style.fontSize = "0.95rem";
          el.style.fontWeight = "500";
          el.style.minWidth = "90px";
          el.style.textAlign = "center";
          el.style.border = "none";
        });
      }, 0);
    }

    // Responsive offset for mobile
    let centerCoord = steps[currentStep].coordinate;
    if (
      legs.length &&
      legs[currentStep] &&
      legs[currentStep].steps &&
      legs[currentStep].steps.length > 0
    ) {
      // No substep logic, just use the step's coordinate
      centerCoord = steps[currentStep].coordinate;
    }
    if (mapRef.current) {
      const map = mapRef.current;
      const original = map.project(centerCoord);
      const isMobile = window.innerWidth <= 640;
      const card = document.querySelector(".backdrop-blur-md");
      const cardHeight = isMobile && card ? card.offsetHeight : 140;
      const offsetY = isMobile ? cardHeight / 2 : 0;
      const newCenter = map.unproject([original.x, original.y - offsetY]);
      map.jumpTo({
        center: newCenter,
        zoom: 19.5,
        pitch: 60,
        bearing: 20,
        essential: true,
      });
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      if (userMarkerRef.current) userMarkerRef.current.remove();
      if (userMarkerRef.current && userMarkerRef.current._userPopup) {
        userMarkerRef.current._userPopup.remove();
      }
    };
  }, [steps, currentStep, userLocation, legs]);

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
        setDirections(
          allLegs.flatMap((leg) => leg.steps.map((s) => s.maneuver.instruction))
        );
        // Set the route geojson from the Directions API
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
    if (mapRef.current && steps.length > 1) fetchRoute();
  }, [steps]);

  // When currentStep changes, always center the map on the step's coordinate (ignore substeps)
  useEffect(() => {
    if (mapRef.current && steps[currentStep]) {
      mapRef.current.jumpTo({
        center: steps[currentStep].coordinate,
        zoom: 19.5,
        pitch: 75,
        bearing: 20,
        essential: true,
      });
    }
  }, [currentStep, steps]);

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleResetTour = () => {
    setCurrentStep(0);
    setShowConfetti(false);
    setResetKey((k) => k + 1); // force remount StepCard
  };

  const handleRecenter = () => {};

  return (
    <div className="relative w-full h-screen">
      {showConfetti && (
        <Confetti>
          <div
            ref={mapContainer}
            className="w-full h-screen fixed top-0 left-0 z-0"
            style={{ minHeight: "60vh" }}
          />
        </Confetti>
      )}
      {/* Map always rendered for overlay effect */}
      <div
        ref={mapContainer}
        className="w-full h-screen fixed top-0 left-0 z-10"
        style={{ minHeight: "60vh" }}
      />
      <div className="fixed top-2 left-0 right-0 z-20 flex justify-center pointer-events-none font-dm-sans tracking-tight">
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className="backdrop-blur-md bg-black/90 rounded-full w-full mx-2 max-w-sm py-3 px-8 pointer-events-auto flex flex-col items-center"
          style={{ minHeight: 60, maxHeight: 240 }}
        >
          <h3 className="text-[0.6rem] font-bold mb-1 text-center text-cyan-300 tracking-wide uppercase drop-shadow">
            {currentStep === steps.length - 1
              ? "Final Step"
              : `Directions for Step ${currentStep + 1}`}
          </h3>
          <div className="w-full flex flex-col items-center">
            {legs[currentStep]?.steps?.length > 0 ? (
              <ul className="w-full text-cyan-200 text-sm space-y-1">
                {legs[currentStep].steps.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-cyan-400">{idx + 1}.</span>
                    <span>
                      {directions && directions.length > 0
                        ? directions[
                            getDirectionStepForSpot(legs, currentStep) + idx
                          ]
                        : s.maneuver.instruction}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400">No directions available.</span>
            )}
          </div>
        </motion.div>
      </div>
      {/* Confetti CSS */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.7s; }
      `}</style>
      <StepCard
        key={resetKey}
        step={steps[currentStep]}
        onPrev={handlePrev}
        onNext={handleNext}
        isFirst={currentStep === 0}
        isLast={currentStep === steps.length - 1}
        steps={steps}
        currentStepIndex={currentStep}
        onRecenter={handleRecenter}
        onResetTour={handleResetTour}
        legs={legs}
        directions={directions}
      />
    </div>
  );
};

export default MapWithTour;

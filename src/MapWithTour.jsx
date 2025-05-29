import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion } from "framer-motion";
import { tourSteps } from "./data/tour";
import StepCard from "./StepCard";
import Confetti from "./Confetti";

mapboxgl.accessToken =
  "pk.eyJ1IjoibmlzY2hheWhyMTEiLCJhIjoiY20yeHB2dGwzMDZsMDJrcjRweHA3NnQwdyJ9.zJ4eHE9IMQ6RowiONFur0A";

// Helper function to calculate distance between two coordinates using Haversine formula
function haversineDistance(coords1, coords2) {
  // coords1 and coords2 are [longitude, latitude]
  const R = 6371e3; // Earth radius in metres
  const lat1Rad = coords1[1] * (Math.PI / 180);
  const lat2Rad = coords2[1] * (Math.PI / 180);
  const deltaLatRad = (coords2[1] - coords1[1]) * (Math.PI / 180);
  const deltaLonRad = (coords2[0] - coords1[0]) * (Math.PI / 180);

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in metres
}

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

const MapWithTour = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const [geofencedStepIndex, setGeofencedStepIndex] = useState(null);
  const [showGeofenceNotification, setShowGeofenceNotification] =
    useState(false);
  const watchIdRef = useRef(null);
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const userLocationPopupRef = useRef(null); // <-- Add new ref for user location popup
  const popupRef = useRef(
    new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
  );
  const [directions, setDirections] = useState([]);
  const [legs, setLegs] = useState([]);
  const steps = tourSteps;

  // Get user location on mount (real-time)
  useEffect(() => {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        },
        (error) => {
          console.error("Error watching position:", error);
          // Optionally handle error (e.g., set userLocation to null or show a message)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Geofencing logic
  useEffect(() => {
    if (userLocation && steps.length > 0) {
      let newGeofencedIndex = null;
      let minDistance = Infinity;

      for (let i = 0; i < steps.length; i++) {
        const distance = haversineDistance(userLocation, steps[i].coordinate);
        if (distance < 100) {
          // 100 meters geofence
          if (distance < minDistance) {
            minDistance = distance;
            newGeofencedIndex = i;
          }
        }
      }

      const currentGeofencedIndexInState = geofencedStepIndex;

      if (newGeofencedIndex !== null) {
        if (currentGeofencedIndexInState !== newGeofencedIndex) {
          setGeofencedStepIndex(newGeofencedIndex);
          setShowGeofenceNotification(true);
        }
      } else {
        if (currentGeofencedIndexInState !== null) {
          setGeofencedStepIndex(null);
        }
      }
    } else {
      if (geofencedStepIndex !== null) {
        setGeofencedStepIndex(null);
      }
    }
  }, [userLocation, steps, geofencedStepIndex]);

  // Show confetti only once when arriving at the last step
  useEffect(() => {
    if (currentStep === steps.length - 1 && !hasShownConfetti) {
      setShowConfetti(true);
      setHasShownConfetti(true);
    } else if (currentStep < steps.length - 1 && hasShownConfetti) {
      setHasShownConfetti(false);
      setShowConfetti(false);
    } else if (currentStep < steps.length - 1) {
      setShowConfetti(false);
    }
  }, [currentStep, steps.length, hasShownConfetti]);

  // Map and marker logic
  useEffect(() => {
    // Only initialize the map once
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: steps[0].coordinate,
        zoom: 18,
      });
    }

    // Remove only markers, not the map itself
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
                color: #fff;
                font-weight: 700;
                font-size: 1rem;
                border-radius: 20%;
                box-shadow: 0 2px 8px 0 rgba(0,0,0,0.18);
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
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }
      // Remove previous user location popup if it exists
      if (userLocationPopupRef.current) {
        userLocationPopupRef.current.remove();
        userLocationPopupRef.current = null;
      }

      const el = document.createElement("div");
      // Styling for a simple red dot
      el.style.width = "22px";
      el.style.height = "22px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = markerColors.user; // Using the existing user color
      el.style.border = "2px solid white";
      el.style.zIndex = "5"; // Ensure it's visible

      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat(userLocation)
        .addTo(mapRef.current);

      // Create and store the new user location popup
      userLocationPopupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 30,
      })
        .setLngLat(userLocation)
        .setHTML(
          `<div style="color:#ef4444;border-radius:1rem;padding:0.5rem 1.2rem;font-family:'DM Sans',sans-serif;font-size:0.95rem;font-weight:700;min-width:90px;text-align:center;border:none;box-shadow:none;">You are here</div>`
        )
        .addTo(mapRef.current);
    } else {
      // If userLocation becomes null, remove the marker and its popup
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userLocationPopupRef.current) {
        userLocationPopupRef.current.remove();
        userLocationPopupRef.current = null;
      }
    }

    // Responsive offset for mobile
    if (
      !mapRef.current ||
      !steps[currentStep] ||
      !steps[currentStep].coordinate
    ) {
      return;
    }

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
      // This check is slightly redundant due to the one above, but harmless
      const map = mapRef.current;
      const original = map.project(centerCoord);

      if (!original) {
        console.warn(
          "Map centering useEffect: map.project(centerCoord) failed."
        );
        return;
      }

      const isMobile = window.innerWidth <= 640;
      let calculatedCardHeight = 0;
      // Use the consistent selector for the StepCard
      const stepCardElement = document.querySelector(".fixed.bottom-0");
      if (stepCardElement) {
        calculatedCardHeight = stepCardElement.offsetHeight;
      } else {
        // Consistent fallback logic
        calculatedCardHeight = isMobile ? 200 : 140;
      }
      const offsetY = isMobile ? calculatedCardHeight / 2 : 0;
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
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      // Clean up user location popup
      if (userLocationPopupRef.current) {
        userLocationPopupRef.current.remove();
        userLocationPopupRef.current = null;
      }
    };
  }, [steps, currentStep, userLocation, legs]); // removed resetKey from deps

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

  // When currentStep changes, always center the map on the step's coordinate
  useEffect(() => {
    if (mapRef.current && steps[currentStep]) {
      const map = mapRef.current;
      const centerCoord = steps[currentStep].coordinate;

      // Calculate offset to center the marker, considering the StepCard
      const original = map.project(centerCoord);
      const isMobile = window.innerWidth <= 640;
      // Attempt to query the StepCard element.
      // Note: This might be fragile if the card's selector/class changes.
      // It's assumed the StepCard is rendered and has a consistent height or can be queried.
      let cardHeight = 0;
      const stepCardElement = document.querySelector(".fixed.bottom-0"); // A common selector for a bottom card
      if (stepCardElement) {
        cardHeight = stepCardElement.offsetHeight;
      } else {
        // Fallback or default height if the card isn't found or for non-mobile
        // This value might need adjustment based on your StepCard's actual height
        cardHeight = isMobile ? 200 : 140; // Example fallback heights
      }

      const offsetY = isMobile ? cardHeight / 2 : 0; // Only apply vertical offset on mobile
      const newCenter = map.unproject([original.x, original.y - offsetY]);

      map.flyTo({
        center: newCenter, // Use the adjusted center
        zoom: 17.5,
        pitch: 45, // Adjusted from previous 0 to match user's preference
        bearing: 60,
        speed: 0.7,
        curve: 1.42,
        essential: true,
      });
    }
  }, [currentStep, steps, legs]); // Added legs to dependencies if card height depends on its content via legs

  const handlePrev = () => {
    if (currentStep > 0) {
      setShowConfetti(false);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setShowConfetti(false);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleResetTour = () => {
    setShowConfetti(false);
    setHasShownConfetti(false);
    setCurrentStep(0);
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.stop(); // Add this to stop any ongoing animation

      let targetStep;

      if (geofencedStepIndex !== null && steps[geofencedStepIndex]) {
        targetStep = steps[geofencedStepIndex];
      } else if (steps[currentStep]) {
        targetStep = steps[currentStep];
      } else {
        console.warn("handleRecenter: No target step could be determined.");
        return;
      }

      if (!targetStep || !targetStep.coordinate) {
        console.warn(
          "handleRecenter: Target step is invalid or has no coordinate."
        );
        return;
      }

      const centerCoord = targetStep.coordinate;
      const original = map.project(centerCoord);

      if (!original) {
        console.warn(
          "handleRecenter: map.project(centerCoord) failed. Map may not be ready or coordinate is invalid."
        );
        return;
      }

      const isMobile = window.innerWidth <= 640;
      let cardHeight = 0;
      const stepCardElement = document.querySelector(".fixed.bottom-0");
      if (stepCardElement) {
        cardHeight = stepCardElement.offsetHeight;
      } else {
        cardHeight = isMobile ? 200 : 140; // Fallback heights
      }

      const offsetY = isMobile ? cardHeight / 2 : 0;
      const newCenter = map.unproject([original.x, original.y - offsetY]);

      map.flyTo({
        center: newCenter, // Use the adjusted center
        zoom: 17.5, // You might want to adjust zoom level based on context
        pitch: 45,
        bearing: 60,
        speed: 0.9,
        curve: 1.42,
        essential: true,
      });
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Geofence Notification */}
      {geofencedStepIndex !== null &&
        showGeofenceNotification &&
        steps[geofencedStepIndex] && (
          <div className="fixed top-4 left-0 right-0 z-[1050] flex justify-center pointer-events-none font-dm-sans tracking-tight">
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="relative backdrop-blur-md bg-black/80 rounded-full w-full mx-4 max-w-xs sm:max-w-sm md:max-w-md py-3 px-10 pointer-events-auto flex items-center justify-center shadow-xl"
            >
              <p className="text-cyan-300 text-sm text-center">
                You are near:{" "}
                <span className="font-semibold text-white">
                  {steps[geofencedStepIndex].name}
                </span>
              </p>
              <button
                onClick={() => setShowGeofenceNotification(false)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs leading-none focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Close notification"
              >
                &#x2715; {/* Close icon (X) */}
              </button>
            </motion.div>
          </div>
        )}

      {showConfetti && <Confetti onClose={() => setShowConfetti(false)} />}
      <div
        ref={mapContainer}
        className="w-full h-screen fixed top-0 left-0 z-10"
        style={{ minHeight: "60vh" }}
      />
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.7s; }
      `}</style>
      <StepCard
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

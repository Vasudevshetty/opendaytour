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
  const [showGeofenceFallback, setShowGeofenceFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added for loader
  const [isVirtualMode, setIsVirtualMode] = useState(false); // Added for virtual tour

  const watchIdRef = useRef(null);
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const userLocationPopupRef = useRef(null);
  const popupRef = useRef(
    new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
  );
  const [directions, setDirections] = useState([]);
  const [legs, setLegs] = useState([]);
  const steps = tourSteps;

  // --- BEGIN MODIFICATION ---
  // Ref to store the timestamp of the last user location state update
  const lastLocationUpdateTimeRef = useRef(Date.now());
  // Interval for throttling location updates (e.g., 3 seconds)
  const locationUpdateInterval = 3000;
  // --- END MODIFICATION ---

  // Get user location on mount (real-time)
  useEffect(() => {
    if (isVirtualMode) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setUserLocation(null); // Clear real user location
      setGeofencedStepIndex(null); // Clear geofence state
      setShowGeofenceNotification(false);
      setShowGeofenceFallback(false);
      setIsLoading(false); // Ensure loader is hidden if switching to virtual mode while loading
      return; // Don't start watching
    }
    // Reset isLoading to true only if we are NOT in virtual mode and attempting to get location
    setIsLoading(true);
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();
          if (
            now - lastLocationUpdateTimeRef.current >=
            locationUpdateInterval
          ) {
            setUserLocation([pos.coords.longitude, pos.coords.latitude]);
            lastLocationUpdateTimeRef.current = now;
            setIsLoading(false); // Location acquired, hide loader
          }
        },
        (error) => {
          console.error("Error watching position:", error);
          setIsLoading(false); // Error, hide loader, allow virtual tour
          // Optionally, prompt for virtual tour if location fails
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLoading(false); // Geolocation not supported, hide loader, allow virtual tour
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isVirtualMode, locationUpdateInterval]); // Added isVirtualMode

  // Geofencing logic
  useEffect(() => {
    if (isVirtualMode) {
      // Disable geofencing logic in virtual mode
      setShowGeofenceNotification(false);
      setShowGeofenceFallback(false);
      setGeofencedStepIndex(null);
      return;
    }
    if (userLocation && steps.length > 0) {
      let newGeofencedIndex = null;
      let minDistance = Infinity;

      for (let i = 0; i < steps.length; i++) {
        const distance = haversineDistance(userLocation, steps[i].coordinate);
        if (distance < 500) {
          // MODIFIED: Geofence radius to 500m
          if (distance < minDistance) {
            minDistance = distance;
            newGeofencedIndex = i;
          }
        }
      }

      if (newGeofencedIndex !== null) {
        // User is in a geofence
        setShowGeofenceFallback(false); // Not showing fallback if geofenced
        if (geofencedStepIndex !== newGeofencedIndex) {
          setGeofencedStepIndex(newGeofencedIndex);
          setShowGeofenceNotification(true);
        }
        // MODIFIED: Update currentStep if user is geofenced to a new spot
        if (currentStep !== newGeofencedIndex) {
          setCurrentStep(newGeofencedIndex);
        }
      } else {
        // User is NOT in any geofence, but userLocation exists
        if (geofencedStepIndex !== null) {
          setGeofencedStepIndex(null);
        }
        setShowGeofenceFallback(true);
        setShowGeofenceNotification(false);
      }
    } else {
      // No userLocation or no steps
      setGeofencedStepIndex(null);
      setShowGeofenceFallback(false);
      setShowGeofenceNotification(false);
    }
  }, [userLocation, steps, geofencedStepIndex, currentStep, isVirtualMode]); // MODIFIED: Added isVirtualMode

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

  // Map and marker logic (for tour steps and initial map setup)
  useEffect(() => {
    // Only initialize the map once
    if (!mapRef.current && mapContainer.current && steps.length > 0) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: steps[0].coordinate,
        zoom: 18,
      });
      // Set loader to false once map is initialized, if not already done by location services
      mapRef.current.on("load", () => {
        if (!isVirtualMode && !userLocation) {
          // If still waiting for location after map load, keep loader
        } else {
          setIsLoading(false);
        }
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

    // After markers are processed and map is likely ready for interaction
    // This specific isLoading check here might be redundant if handled by map.on('load') and location useEffect
    // if (isLoading && mapRef.current) {
    //   setIsLoading(false);
    // }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      // User marker and popup cleanup will be handled in their own useEffect
    };
  }, [steps, currentStep, legs, isLoading, isVirtualMode, userLocation]); // MODIFIED: Added userLocation

  // useEffect for user location marker and popup
  useEffect(() => {
    if (isVirtualMode) {
      // Hide user marker in virtual mode
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userLocationPopupRef.current) {
        userLocationPopupRef.current.remove();
        userLocationPopupRef.current = null;
      }
      return;
    }
    if (!mapRef.current) return; // Ensure map is initialized

    if (userLocation) {
      // Update existing user marker or create a new one
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat(userLocation);
      } else {
        const el = document.createElement("div");
        el.style.width = "22px";
        el.style.height = "22px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = markerColors.user;
        el.style.border = "2px solid white";
        el.style.zIndex = "5";
        userMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat(userLocation)
          .addTo(mapRef.current);
      }

      // Update existing user location popup or create a new one
      if (userLocationPopupRef.current) {
        userLocationPopupRef.current.setLngLat(userLocation);
      } else {
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
      }
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

    return () => {
      // Cleanup user marker and popup when the component unmounts or userLocation becomes null
      // This cleanup is specific to this effect.
      // The removal logic when userLocation becomes null is already handled above.
      // This ensures that if the component itself unmounts, these are cleaned.
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userLocationPopupRef.current) {
        userLocationPopupRef.current.remove();
        userLocationPopupRef.current = null;
      }
    };
  }, [userLocation, isVirtualMode]); // Added isVirtualMode

  // NEW useEffect: Follow user's location when geofenced
  useEffect(() => {
    if (
      isVirtualMode ||
      !mapRef.current ||
      !userLocation ||
      geofencedStepIndex === null
    ) {
      return; // Don't follow user in virtual mode or if conditions not met
    }
    // This effect should only run if NOT in virtual mode.
    const map = mapRef.current;
    map.flyTo({
      center: userLocation,
      zoom: 18,
      essential: true,
    });
  }, [userLocation, geofencedStepIndex, steps, isVirtualMode]); // MODIFIED: Added isVirtualMode

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

  // When currentStep changes, fly to the step's coordinate IF NOT actively geofenced and following user.
  useEffect(() => {
    // MODIFIED: Conditional execution and updated dependencies
    if (!isVirtualMode && geofencedStepIndex !== null && userLocation) {
      // If user is geofenced and location is known (not in virtual mode), user-following effect will take over.
      return;
    }

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
  }, [
    currentStep,
    steps,
    legs,
    geofencedStepIndex,
    userLocation,
    isVirtualMode,
  ]); // MODIFIED: Added isVirtualMode

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
      map.stop();

      let centerCoord;
      let targetNameForLog = "Unknown";

      if (isVirtualMode) {
        if (steps[currentStep]) {
          centerCoord = steps[currentStep].coordinate;
          targetNameForLog = `Virtual Tour - Current Step: ${steps[currentStep].name}`;
        } else {
          console.warn(
            "handleRecenter (Virtual Mode): No current step defined."
          );
          return;
        }
      } else {
        // Normal mode logic
        if (userLocation) {
          centerCoord = userLocation;
          targetNameForLog = "User's Current Location";
          if (geofencedStepIndex !== null && steps[geofencedStepIndex]) {
            targetNameForLog += ` (near ${steps[geofencedStepIndex].name})`;
          }
        } else if (geofencedStepIndex !== null && steps[geofencedStepIndex]) {
          centerCoord = steps[geofencedStepIndex].coordinate;
          targetNameForLog = `Geofenced Spot: ${steps[geofencedStepIndex].name}`;
        } else if (steps[currentStep]) {
          centerCoord = steps[currentStep].coordinate;
          // Corrected: Ensure targetNameForLog is assigned here as well
          targetNameForLog = `Current Tour Step: ${steps[currentStep].name}`;
        } else {
          console.warn(
            "handleRecenter: No target coordinate could be determined."
          );
          return;
        }
      }

      if (
        !centerCoord ||
        !Array.isArray(centerCoord) ||
        centerCoord.length !== 2
      ) {
        console.warn(
          "handleRecenter: Target coordinate is invalid.",
          centerCoord
        );
        return;
      }

      // Ensure targetNameForLog is used or remove if not needed for final deployment
      console.log(`handleRecenter: Targeting ${targetNameForLog}`, centerCoord);

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
        center: newCenter,
        zoom: isVirtualMode || !userLocation ? 17.5 : 18.5, // Adjust zoom for virtual mode
        pitch: 45,
        bearing: 60,
        speed: 0.9,
        curve: 1.42,
        essential: true,
      });
    }
  };

  // Handle Virtual Tour Toggle
  const toggleVirtualMode = () => {
    setIsVirtualMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        // Entering virtual mode
        setCurrentStep(0);
        setGeofencedStepIndex(null);
        setShowGeofenceNotification(false);
        setShowGeofenceFallback(false);
        setUserLocation(null); // Clear real user location for virtual tour
        setIsLoading(false); // Ensure loader is off for virtual tour
        if (mapRef.current && steps.length > 0) {
          // Fly to first step in virtual mode
          const map = mapRef.current;
          const centerCoord = steps[0].coordinate;
          const original = map.project(centerCoord);
          if (original) {
            const isMobile = window.innerWidth <= 640;
            let cardHeight = 0;
            const stepCardElement = document.querySelector(".fixed.bottom-0");
            if (stepCardElement) cardHeight = stepCardElement.offsetHeight;
            else cardHeight = isMobile ? 200 : 140;
            const offsetY = isMobile ? cardHeight / 2 : 0;
            const newCenter = map.unproject([original.x, original.y - offsetY]);
            map.flyTo({
              center: newCenter,
              zoom: 17.5,
              pitch: 45,
              bearing: 60,
            });
          }
        }
      } else {
        // Exiting virtual mode
        // Real location watch will restart due to useEffect dependency on isVirtualMode
        // isLoading will be set to true by the location useEffect
      }
      return newMode;
    });
  };

  return (
    <div className="relative w-full h-screen">
      {isLoading && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[5000] pointer-events-auto">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-xl font-semibold text-gray-700">
            Loading Tour Experience...
          </p>
          <p className="text-sm text-gray-500">
            Please wait while we prepare the map and location services.
          </p>
        </div>
      )}

      {/* Geofence Notification */}
      {!isVirtualMode &&
        geofencedStepIndex !== null &&
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

      {/* Geofence Fallback Notification */}
      {!isVirtualMode && showGeofenceFallback && (
        <div className="fixed top-4 left-0 right-0 z-[1050] flex justify-center pointer-events-none font-dm-sans tracking-tight">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="relative backdrop-blur-md bg-red-600/90 rounded-full w-full mx-4 max-w-xs sm:max-w-sm md:max-w-md py-3 px-10 pointer-events-auto flex items-center justify-center shadow-xl"
          >
            <p className="text-white text-sm text-center">
              You are outside the tour area. Please return to the highlighted
              area.
            </p>
            <button
              onClick={() => setShowGeofenceFallback(false)}
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
        className="w-full sm:h-screen fixed top-0 left-0 z-10 h-[80vh]"
        style={{
          minHeight: "60vh",
        }}
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
      <button
        onClick={toggleVirtualMode} // MODIFIED: Use new handler
        className="fixed bottom-[calc(var(--step-card-height,140px)+1rem)] sm:bottom-28 right-4 z-[1000] bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition-colors duration-150 text-sm"
        style={{ "--step-card-height": "140px" }} // Default, can be updated if card height is dynamic
      >
        {isVirtualMode ? "Exit Virtual Tour" : "Try Virtual Tour"}
      </button>
    </div>
  );
};

export default MapWithTour;

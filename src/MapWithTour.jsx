import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { tourSteps } from "./data/tour";
import StepCard from "./StepCard";
import Confetti from "./Confetti";
import Welcome from "./Welcome";
import { FiMapPin, FiX, FiAlertTriangle } from "react-icons/fi";

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
      <svg width="100%" height="100%" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#pin-shadow)">
          <path d="M12 0C5.364 0 0 5.364 0 12c0 7.732 10.768 22.464 11.234 23.088a1 1 0 0 0 1.532 0C13.232 34.464 24 19.732 24 12 24 5.364 18.636 0 12 0z"
            fill="${isActive ? markerColors.active : markerColors.inactive}"
          />
          <path d="M12 1C5.916 1 1 5.916 1 12c0 7.168 10.232 21.468 10.678 22.056a0.5 0.5 0 0 0 0.644 0C12.768 33.468 23 19.168 23 12c0-6.084-4.916-11-11-11z"
            fill="${isActive ? markerColors.active : markerColors.inactive}"
            stroke="#ffffff"
            stroke-width="2"
          />
          <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
          <circle cx="12" cy="12" r="3" fill="${
            isActive ? markerColors.active : markerColors.inactive
          }"/>
        </g>
        <defs>
          <filter id="pin-shadow" x="-4" y="-2" width="32" height="44" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
            <feBlend in2="BackgroundImageFix" result="effect1_dropShadow"/>
            <feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
          </filter>
        </defs>
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

// Helper function to create geofence circle data
function createGeofenceCircle(center, radiusInMeters = 50, points = 64) {
  const coords = [];
  const earthRadius = 6371000; // Earth's radius in meters

  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const angleRad = (angle * Math.PI) / 180;

    const latRad = (center[1] * Math.PI) / 180;
    const deltaLat = (radiusInMeters / earthRadius) * Math.cos(angleRad);
    const deltaLon =
      (radiusInMeters / (earthRadius * Math.cos(latRad))) * Math.sin(angleRad);

    const newLat = center[1] + (deltaLat * 180) / Math.PI;
    const newLon = center[0] + (deltaLon * 180) / Math.PI;

    coords.push([newLon, newLat]);
  }

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
    properties: {},
  };
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
  const [virtualModeNotification, setVirtualModeNotification] = useState(null);
  const [isCardExpanded, setIsCardExpanded] = useState(false); // New state for card collapse/expand
  const [showWelcome, setShowWelcome] = useState(true);
  const [progress, setProgress] = useState(0);
  const [geofenceVisible, setGeofenceVisible] = useState(false); // For geofence animation cycle

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

  // Automatically close Welcome screen after a delay
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [showWelcome]);

  // Automatically close Confetti after a delay
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [showConfetti]);

  // Helper function to calculate adjusted map center for flyTo, considering a bottom card
  const getAdjustedCenter = (map, targetCoord) => {
    if (!map || !targetCoord || !map.project) return targetCoord; // Safety checks

    const original = map.project(targetCoord);
    if (!original) return targetCoord; // Projection failed

    let cardHeight = 320; // Default card height in pixels

    // Offset to push the point of interest upwards on the screen, effectively centering it above the card
    const verticalOffset = cardHeight / 2;

    // MODIFIED: Subtract verticalOffset to move the center upwards
    const adjustedScreenY = original.y + verticalOffset;
    return map.unproject([original.x, adjustedScreenY]);
  };

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
      setUserLocation(null);
      setGeofencedStepIndex(null);
      setShowGeofenceNotification(false);
      setShowGeofenceFallback(false);
      setIsLoading(false); // Ensures loader is off & progress hits 100% via main effect
      return;
    }

    // For real mode, isLoading is true initially or set by toggleVirtualMode.
    // The main isLoading effect will set progress to 0.

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newLocation = [longitude, latitude];

          const now = Date.now();
          if (
            now - lastLocationUpdateTimeRef.current >
            locationUpdateInterval
          ) {
            setUserLocation(newLocation);
            lastLocationUpdateTimeRef.current = now;
            // Progress for location acquired is handled in the useEffect that centers the map
          }
        },
        (error) => {
          console.error("Error watching position:", error);
          setIsLoading(false); // Stop loading; progress to 100% via main effect
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setIsLoading(false); // Stop loading; progress to 100% via main effect
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isVirtualMode, locationUpdateInterval]); // Removed initialUserLocationCentered

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
        if (distance < 5) {
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
          setIsCardExpanded(true); // Expand card when geofence changes current step
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
      if (isLoading) setProgress(10); // Starting map creation

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: steps[0].coordinate, // Initial fallback center
        zoom: 15, // General initial zoom, will be overridden by flyTo
      });

      if (isLoading) setProgress(30); // Map object created

      mapRef.current.on("load", () => {
        if (isLoading) setProgress(60); // Map resources loaded

        if (!isVirtualMode) {
          // Real mode: Wait for user location to finalize loading
        } else {
          // Virtual mode: Map loaded, can stop loading
          setIsLoading(false);
        }
        // ... existing code from map.on('load') ...
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
            `<div id="popup-content-${idx}" style="display: flex; align-items: center; gap: 0.25rem;">
          <span style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: ${isActive ? "1.8em" : "1.5em"};
            height: ${isActive ? "1.8em" : "1.5em"};
            color: #fff;
            font-weight: 600;
            font-size: 0.875rem;
            border-radius: 20%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            transform: scale(${isActive ? "1.1" : "1"});
            transition: all 0.2s cubic-bezier(.4,0,.2,1);
          ">${idx + 1}</span>
          <span class="tour-popup-title${
            isActive ? " text-cyan-400" : ""
          }" style="
            color: ${isActive ? "#67e8f9" : "#fff"};
            font-size: 0.875rem;
            font-weight: 600;
            letter-spacing: -0.01em;
            text-shadow: 0 1px 1px rgba(0,0,0,0.15);">
            ${step.name || `Spot ${idx + 1}`}
          </span>
        </div>`
          )
          .setOffset([0, isActive ? -45 : -35]) // Increased offset for active markers
          .addTo(mapRef.current);

        setTimeout(() => {
          document.querySelectorAll(".mapboxgl-popup").forEach((popup) => {
            popup.style.zIndex = isActive ? "1002" : "1001";
          });

          document.querySelectorAll(".mapboxgl-popup-content").forEach((el) => {
            el.style.background = "#0e0e0e";
            el.style.color = "#fff";
            el.style.borderRadius = "1rem";
            el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
            el.style.padding = isActive ? "0.5rem 1rem" : "0.4rem 0.75rem";
            el.style.fontFamily = "'DM Sans', sans-serif";
            el.style.fontSize = "0.875rem";
            el.style.fontWeight = "500";
            el.style.minWidth = "90px";
            el.style.textAlign = "center";
            el.style.border = "1px solid #444444";
            el.style.display = "inline-block";

            if (isActive) {
              el.style.overflow = "visible";
              el.style.position = "relative";
              el.style.zIndex = "1002";
              el.style.animation = "popupScaleIn 0.3s cubic-bezier(.4,0,.2,1)";
            }
          });

          if (!document.getElementById("popup-scale-keyframes")) {
            const style = document.createElement("style");
            style.id = "popup-scale-keyframes";
            style.innerHTML = `@keyframes popupScaleIn { 
          0% { transform: scale(0.8); opacity: 0; } 
          100% { transform: scale(1); opacity: 1; }
        }`;
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

  // useEffect to center on user location when it first becomes available *after* map load
  useEffect(() => {
    if (
      mapRef.current &&
      typeof mapRef.current.isStyleLoaded === "function" &&
      mapRef.current.isStyleLoaded() &&
      !isVirtualMode &&
      userLocation
    ) {
      const map = mapRef.current;
      map.flyTo({
        center: userLocation,
        zoom: 18.5,
        pitch: 50,
        bearing: map.getBearing(), // Use current bearing for smooth transition
        speed: 1.0,
        curve: 1.0,
        essential: true,
      });
      if (isLoading) setProgress(90); // Location acquired & map ready for centering
      setIsLoading(false); // Ensure loader is off
    }
  }, [userLocation, isVirtualMode, mapRef, isLoading]); // Added isLoading to dependency array
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
  // useEffect for geofence visibility (always visible when user location exists)
  useEffect(() => {
    if (isVirtualMode || !userLocation) {
      setGeofenceVisible(false);
      return;
    }

    // Always show geofence when user location is available
    setGeofenceVisible(true);
  }, [userLocation, isVirtualMode]); // useEffect for geofence visualization layer
  useEffect(() => {
    if (isVirtualMode || !mapRef.current || !userLocation) {
      // Remove geofence layer in virtual mode or when no user location
      if (
        mapRef.current &&
        mapRef.current.getLayer &&
        mapRef.current.getLayer("geofence-fill")
      ) {
        mapRef.current.removeLayer("geofence-fill");
        mapRef.current.removeLayer("geofence-border");
        mapRef.current.removeLayer("geofence-pulse");
        mapRef.current.removeSource("geofence-small");
        mapRef.current.removeSource("geofence-large");
      }
      return;
    }

    const map = mapRef.current;

    // Wait for map to be fully loaded
    if (!map.isStyleLoaded()) {
      return;
    }

    // Create multiple circles for scaling effect
    const baseRadius = 50;
    const smallRadius = baseRadius * 0.25; // 25% of base radius
    const largeRadius = baseRadius * 1.0; // 100% of base radius

    // Create geofence circles for animation
    const createAnimatedGeofence = (radius) =>
      createGeofenceCircle(userLocation, radius);

    // Add or update geofence layers
    if (!map.getSource("geofence-small")) {
      // Add geofence sources for different scales
      map.addSource("geofence-small", {
        type: "geojson",
        data: createAnimatedGeofence(smallRadius),
      });

      map.addSource("geofence-large", {
        type: "geojson",
        data: createAnimatedGeofence(largeRadius),
      });

      // Add fill layer for the geofence area (cloudy blue effect)
      map.addLayer({
        id: "geofence-fill",
        type: "fill",
        source: "geofence-large",
        paint: {
          "fill-color": "#3B82F6", // Blue color
          "fill-opacity": 0, // Start with 0, will be animated
        },
      });

      // Add pulsing border layer for the geofence area
      map.addLayer({
        id: "geofence-border",
        type: "line",
        source: "geofence-large",
        paint: {
          "line-color": "#2563EB", // Darker blue for border
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            1.5,
            18,
            2,
            20,
            2.5,
          ],
          "line-opacity": 0, // Start with 0, will be animated
          "line-dasharray": [2, 2], // Dashed line for better visibility
        },
      });

      // Add pulsing outer ring effect
      map.addLayer({
        id: "geofence-pulse",
        type: "line",
        source: "geofence-large",
        paint: {
          "line-color": "#60A5FA", // Lighter blue for pulse
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            3,
            18,
            4,
            20,
            5,
          ],
          "line-opacity": 0, // Start with 0, will be animated
          "line-blur": 2,
        },
      });
    } else {
      // Update existing sources
      map
        .getSource("geofence-small")
        .setData(createAnimatedGeofence(smallRadius));
      map
        .getSource("geofence-large")
        .setData(createAnimatedGeofence(largeRadius));
    }
    let animationFrame;

    // Simple continuous scaling animation - always visible when geofence is enabled
    if (geofenceVisible) {
      const animate = () => {
        const time = Date.now() / 1000;

        // Radius scaling animation (25% to 100% and back)
        const scaleSpeed = 0.8; // Smooth scaling speed
        const scalePhase = time * scaleSpeed;
        const scaleProgress = (Math.sin(scalePhase) + 1) / 2; // 0 to 1

        // Interpolate between small and large radius
        const currentScale = 0.25 + 0.75 * scaleProgress; // 25% to 100%
        const currentRadius = baseRadius * currentScale;

        // Update geofence data with current radius
        const currentGeofenceData = createAnimatedGeofence(currentRadius);
        if (map.getSource("geofence-large")) {
          map.getSource("geofence-large").setData(currentGeofenceData);
        }

        // Set fixed opacity based on zoom level (no pulsing)
        const zoom = map.getZoom();
        const fillOpacity = zoom > 17 ? 0.3 : zoom > 15 ? 0.25 : 0.2;
        const borderOpacity = zoom > 17 ? 0.8 : zoom > 15 ? 0.7 : 0.6;
        const pulseOpacity = zoom > 17 ? 0.6 : zoom > 15 ? 0.5 : 0.4;

        // Apply opacity updates to layers
        if (map.getLayer("geofence-fill")) {
          map.setPaintProperty("geofence-fill", "fill-opacity", fillOpacity);
        }
        if (map.getLayer("geofence-border")) {
          map.setPaintProperty(
            "geofence-border",
            "line-opacity",
            borderOpacity
          );
        }
        if (map.getLayer("geofence-pulse")) {
          map.setPaintProperty("geofence-pulse", "line-opacity", pulseOpacity);
        }

        // Continue animation while geofence is visible
        if (geofenceVisible) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);
    } else {
      // Hide all layers immediately when geofence is not visible
      if (map.getLayer("geofence-fill")) {
        map.setPaintProperty("geofence-fill", "fill-opacity", 0);
      }
      if (map.getLayer("geofence-border")) {
        map.setPaintProperty("geofence-border", "line-opacity", 0);
      }
      if (map.getLayer("geofence-pulse")) {
        map.setPaintProperty("geofence-pulse", "line-opacity", 0);
      }
    }

    // Cleanup function to cancel animation frame
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [userLocation, geofenceVisible, isVirtualMode]);

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
    // MODIFIED: Use userLocation directly in normal mode
    map.flyTo({
      center: userLocation, // MODIFIED: Use userLocation directly
      zoom: 18.5,
      pitch: 50,
      bearing: map.getBearing(),
      speed: 1.0,
      curve: 1.0,
      essential: true,
    });
  }, [userLocation, geofencedStepIndex, steps, isVirtualMode]);

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
    if (!isVirtualMode && geofencedStepIndex !== null && userLocation) {
      return;
    }

    if (mapRef.current && steps[currentStep]) {
      const map = mapRef.current;
      const centerCoord = steps[currentStep].coordinate;

      // MODIFIED: Conditionally use getAdjustedCenter
      const newCenter = isVirtualMode
        ? getAdjustedCenter(map, centerCoord)
        : centerCoord;

      map.flyTo({
        center: newCenter,
        zoom: 17.5,
        pitch: 50,
        bearing: 270,
        speed: 0.9,
        curve: 1.3,
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
          targetNameForLog = `Current Tour Step: ${steps[currentStep].name}`;
        } else {
          console.warn(
            "handleRecenter: No target coordinate could be determined."
          );
          // Added return to prevent further execution if no target.
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

      console.log(`handleRecenter: Targeting ${targetNameForLog}`, centerCoord);

      // MODIFIED: Conditionally use getAdjustedCenter
      const newCenter = isVirtualMode
        ? getAdjustedCenter(map, centerCoord)
        : centerCoord;

      if (
        !newCenter ||
        (newCenter[0] === centerCoord[0] &&
          newCenter[1] === centerCoord[1] &&
          map.project(centerCoord) === null)
      ) {
        // Check if projection failed inside helper or if newCenter is same as old and projection failed
        console.warn(
          "handleRecenter: map.project(centerCoord) failed or getAdjustedCenter returned original due to error. Map may not be ready or coordinate is invalid."
        );
        return;
      }

      map.flyTo({
        center: newCenter, // MODIFIED: Use adjusted center
        zoom: isVirtualMode || !userLocation ? 17.5 : 18.5,
        pitch: 50,
        bearing: map.getBearing(),
        speed: 0.9,
        curve: 1.3,
        essential: true,
      });
    }
  };

  // Handle Virtual Tour Toggle
  const toggleVirtualMode = () => {
    setIsVirtualMode((prev) => {
      const newMode = !prev;
      setVirtualModeNotification(
        newMode ? "Entered College View" : "Exited College View"
      );
      if (prev) setTimeout(() => setVirtualModeNotification(null), 1500);

      if (newMode) {
        // Entering Virtual Mode
        setCurrentStep(0);
        setGeofencedStepIndex(null);
        setShowGeofenceNotification(false);
        setShowGeofenceFallback(false);
        setUserLocation(null);
        // setIsLoading(false); // Set loading to false for virtual mode. Main effect handles progress.

        if (mapRef.current && steps.length > 0) {
          const map = mapRef.current;
          const centerCoord = steps[0].coordinate;
          const newCenter = getAdjustedCenter(map, centerCoord);

          if (
            newCenter &&
            !(
              newCenter[0] === centerCoord[0] &&
              newCenter[1] === centerCoord[1] &&
              map.project(centerCoord) === null
            )
          ) {
            map.flyTo({
              center: newCenter, // MODIFIED: Use adjusted center
              zoom: 17.5,
              pitch: 50, // Cinematic pitch
              bearing: 90, // Kept existing bearing
              speed: 0.9, // Cinematic speed
              curve: 1.3, // Cinematic curve
              essential: true,
            });
          } else {
            console.warn(
              "toggleVirtualMode: Failed to get adjusted center for initial flight."
            );
          }
        }
        setIsLoading(false); // Ensure loading is false after setup for virtual mode.
      } else {
        // Exiting Virtual Mode
        setIsLoading(true); // IMPORTANT: Set loading to true to show loader for real mode
        // Real location watch will restart due to useEffect dependency on isVirtualMode
        // The main isLoading effect will set progress to 0.
      }
      return newMode;
    });
  };

  // Manage progress bar based on actual loading state
  useEffect(() => {
    if (isLoading) {
      setProgress(0); // Reset to 0 when loading starts
    } else {
      // When loading is completely finished, ensure progress is 100%.
      setProgress(100);
    }
  }, [isLoading]); // Only depends on isLoading

  return (
    <div className="relative w-full h-screen font-dm-sans">
      {/* Virtual Mode Notification */}
      {virtualModeNotification && (
        <div className="fixed top-2   left-0 right-0 z-[1100] flex justify-center pointer-events-none">
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="backdrop-blur-md bg-[#0e0e0e]  rounded-full px-4 py-3 shadow-2xl text-white text-sm font-semibold pointer-events-auto"
          >
            <span className="flex items-center gap-2">
              <FiMapPin
                className="text-white bg-blue-700 rounded-full p-1"
                size={24}
              />
              {virtualModeNotification}
            </span>
          </motion.div>
        </div>
      )}

      {/* Loading Screen */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 1, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 bg-[#0e0e0e] flex flex-col items-center justify-center z-[5000] pointer-events-auto"
        >
          {/* Enhanced Map Pin Animation */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="relative mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-cyan-400/20 opacity-50"
            />
            <svg
              className="relative z-10 h-20 w-20 text-cyan-400 drop-shadow-2xl"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 4.5 7 13 7 13s7-8.5 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
            </svg>
          </motion.div>

          {/* Enhanced Progress Bar */}
          <div className="w-64 max-w-xs h-2 bg-[#1c1c1c] rounded-full overflow-hidden mb-6 border border-[#444444]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: progress + "%" }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full shadow-lg"
              style={{ minWidth: 8 }}
            />
          </div>

          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-2xl font-bold text-cyan-400 tracking-tight mb-2"
          >
            Preparing Your Journey
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm text-gray-400 text-center max-w-md px-6"
          >
            Setting up your immersive experience. Please wait while we calibrate
            the navigation system.
          </motion.p>
        </motion.div>
      )}

      {/* Geofence Notifications */}
      {!isVirtualMode &&
        geofencedStepIndex !== null &&
        showGeofenceNotification &&
        steps[geofencedStepIndex] && (
          <div className="fixed top-4 left-0 right-0 z-[1050] flex justify-center pointer-events-none">
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="relative backdrop-blur-md bg-[#0e0e0e] border border-[#444444] rounded-2xl w-full mx-4 max-w-md py-3 px-6 pointer-events-auto flex items-center justify-between shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="bg-cyan-400/20 p-2 rounded-full">
                  <FiMapPin className="text-cyan-400" size={18} />
                </div>
                <p className="text-gray-300 text-sm">
                  You&apos;re near{" "}
                  <span className="font-semibold text-cyan-400">
                    {steps[geofencedStepIndex].name}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowGeofenceNotification(false)}
                className="ml-4 hover:bg-[#1c1c1c] text-gray-400 rounded-full p-2 transition-colors duration-200"
                aria-label="Close notification"
              >
                <FiX size={16} />
              </button>
            </motion.div>
          </div>
        )}

      {/* Geofence Fallback */}
      {!isVirtualMode && showGeofenceFallback && (
        <div className="fixed top-4 left-0 right-0 z-[1050] flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="relative backdrop-blur-md bg-[#0e0e0e] border border-red-500/50 rounded-full w-full mx-4 max-w-md py-3 px-6 pointer-events-auto flex items-center justify-between shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full">
                <FiAlertTriangle className="text-red-500" size={18} />
              </div>
              <p className="text-gray-300 text-sm">
                You&apos;ve wandered outside the tour area
              </p>
            </div>
            <button
              onClick={() => setShowGeofenceFallback(false)}
              className="ml-4 hover:bg-[#1c1c1c] text-gray-400 rounded-full p-2 transition-colors duration-200"
              aria-label="Close notification"
            >
              <FiX size={16} />
            </button>
          </motion.div>
        </div>
      )}

      {showWelcome && <Welcome onClose={() => setShowWelcome(false)} />}
      {showConfetti && <Confetti onClose={() => setShowConfetti(false)} />}

      <div
        ref={mapContainer}
        className="w-full h-screen fixed top-0 left-0 z-10"
        style={{ minHeight: "60vh" }}
      />

      <StepCard
        step={steps[currentStep]}
        onPrev={isVirtualMode ? handlePrev : null}
        onNext={isVirtualMode ? handleNext : null}
        isFirst={currentStep === 0}
        isLast={currentStep === steps.length - 1}
        steps={steps}
        currentStepIndex={currentStep}
        onRecenter={handleRecenter}
        onResetTour={handleResetTour}
        legs={legs}
        directions={directions}
        toggleVirtualMode={toggleVirtualMode}
        isVirtualMode={isVirtualMode}
        isCardExpanded={isCardExpanded}
        setIsCardExpanded={setIsCardExpanded}
      />
    </div>
  );
};

export default MapWithTour;

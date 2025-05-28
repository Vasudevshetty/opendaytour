import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const markerColors = {
  inactive: "#6B7280", // gray
  active: "#2563EB", // blue
  user: "#EF4444", // red
};

const getMarkerIcon = (color, size = 24) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style='width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.2);'></div>`,
  });

function FlyToStep({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15);
  }, [position, map]);
  return null;
}

const MapWithTour = ({ steps, currentStep, setCurrentStep, userLocation }) => {
  return (
    <MapContainer
      center={steps[0].coordinate.slice().reverse()}
      zoom={15}
      scrollWheelZoom={true}
      className="w-full h-screen fixed top-0 left-0 z-10"
      style={{ minHeight: "60vh" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline
        positions={steps.map((s) => s.coordinate.slice().reverse())}
        pathOptions={{ color: markerColors.active, weight: 4 }}
      />
      {steps.map((step, idx) => (
        <Marker
          key={idx}
          position={step.coordinate.slice().reverse()}
          icon={getMarkerIcon(
            idx === currentStep ? markerColors.active : markerColors.inactive
          )}
          eventHandlers={{ click: () => setCurrentStep(idx) }}
        >
          <Popup>
            <b>{step.name}</b>
            <br />
            {step.description}
          </Popup>
        </Marker>
      ))}
      {userLocation && (
        <Marker
          position={userLocation.slice().reverse()}
          icon={getMarkerIcon(markerColors.user, 20)}
        >
          <Popup>You are here</Popup>
        </Marker>
      )}
      <FlyToStep position={steps[currentStep].coordinate.slice().reverse()} />
    </MapContainer>
  );
};

export default MapWithTour;

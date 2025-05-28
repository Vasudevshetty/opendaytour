import { useState, useEffect } from "react";
import MapWithTour from "./MapWithTour";
import StepCard from "./StepCard";
import { tourSteps } from "./data/tourSteps";

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [recenterKey, setRecenterKey] = useState(0); // for triggering recenter

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

  const handlePrev = () => setCurrentStep((s) => Math.max(0, s - 1));
  const handleNext = () =>
    setCurrentStep((s) => Math.min(tourSteps.length - 1, s + 1));

  // Handler for recentering map
  const handleRecenter = () => setRecenterKey((k) => k + 1);

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <MapWithTour
        steps={tourSteps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        userLocation={userLocation}
        recenterKey={recenterKey}
      />
      <StepCard
        step={tourSteps[currentStep]}
        onPrev={handlePrev}
        onNext={handleNext}
        isFirst={currentStep === 0}
        isLast={currentStep === tourSteps.length - 1}
        steps={tourSteps}
        currentStepIndex={currentStep}
        onRecenter={handleRecenter}
      />
    </div>
  );
}

export default App;

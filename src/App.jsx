import { useState, useEffect } from "react";
import MapWithTour from "./MapWithTour";
import StepCard from "./StepCard";
import { tourSteps } from "./data/tourSteps";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [recenterKey, setRecenterKey] = useState(0); // for triggering recenter
  const [showWelcome, setShowWelcome] = useState(true);

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

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const handlePrev = () => setCurrentStep((s) => Math.max(0, s - 1));
  const handleNext = () =>
    setCurrentStep((s) => Math.min(tourSteps.length - 1, s + 1));

  // Handler for recentering map
  const handleRecenter = () => setRecenterKey((k) => k + 1);

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {" "}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex justify-center items-center pointer-events-none  backdrop-blur-sm font-dm-sans tracking-tight"
          >
            <motion.div
              exit={{ filter: "blur(10px)" }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="pointer-events-auto px-10 py-6 rounded-3xl shadow-2xl border border-orange-200/30 bg-gradient-to-br from-white via-orange-50 to-blue-50 backdrop-blur-lg max-w-md w-full mx-6 flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 via-transparent to-blue-500/10 rounded-3xl"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-orange-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h2 className="text-xl font-black mb-1 text-center text-black  tracking-tight leading-tight">
                  Welcome to
                </h2>
                <h2 className="text-3xl font-bold  text-center bg-gradient-to-r from-orange-600 via-blue-700 to-orange-500 bg-clip-text text-transparent tracking-tight leading-tight">
                  JSS STU
                </h2>
                <p className="text-base text-gray-600 text-center py-4 font-medium leading-tight">
                  JSS Science and Technology University. Formerly (Sri
                  Jayachamarajendra College of Engineering (SJCE))
                </p>
                <p className="text-lg text-gray-700 text-center my-2 font-semibold">
                  Mysuru Campus
                </p>

                <div className="flex items-center gap-2 px-4 py-2 my-2 rounded-full bg-gradient-to-r from-orange-100 to-blue-100 border border-orange-200">
                  <span className="text-sm text-gray-700 font-semibold">
                    Your adventure begins now
                  </span>
                  <span className="text-lg">🚩</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

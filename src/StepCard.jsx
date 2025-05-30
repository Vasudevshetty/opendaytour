import { motion } from "framer-motion";
import { useState, useEffect } from "react"; // Added useEffect
import {
  FiMapPin,
  FiNavigation,
  FiRotateCcw,
  FiChevronUp,
  FiChevronDown,
  FiEye,
  FiEyeOff,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft, // Added for Previous button
  FiArrowRight, // Added for Next button
} from "react-icons/fi"; // Added react-icons
import { FaStreetView } from "react-icons/fa"; // For 3D/Virtual mode

const StepCard = ({
  step,
  onPrev,
  onNext,
  isFirst,
  isLast,
  steps,
  currentStepIndex,
  onRecenter,
  onResetTour,
  isFinalStep,
  toggleVirtualMode,
  isVirtualMode,
  isCardExpanded,
  setIsCardExpanded,
}) => {
  const hopNumber =
    typeof currentStepIndex === "number" ? currentStepIndex + 1 : 1;
  const totalHops = Array.isArray(steps) ? steps.length : undefined;
  const [isImageSectionExpanded, setIsImageSectionExpanded] = useState(false); // Renamed from 'expanded'
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false); // New state for hover
  const images =
    // Array.isArray(step.images) && step.images.length > 0
    //   ? step.images :
    ["/campus/js1.jpg", "/campus/js2.jpg"]; // Placeholder if no images

  // Effect for Escape key to collapse card
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isCardExpanded) {
        setIsCardExpanded(false);
        setIsImageSectionExpanded(false); // Reset image section when collapsing
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCardExpanded, setIsCardExpanded]);
  // Effect for auto-collapsing the card
  useEffect(() => {
    let timer;
    if (isCardExpanded && !isHovering && !isVirtualMode) {
      timer = setTimeout(() => {
        setIsCardExpanded(false);
        setIsImageSectionExpanded(false); // Reset image section when collapsing
      }, 4000); // Auto-collapse after 4 seconds
    }
    return () => {
      clearTimeout(timer);
    };
  }, [isCardExpanded, isHovering, isVirtualMode, setIsCardExpanded]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const handleNextImage = (e) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev + 1) % images.length);
  };
  return (
    <>
      {/* Main Card Container */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-2 left-1/2 right-auto z-30 font-dm-sans tracking-tight transform -translate-x-1/2 w-[95vw] max-w-md"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Action Buttons - Positioned above the card's header, aligned to the right of the card */}
        <div className="absolute bottom-[calc(100%+8px)] flex flex-col items-end gap-2 pointer-events-auto z-40 right-0 w-full pr-1">
          {onRecenter && !isVirtualMode && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200"
              onClick={onRecenter}
              title="Recenter Map"
            >
              <FiNavigation size={20} />
            </motion.button>
          )}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: onRecenter ? 0.3 : 0.2, duration: 0.3 }} // Delay slightly more if recenter is present
            className="h-10 px-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            onClick={() => {
              setIsCardExpanded(true);
              setIsImageSectionExpanded(false); // Reset image section when toggling card
              toggleVirtualMode();
            }}
            title={isVirtualMode ? "Exit College View " : "Explore College"}
          >
            <FaStreetView size={18} />
            <span>
              {isVirtualMode ? "Exit College View" : "Explore College"}
            </span>
          </motion.button>
        </div>

        {/* The actual card content div */}
        <div className="bg-[#0e0e0e] rounded-4xl w-full pointer-events-auto flex flex-col relative overflow-hidden shadow-2xl">
          {/* Header - Always visible */}
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            {/* Left: Spot Info */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-[#1c1c1c] border border-[#444444] rounded-full px-3 py-1.5 text-gray-100 font-medium text-xs tracking-wide">
                <FiMapPin className="mr-0.5 text-cyan-400" size={12} />
                <span>Spot {hopNumber}</span>
                {isCardExpanded && totalHops ? (
                  <span className="text-gray-400 ml-0.5">/ {totalHops}</span>
                ) : null}
              </div>
            </div>

            {/* Middle: Step Name (Ellipsed & Clickable to expand/collapse) - Only if card is collapsed */}
            {!isCardExpanded && (
              <div
                className="flex-1 mx-2 overflow-hidden text-center cursor-pointer"
                onClick={() => setIsCardExpanded((prev) => !prev)}
              >
                <h2
                  className="text-base font-semibold text-gray-100 truncate"
                  title={step.name}
                >
                  {step.name}
                </h2>
              </div>
            )}
            {/* Spacer if card is expanded and name moves down */}
            {isCardExpanded && <div className="flex-1 mx-2"></div>}

            {/* Right: Action Buttons (Reset, Expand/Collapse) */}
            <div className="flex items-center gap-1.5">
              <button
                className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-all duration-200"
                onClick={onResetTour}
                title="Reset Tour"
              >
                <FiRotateCcw size={18} />
              </button>
              <button
                className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-all duration-200"
                onClick={() => setIsCardExpanded((prev) => !prev)}
                title={isCardExpanded ? "Collapse" : "Expand"}
              >
                {isCardExpanded ? (
                  <FiChevronDown size={20} />
                ) : (
                  <FiChevronUp size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Content Area */}
          <motion.div
            initial={false}
            animate={{
              height: isCardExpanded ? "auto" : 0,
              opacity: isCardExpanded ? 1 : 0,
              paddingTop: isCardExpanded ? "1rem" : 0, // Corresponds to p-4
            }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden" // Crucial for height animation
          >
            {isCardExpanded && (
              <div className="px-4 py-4">
                {/* Step Name - Moved here for expanded view */}
                <h2 className="text-xl font-bold mb-2 text-center text-gray-100 leading-tight">
                  {step.name}
                </h2>
                <p className="text-gray-300 mb-3 text-center text-sm leading-relaxed">
                  {step.description}
                </p>

                {images.length > 0 && (
                  <button
                    className="w-full py-2 cursor-pointer text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={() => setIsImageSectionExpanded((v) => !v)}
                  >
                    <span>
                      {isImageSectionExpanded ? "Hide Images" : "View Images"}
                    </span>
                    {isImageSectionExpanded ? (
                      <FiEyeOff size={16} />
                    ) : (
                      <FiEye size={16} />
                    )}
                  </button>
                )}

                <motion.div
                  className="w-full flex flex-col items-center overflow-hidden"
                  initial={false}
                  animate={{
                    height: isImageSectionExpanded
                      ? images.length
                        ? 180
                        : 0
                      : 0,
                    opacity: isImageSectionExpanded ? 1 : 0,
                    scale: isImageSectionExpanded ? 1 : 0.95,
                    marginTop:
                      isImageSectionExpanded && images.length ? "0.5rem" : 0, // Reduced margin
                  }}
                  transition={{
                    height: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                    opacity: {
                      duration: isImageSectionExpanded ? 0.3 : 0.4,
                      delay: isImageSectionExpanded ? 0.1 : 0,
                      ease: [0.4, 0, 0.2, 1],
                    },
                    scale: {
                      duration: 0.4,
                      ease: [0.4, 0, 0.2, 1],
                    },
                  }}
                  // style display is handled by height and opacity animation
                >
                  {isImageSectionExpanded && images.length > 0 && (
                    <div className="relative w-full h-40 flex items-center justify-center">
                      <img
                        src={images[carouselIndex]}
                        alt={`Step image ${carouselIndex + 1}`}
                        className="rounded-xl w-full h-full object-cover shadow-lg"
                        style={{ transition: "opacity 0.3s" }}
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 hover:bg-cyan-700 transition flex items-center justify-center"
                            onClick={handlePrevImage}
                            title="Previous Image"
                          >
                            <FiChevronLeft size={18} />
                          </button>
                          <button
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 hover:bg-cyan-700 transition flex items-center justify-center"
                            onClick={handleNextImage}
                            title="Next Image"
                          >
                            <FiChevronRight size={18} />
                          </button>
                        </>
                      )}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${
                              idx === carouselIndex
                                ? "bg-cyan-400"
                                : "bg-gray-500"
                            } inline-block`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
            {/* Navigation buttons - only if card is expanded AND in virtual mode */}
            {isCardExpanded && isVirtualMode && (
              <div className="flex justify-between p-3 border-t border-gray-800 mt-1.5">
                <button
                  onClick={onPrev}
                  disabled={isFirst}
                  className="px-4 py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                >
                  <FiArrowLeft size={18} />
                  <span>Previous</span>
                </button>
                <button
                  onClick={onNext}
                  disabled={isLast}
                  className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                >
                  <span>{isFinalStep ? "Finish Tour" : "Next"}</span>
                  <FiArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default StepCard;

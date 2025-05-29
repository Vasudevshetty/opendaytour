import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

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
  isVirtualMode, // <-- add this prop
}) => {
  const hopNumber =
    typeof currentStepIndex === "number" ? currentStepIndex + 1 : 1;
  const totalHops = Array.isArray(steps) ? steps.length : undefined;
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  // const images = Array.isArray(step.images) ? step.images : [];
  const images = ["/campus/js1.jpg", "/campus/js2.jpg"]; // Placeholder images

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
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer group touch-manipulation"
          onClick={() => setIsOpen(true)}
        >
          {" "}
          <div className="relative">
            <svg
              width="24"
              height="24"
              fill="currentColor"
              stroke="none"
              viewBox="0 0 24 24"
              className="sm:w-[26px] sm:h-[26px] group-hover:scale-110 transition-transform duration-200"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {/* Notification dot for current step */}
            <div className="absolute -top-5 -right-4 sm:-top-3 sm:-right-2 w-6 h-6 sm:w-5 sm:h-5 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-[9px] sm:text-[10px] font-bold text-white">
                {hopNumber}
              </span>
            </div>
          </div>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 150, opacity: 0, scale: 0.7, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0)" }}
            exit={{ y: 150, opacity: 0, scale: 0.7, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-2 left-1/2 right-auto z-30 pointer-events-none font-dm-sans tracking-tight transform -translate-x-1/2 w-[95vw] max-w-md min-h-60"
          >
            <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(100%+16px)] z-40 flex justify-center w-full pointer-events-none">
              <button
                className="pointer-events-auto  px-4 py-2 rounded-full bg-cyan-700 hover:bg-cyan-800 text-white font-semibold shadow-lg transition-all duration-200 text-sm"
                onClick={toggleVirtualMode}
              >
                {isVirtualMode ? "Exit Virtual Mode" : "Enter Virtual Mode"}
              </button>
            </div>
            <div
              className=" bg-[#0e0e0e]  rounded-4xl w-full pointer-events-auto flex flex-col relative overflow-hidden"
              style={{
                minHeight: expanded ? 300 : 200,
                transition: "min-height 0.4s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#1c1c1c] border border-[#444444] rounded-full px-3 py-1.5 text-gray-100 font-medium text-xs tracking-wide">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 22 22"
                      fill="#38bdf8"
                      stroke="none"
                      className="mr-0.5"
                    >
                      <circle cx="12" cy="12" r="6" />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.2"
                      />
                    </svg>
                    <span>Spot {hopNumber}</span>
                    {totalHops ? (
                      <span className="text-gray-400">/ {totalHops}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Action buttons */}
                  <button
                    className="w-10 h-10 bg-cyan-700 hover:bg-cyan-900 text-white rounded-full shadow transition-all duration-200 flex items-center justify-center"
                    onClick={onResetTour}
                    title="Reset Tour"
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M3 21v-5h5" />
                    </svg>
                  </button>

                  {onRecenter && (
                    <button
                      className="w-10 h-10 bg-black cursor-pointer border border-red-500  text-red-400 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-700 flex items-center justify-center"
                      onClick={onRecenter}
                      title="Recenter Map"
                    >
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2L12 6" />
                        <path d="M12 18L12 22" />
                        <path d="M22 12L18 12" />
                        <path d="M6 12L2 12" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                      </svg>
                    </button>
                  )}

                  {/* Close button */}
                  <button
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-all duration-200 flex items-center justify-center"
                    onClick={() => setIsOpen(false)}
                    title="Close"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1">
                <h2 className="text-xl font-bold mb-1 text-center text-gray-100 leading-tight">
                  {step.name}
                </h2>
                <p className="text-gray-300 mb-3 text-center text-sm leading-relaxed">
                  {step.description}
                </p>

                {images.length > 0 && (
                  <button
                    className="w-full py-2 cursor-pointer text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={() => setExpanded((v) => !v)}
                  >
                    <span>{expanded ? "Hide Images" : "View Images"}</span>
                    <span>{expanded ? "▲" : "▼"}</span>
                  </button>
                )}

                {/* Images section */}
                <motion.div
                  className="w-full flex flex-col items-center overflow-hidden"
                  initial={false}
                  animate={{
                    height: expanded ? (images.length ? 180 : 0) : 0,
                    opacity: expanded ? 1 : 0,
                    scale: expanded ? 1 : 0.95,
                  }}
                  transition={{
                    height: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                    opacity: {
                      duration: expanded ? 0.3 : 0.4,
                      delay: expanded ? 0.1 : 0,
                      ease: [0.4, 0, 0.2, 1],
                    },
                    scale: {
                      duration: 0.4,
                      ease: [0.4, 0, 0.2, 1],
                    },
                  }}
                  style={{
                    display: expanded && images.length ? "flex" : "none",
                  }}
                >
                  {images.length > 0 && (
                    <div className="relative w-full h-40 flex items-center justify-center mt-3">
                      <img
                        src={images[carouselIndex]}
                        alt={`Step image ${carouselIndex + 1}`}
                        className="rounded-xl w-full h-full object-cover shadow-lg"
                        style={{ transition: "opacity 0.3s" }}
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1 hover:bg-cyan-700 transition"
                            onClick={handlePrevImage}
                          >
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <button
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1 hover:bg-cyan-700 transition"
                            onClick={handleNextImage}
                          >
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
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

              {/* Navigation buttons */}
              {isVirtualMode && (
                <div className="flex justify-between p-4 border-t border-gray-700">
                  <button
                    onClick={onPrev}
                    disabled={isFirst}
                    className="px-6 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={onNext}
                    disabled={isLast}
                    className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isFinalStep ? "Finish Tour" : "Next"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* End Expanded Card */}
    </>
  );
};

export default StepCard;

import { motion } from "framer-motion";
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
}) => {
  const hopNumber =
    typeof currentStepIndex === "number" ? currentStepIndex + 1 : 1;
  const totalHops = Array.isArray(steps) ? steps.length : undefined;
  const [expanded, setExpanded] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const images = Array.isArray(step.images) ? step.images : [];

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
      {" "}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-none font-dm-sans tracking-tight"
      >
        <div
          className="backdrop-blur-md bg-[#0e0e0e] shadow-2xl rounded-t-4xl w-full max-w-sm mx-auto px-6 py-3 mb-0 pointer-events-auto flex flex-col items-center relative overflow-hidden"
          style={{
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.7)",
            minHeight: expanded ? 240 : 160,
            transition: "min-height 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {" "}
          <div className="flex py-3 flex-row items-center justify-between w-full mb-2">
            <div className="flex items-center gap-1.5 bg-[#1c1c1c] border border-[#444444] rounded-full px-3 py-2 text-gray-100 font-medium text-xs tracking-wide backdrop-blur-md">
              <svg
                width="14"
                height="14"
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

              <span>Spot</span>
              <span className="ml-1 text-cyan-400">{hopNumber}</span>
              {totalHops ? (
                <span className="text-gray-400">/ {totalHops}</span>
              ) : null}
            </div>{" "}
            <div className="flex items-center gap-2">
              <button
                className="w-12 h-12 bg-cyan-700 hover:bg-cyan-900 text-white rounded-full shadow font-bold transition-all duration-200 mx-0.5 flex items-center justify-center"
                onClick={onResetTour}
                style={{ marginLeft: 2, marginRight: 2 }}
                title="Reset Tour"
              >
                <svg
                  width="24"
                  height="24"
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
              </button>{" "}
              {onRecenter && (
                <button
                  className="w-12 h-12 bg-black cursor-pointer border border-red-500  text-red-400 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 flex items-center justify-center"
                  onClick={onRecenter}
                  title="Recenter Map"
                >
                  <svg
                    width="24"
                    height="24"
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
                  <span className="sr-only">Recenter Map</span>
                </button>
              )}
            </div>
          </div>{" "}
          <h2 className="text-2xl font-bold mb-1 text-center text-gray-100 drop-shadow-lg leading-tight">
            {step.name}
          </h2>
          <p className="text-gray-300 mb-2 text-center text-xs leading-snug px-2">
            {step.description}
          </p>
          <button
            className="py-2 cursor-pointer text-white text-sm"
            onClick={() => setExpanded((v) => !v)}
            style={{ pointerEvents: "auto" }}
          >
            <span>{expanded ? "▲" : "▼"}</span>
          </button>{" "}
          <motion.div
            className="w-full flex flex-col items-center mb-2 overflow-hidden"
            initial={false}
            animate={{
              height: expanded ? (images.length ? 140 : 0) : 0,
              opacity: expanded ? 1 : 0,
            }}
            transition={{
              height: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.25 },
            }}
            style={{ display: expanded && images.length ? "flex" : "none" }}
          >
            {images.length > 0 && (
              <div className="relative w-52 h-32 flex items-center justify-center">
                <img
                  src={images[carouselIndex]}
                  alt={`Step image ${carouselIndex + 1}`}
                  className="rounded-xl w-full h-full object-cover border border-cyan-400 shadow-lg"
                  style={{ transition: "opacity 0.3s" }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-0.5 hover:bg-cyan-700 transition"
                      onClick={handlePrevImage}
                      tabIndex={-1}
                    >
                      <svg
                        width="18"
                        height="18"
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
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-0.5 hover:bg-cyan-700 transition"
                      onClick={handleNextImage}
                      tabIndex={-1}
                    >
                      <svg
                        width="18"
                        height="18"
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
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        idx === carouselIndex ? "bg-cyan-400" : "bg-gray-500"
                      } inline-block`}
                    />
                  ))}
                </div>
              </div>
            )}
            {images.length === 0 && (
              <div className="w-52 h-24 bg-gray-800 rounded-xl flex items-center justify-center text-gray-300 border border-cyan-400 shadow-lg mb-1 text-xs">
                No images available
              </div>
            )}
          </motion.div>{" "}
          <div className="flex gap-1 w-full justify-between mt-auto pt-0.5 flex-wrap sm:flex-nowrap">
            <button
              className="flex-1 min-w-[70px] flex items-center justify-center cursor-pointer gap-1 bg-gray-800 text-gray-200 px-1.5 py-3 rounded-full shadow hover:bg-gray-700 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
              onClick={onPrev}
              disabled={isFirst || isFinalStep}
              style={{ marginRight: 2 }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="inline-block"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Prev
            </button>

            <button
              className="flex-1 min-w-[70px] flex items-center justify-center gap-1 cursor-pointer bg-green-500 text-white px-1.5 py-3 rounded-full shadow hover:bg-green-600 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
              onClick={onNext}
              disabled={isLast || isFinalStep}
              style={{ marginLeft: 2 }}
            >
              Next
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="inline-block"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default StepCard;

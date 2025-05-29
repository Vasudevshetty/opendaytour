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
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-none font-dm-sans tracking-tight"
      >
        <div
          className="backdrop-blur-md bg-[#0e0e0e]  shadow-2xl rounded-t-3xl w-full max-w-md mx-auto px-7 py-5 mb-0 pointer-events-auto flex flex-col items-center relative overflow-hidden"
          style={{
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.7)",

            minHeight: expanded ? 290 : 220,
            transition: "min-height 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div className="flex flex-row  items-center justify-between w-full mb-4 ">
            <div className="flex items-center gap-2 bg-black rounded-full px-4 py-1.5 text-gray-100 font-medium text-sm tracking-wide backdrop-blur-md">
              <svg
                width="18"
                height="18"
                viewBox="0 0 22 22"
                fill="#38bdf8"
                stroke="none"
                className="mr-1"
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
            </div>
            {onRecenter && (
              <button
                className="bg-orange-500 cursor-pointer hover:bg-orange-600 text-white rounded-full p-2.5 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center justify-center"
                onClick={onRecenter}
                title="Go to current location"
              >
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                </svg>
                <span className="sr-only">Current Location</span>
              </button>
            )}
          </div>

          <h2 className="text-2xl font-extrabold mb-2 text-center text-gray-100 drop-shadow-lg leading-tight">
            {step.name}
          </h2>
          <p className="text-gray-300 mb-3 text-center text-sm leading-relaxed">
            {step.description}
          </p>
          <button
            className=" py-1 cursor-pointer text-white text-m "
            onClick={() => setExpanded((v) => !v)}
            style={{ pointerEvents: "auto" }}
          >
            <span>{expanded ? "▲" : " ▼"}</span>
          </button>
          <motion.div
            className="w-full flex flex-col items-center mb-3 overflow-hidden"
            initial={false}
            animate={{
              height: expanded ? (images.length ? 180 : 0) : 0,
              opacity: expanded ? 1 : 0,
            }}
            transition={{
              height: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.25 },
            }}
            style={{ display: expanded && images.length ? "flex" : "none" }}
          >
            {images.length > 0 && (
              <div className="relative w-64 h-40 flex items-center justify-center">
                <img
                  src={images[carouselIndex]}
                  alt={`Step image ${carouselIndex + 1}`}
                  className="rounded-2xl w-full h-full object-cover border-2 border-cyan-400 shadow-lg"
                  style={{ transition: "opacity 0.3s" }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1 hover:bg-cyan-700 transition"
                      onClick={handlePrevImage}
                      tabIndex={-1}
                    >
                      <svg
                        width="22"
                        height="22"
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1 hover:bg-cyan-700 transition"
                      onClick={handleNextImage}
                      tabIndex={-1}
                    >
                      <svg
                        width="22"
                        height="22"
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
                      className={`w-2 h-2 rounded-full ${
                        idx === carouselIndex ? "bg-cyan-400" : "bg-gray-500"
                      } inline-block`}
                    />
                  ))}
                </div>
              </div>
            )}
            {images.length === 0 && (
              <div className="w-64 h-32 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-300 border-2 border-cyan-400 shadow-lg mb-2">
                No images available
              </div>
            )}
          </motion.div>
          <div className="flex gap-1 w-full justify-between mt-auto pt-1 flex-wrap sm:flex-nowrap">
            <button
              className="flex-1 min-w-[80px] flex items-center justify-center cursor-pointer gap-2 bg-gray-800 text-gray-200 px-2 py-2 rounded-full shadow hover:bg-gray-700 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-base font-semibold"
              onClick={onPrev}
              disabled={isFirst || isFinalStep}
              style={{ marginRight: 4 }}
            >
              <svg
                width="20"
                height="20"
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
              Previous
            </button>
            <button
              className="flex-1 min-w-[80px] bg-cyan-700 hover:bg-cyan-900 text-white px-2 py-2 rounded-full shadow font-bold transition-all duration-200 mx-1 flex items-center justify-center"
              onClick={onResetTour}
              style={{ marginLeft: 4, marginRight: 4 }}
            >
              Reset
            </button>
            <button
              className="flex-1 min-w-[80px] flex items-center justify-center gap-2 cursor-pointer bg-green-500 text-white px-2 py-2 rounded-full shadow hover:bg-green-600 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-base font-semibold"
              onClick={onNext}
              disabled={isLast || isFinalStep}
              style={{ marginLeft: 4 }}
            >
              Next
              <svg
                width="20"
                height="20"
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

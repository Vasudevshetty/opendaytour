import { motion } from "framer-motion";

const StepCard = ({
  step,
  onPrev,
  onNext,
  isFirst,
  isLast,
  steps,
  currentStepIndex,
  onRecenter,
}) => {
  // Use currentStepIndex for dynamic step number
  const hopNumber =
    typeof currentStepIndex === "number" ? currentStepIndex + 1 : 1;
  const totalHops = Array.isArray(steps) ? steps.length : undefined;
  const stepsRemaining = totalHops
    ? Math.max(totalHops - hopNumber, 0)
    : undefined;

  return (
    <>
      <div className="fixed top-4 right-4 z-30 flex flex-col items-end gap-2 pointer-events-auto select-none">
        <div className="flex items-center gap-2 bg-black rounded-full px-4 py-2 text-gray-100 font-medium text-sm tracking-wide backdrop-blur-md">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
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
        {typeof stepsRemaining === "number" && (
          <div className="flex items-center gap-2 bg-black shadow rounded-full px-4 py-2 text-cyan-300 font-medium text-sm backdrop-blur-md">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 1v4a2 2 0 0 0 2 2h4" />
              <path d="M7 23v-4a2 2 0 0 0-2-2H1" />
              <path d="M20.49 9A9 9 0 0 1 15 20.94" />
              <path d="M3.51 15A9 9 0 0 1 9 3.06" />
            </svg>
            {stepsRemaining === 0 ? (
              <span className="text-green-400 font-medium">Final step</span>
            ) : (
              <span className="text-xs">
                {stepsRemaining} step
                {stepsRemaining === 1 ? "" : "s"} remaining
              </span>
            )}
          </div>
        )}
        {/* Current Location Button - below status, aligned left */}
        {onRecenter && (
          <button
            className="mt-2 bg-red-500 cursor-pointer hover:bg-red-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center justify-center"
            onClick={onRecenter}
            title="Go to current location"
            style={{ boxShadow: "0 0 6px 2px #EF4444AA" }}
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
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-none font-dm-sans tracking-tight"
      >
        <div
          className="backdrop-blur-sm bg-black/90 border border-gray-700 shadow-2xl rounded-t-3xl w-full max-w-md mx-auto p-6 mb-0 pointer-events-auto flex flex-col items-center relative overflow-hidden"
          style={{
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.7)",
            borderTop: "2px solid #22223b",
            borderLeft: "1px solid #22223b",
            borderRight: "1px solid #22223b",
          }}
        >
          <h2 className="text-2xl font-extrabold mb-4 text-center text-gray-100 drop-shadow-lg">
            {step.name}
          </h2>
          <p className="text-gray-300 mb-6 text-center text-base leading-relaxed">
            {step.description}
          </p>
          <div className="flex gap-4 w-full justify-between mt-auto">
            <button
              className="flex items-center cursor-pointer gap-2 bg-gray-800 text-gray-200 px-5 py-2 rounded-full shadow hover:bg-gray-700 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-base font-semibold"
              onClick={onPrev}
              disabled={isFirst}
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
              className="flex items-center gap-2 cursor-pointer bg-green-500 text-white px-5 py-2 rounded-full shadow hover:bg-blue-800 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-base font-semibold"
              onClick={onNext}
              disabled={isLast}
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

import { motion } from "framer-motion";

const StepCard = ({ step, onPrev, onNext, isFirst, isLast }) => {
  const hopNumber = step?.number || step?.index || step?.hop || 1;
  const totalHops = step?.total || step?.totalHops || undefined;

  return (
    <>
      <div className="fixed top-5 right-4  z-30 flex items-center justify-center bg-gray-900/90 border border-gray-700 rounded-full px-5 py-2 shadow-lg text-gray-100 font-semibold text-lg pointer-events-none select-none backdrop-blur-sm">
        Hop {hopNumber}
        {totalHops ? ` / ${totalHops}` : ""}
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
          <h2 className="text-3xl font-extrabold mb-4 text-center text-gray-100 drop-shadow-lg">
            {step.name}
          </h2>
          <p className="text-gray-300 mb-6 text-center text-base leading-relaxed">
            {step.description}
          </p>
          <div className="flex gap-4 w-full justify-between mt-auto">
            <button
              className="flex items-center gap-2 bg-gray-800 text-gray-200 px-5 py-2 rounded-full shadow hover:bg-gray-700 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-base font-semibold"
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
              className="flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-full shadow hover:bg-blue-800 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-base font-semibold"
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

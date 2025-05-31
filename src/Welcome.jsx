import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Welcome = ({ onClose }) => {
  const overlayRef = useRef();

  // ESC key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Overlay click closes modal
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  return (
    <AnimatePresence>
      {
        <motion.div
          initial={{ y: -40, opacity: 0, filter: "blur(12px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -40, opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-4 left-0 right-0 z-[1100] flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-lg border border-gray-700 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 max-w-sm w-full mx-4 relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-blue-700 flex items-center justify-center shadow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex flex-col items-start flex-1">
              <h2 className="text-base font-bold text-white tracking-tight leading-tight mb-0.5">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-orange-400 via-blue-400 to-orange-300 bg-clip-text text-transparent">
                  JSS STU
                </span>
              </h2>
              <p className="text-xs text-gray-300 font-medium leading-tight mt-0.5">
                Let &apos;s start exploring!
              </p>
            </div>
            <button
              className="ml-3 px-3 py-1.5 bg-gradient-to-r from-cyan-700 via-blue-700 to-blue-600 text-white rounded-full font-bold shadow hover:from-cyan-800 hover:to-orange-700 transition-all duration-200 border border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-orange-400/40 text-xs pointer-events-auto"
              onClick={onClose}
            >
              Start
            </button>
          </div>
        </motion.div>
      }
    </AnimatePresence>
  );
};

export default Welcome;

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Confetti = ({ onClose }) => {
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
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm font-dm-sans tracking-tight"
        style={{ pointerEvents: "auto" }}
        onClick={handleOverlayClick}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="pointer-events-auto px-10 py-6 rounded-3xl shadow-2xl border border-orange-200/30 bg-gradient-to-br from-white via-orange-50 to-blue-50 backdrop-blur-lg max-w-md w-full mx-6 flex flex-col items-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 via-transparent to-blue-500/10 rounded-3xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-orange-400 to-blue-600 flex items-center justify-center shadow-lg">
              <span role="img" aria-label="confetti" style={{ fontSize: 40 }}>
                🎉
              </span>
            </div>
            <h2 className="text-xl font-black mb-1 text-center text-black tracking-tight leading-tight">
              Tour Complete!
            </h2>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-orange-600 via-blue-700 to-orange-500 bg-clip-text text-transparent tracking-tight leading-tight">
              Congratulations
            </h2>
            <p className="text-base text-gray-600 text-center py-4 font-medium leading-tight">
              You have finished the campus tour. We hope you enjoyed the
              journey!
            </p>
            <div className="flex items-center gap-2 px-4 py-2 my-2 rounded-full bg-gradient-to-r from-orange-100 to-blue-100 border border-orange-200">
              <span className="text-sm text-gray-700 font-semibold">
                Thank you for visiting
              </span>
              <span className="text-lg">🎊</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Confetti;

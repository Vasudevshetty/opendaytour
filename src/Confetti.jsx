import { motion } from "framer-motion";

const Confetti = ({ children }) => (
  <div className="fixed inset-0 z-50 flex justify-center items-center">
    {/* Map overlay for cool effect */}
    <div className="absolute inset-0 w-full h-full z-0 opacity-70 pointer-events-none">
      {children}
    </div>
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className="pointer-events-auto px-10 py-6 rounded-3xl shadow-2xl border border-orange-200/30 bg-gradient-to-br from-white via-orange-50 to-blue-50 backdrop-blur-lg max-w-md w-full mx-6 flex flex-col items-center relative overflow-hidden z-10"
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
          You have finished the campus tour. We hope you enjoyed the journey!
        </p>
        <div className="flex items-center gap-2 px-4 py-2 my-2 rounded-full bg-gradient-to-r from-orange-100 to-blue-100 border border-orange-200">
          <span className="text-sm text-gray-700 font-semibold">
            Thank you for visiting
          </span>
          <span className="text-lg">🎊</span>
        </div>
      </div>
    </motion.div>
    <style>{`
      @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      .animate-fade-in { animation: fade-in 0.7s; }
    `}</style>
  </div>
);

export default Confetti;

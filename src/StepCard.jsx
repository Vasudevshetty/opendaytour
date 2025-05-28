import { motion } from "framer-motion";

const StepCard = ({ step, onPrev, onNext, isFirst, isLast }) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-none"
    >
      <div className="bg-white rounded-t-2xl shadow-xl w-full max-w-md mx-auto p-6 mb-0 pointer-events-auto flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2 text-center">{step.name}</h2>
        <p className="text-gray-600 mb-4 text-center">{step.description}</p>
        <div className="flex gap-4 w-full justify-between">
          <button
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
            onClick={onPrev}
            disabled={isFirst}
          >
            Previous
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={onNext}
            disabled={isLast}
          >
            Next
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default StepCard;

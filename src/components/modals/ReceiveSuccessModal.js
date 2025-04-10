"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function ReceiveSuccessModal({ show, onClose, amount, network }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <motion.div
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-8 rounded-2xl shadow-lg bg-black border-2 border-green-400 text-center"
            style={{
              background: "linear-gradient(145deg, #0a0a0a, #111)",
              color: "white",
              boxShadow: "0 0 25px rgba(0, 255, 0, 0.5)",
            }}
          >
            <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Funds Received!</h2>
            <p style={{ fontSize: "1.2rem" }}>+{amount} {network.toUpperCase()}</p>

            <button
              onClick={onClose}
              style={{
                marginTop: "2rem",
                padding: "0.7rem 2rem",
                backgroundColor: "#00FF00",
                borderRadius: "12px",
                fontWeight: "bold",
                color: "#000",
              }}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

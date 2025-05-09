"use client";

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function DeleteAccountRequest() {
  const { user } = useAuth();

  const handleDeleteRequest = async () => {
    if (!user) {
      toast.error("❌ No user logged in.");
      return;
    }

    try {
      // ✅ Open mail client for delete request
      window.open(`mailto:support@nordbalticum.com?subject=Delete%20Account%20Request&body=I%20would%20like%20to%20delete%20my%20account.%20Email:%20${user.email}`, "_blank");

      toast.success("✅ Request initiated. Please complete the email.");
    } catch (error) {
      console.error("Delete request error:", error.message);
      toast.error("❌ Could not open email client.");
    }
  };

  return (
    <motion.div
      style={{
        marginTop: "32px",
        width: "100%",
        maxWidth: "460px",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h4 style={{ textAlign: "center", marginBottom: "12px", color: "#fff" }}>
        Delete Account
      </h4>

      <motion.button
        onClick={handleDeleteRequest}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          background: "#D32F2F", // More refined red for danger actions
          color: "white",
          border: "1px solid #fff",
          fontWeight: "700",
          cursor: "pointer",
          fontFamily: "var(--font-crypto)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease",
        }}
        whileHover={{
          scale: 1.05,
          background: "#b71c1c",
        }}
        whileTap={{
          scale: 0.98,
        }}
      >
        Request Account Deletion
      </motion.button>
    </motion.div>
  );
}

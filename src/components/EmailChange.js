"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function EmailChange() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      toast.error("❌ Please enter a new email.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });

      if (error) {
        console.error("Email change error:", error.message);
        toast.error("❌ Failed to change email.");
        return;
      }

      toast.success("✅ Confirmation email sent! Check your inbox.");
      setNewEmail("");
    } catch (error) {
      console.error("Email Change Exception:", error.message);
      toast.error("❌ Error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      style={{
        marginTop: "32px",
        width: "100%",
        maxWidth: "460px",
        padding: "20px",
        background: "rgba(15, 23, 42, 0.8)",
        borderRadius: "16px",
        boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(12px)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h4 style={{ textAlign: "center", marginBottom: "12px", color: "#fff" }}>
        Change Email
      </h4>

      <input
        type="email"
        placeholder="Enter new email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          marginBottom: "16px",
          background: "rgba(255, 255, 255, 0.1)",
          color: "white",
          fontFamily: "var(--font-crypto)",
          fontSize: "16px",
          transition: "all 0.3s ease",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#4caf50")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.2)")}
      />

      <motion.button
        onClick={handleEmailChange}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          background: "#8b0000",
          color: "white",
          border: "1px solid white",
          fontWeight: "700",
          cursor: "pointer",
          fontFamily: "var(--font-crypto)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
          transition: "all 0.3s ease",
        }}
        whileHover={{
          background: "#ff0033",
          scale: 1.05,
        }}
        whileTap={{
          scale: 0.98,
        }}
      >
        {loading ? "Sending..." : "Send Confirmation"}
      </motion.button>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

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
    <div style={{ marginTop: "32px", width: "100%", maxWidth: "460px" }}>
      <h4 style={{ textAlign: "center", marginBottom: "12px" }}>Change Email</h4>

      <input
        type="email"
        placeholder="Enter new email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.2)",
          marginBottom: "12px",
          background: "rgba(255, 255, 255, 0.08)",
          color: "white",
          fontFamily: "var(--font-crypto)",
        }}
      />

      <button
        onClick={handleEmailChange}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          background: "black",
          color: "white",
          border: "1px solid white",
          fontWeight: "700",
          cursor: "pointer",
          fontFamily: "var(--font-crypto)",
        }}
      >
        {loading ? "Sending..." : "Send Confirmation"}
      </button>
    </div>
  );
        }

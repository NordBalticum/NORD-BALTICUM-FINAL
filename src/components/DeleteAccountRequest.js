"use client";

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

export default function DeleteAccountRequest() {
  const { user } = useAuth();

  const handleDeleteRequest = async () => {
    if (!user) {
      toast.error("❌ No user logged in.");
      return;
    }

    try {
      // ✅ Pateikiam paprastą el. laiško šabloną arba API call į tavo administratorių
      window.open(`mailto:support@nordbalticum.com?subject=Delete%20Account%20Request&body=I%20would%20like%20to%20delete%20my%20account.%20Email:%20${user.email}`, "_blank");

      toast.success("✅ Request initiated. Please complete the email.");
    } catch (error) {
      console.error("Delete request error:", error.message);
      toast.error("❌ Could not open email client.");
    }
  };

  return (
    <div style={{ marginTop: "32px", width: "100%", maxWidth: "460px" }}>
      <h4 style={{ textAlign: "center", marginBottom: "12px" }}>Delete Account</h4>

      <button
        onClick={handleDeleteRequest}
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
        }}
      >
        Request Account Deletion
      </button>
    </div>
  );
}

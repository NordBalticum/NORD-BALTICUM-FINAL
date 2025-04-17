"use client";

export default function MiniLoadingSpinner({ size = 20 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: "3px solid #f3f3f3",
        borderTop: "3px solid #3498db",
        borderRadius: "50%",
        animation: "spin 2s linear infinite",
      }}
    ></div>
  );
}

"use client";

import styles from "@/components/skeleton.module.css";

export default function SkeletonLoader({
  width = "100%",
  height = "20px",
  radius = "12px",
  style = {},
  className = "",
}) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

"use client";

import React, { useEffect, useState } from "react";
import styles from "./avatar.module.css";

export default function AvatarDisplay({ walletAddress = "anonymous", size = 64 }) {
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const loadAvatar = () => {
      const key = `user_avatar_${walletAddress}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        setAvatar(stored);
        return;
      }

      const seed = walletAddress || "anonymous";
      const generated = `https://api.dicebear.com/7.x/pixel-art-neutral/svg?seed=${seed}`;
      localStorage.setItem(key, generated);
      setAvatar(generated);
    };

    loadAvatar();

    const handleStorage = () => loadAvatar();
    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, [walletAddress]);

  return (
    <img
      src={avatar}
      alt="User Avatar"
      width={size}
      height={size}
      className={styles.avatar}
      loading="lazy"
      draggable={false}
      referrerPolicy="no-referrer"
    />
  );
}

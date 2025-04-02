"use client";

import React, { useEffect, useState } from "react";
import styles from "./avatar.module.css";

export default function AvatarDisplay({ walletAddress, size = 64 }) {
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const loadAvatar = () => {
      const stored = localStorage.getItem("user_avatar");

      // Jei jau turim avatarą localStorage
      if (stored) {
        setAvatar(stored);
        return;
      }

      // Jei turim wallet address – generuojam unikalų
      if (walletAddress) {
        const generated = `https://api.dicebear.com/7.x/pixel-art-neutral/svg?seed=${walletAddress}`;
        localStorage.setItem("user_avatar", generated);
        setAvatar(generated);
        return;
      }

      // Visiškas fallback
      setAvatar("https://api.dicebear.com/7.x/pixel-art-neutral/svg?seed=anonymous");
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

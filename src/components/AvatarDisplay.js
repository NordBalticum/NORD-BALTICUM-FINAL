"use client";

import React, { useEffect, useState } from "react";
import styles from "./avatar.module.css";

export default function AvatarDisplay({ walletAddress, size = 64 }) {
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const loadAvatar = () => {
      const saved = localStorage.getItem("user_avatar");

      if (saved) {
        setAvatar(saved);
      } else if (walletAddress) {
        // Naudojam Dicebear pixel-art-neutral kaip fallback, unikalus kiekvienam naudotojui
        const fallbackUrl = `https://api.dicebear.com/7.x/pixel-art-neutral/svg?seed=${walletAddress}`;
        setAvatar(fallbackUrl);
        localStorage.setItem("user_avatar", fallbackUrl);
      } else {
        // Minimalus default – jei neturim wallet
        setAvatar("https://api.dicebear.com/7.x/pixel-art-neutral/svg?seed=anonymous");
      }
    };

    loadAvatar();

    const onStorage = () => loadAvatar();
    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, [walletAddress]);

  return (
    <img
      src={avatar}
      alt="User Avatar"
      width={size}
      height={size}
      className={styles.avatar}
      loading="lazy"
    />
  );
}

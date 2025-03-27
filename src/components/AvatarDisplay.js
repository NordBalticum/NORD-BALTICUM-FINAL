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
        const fallbackUrl = `https://robohash.org/${walletAddress}?set=set5&size=200x200`;
        setAvatar(fallbackUrl);
        localStorage.setItem("user_avatar", fallbackUrl);
      } else {
        setAvatar("/avatars/avatar1.png");
      }
    };

    loadAvatar();

    // Automatinis atnaujinimas jei pasikeičia iš kitų vietų
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
    />
  );
}

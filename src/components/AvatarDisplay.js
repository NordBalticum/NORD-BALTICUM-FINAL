"use client";

import React, { useEffect, useState } from "react";
import styles from "./avatar.module.css";

export default function AvatarDisplay({ walletAddress, size = 64 }) {
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("user_avatar");
    if (saved) {
      setAvatar(saved);
    } else if (walletAddress) {
      const fallbackIndex = parseInt(walletAddress.slice(-2), 16) % 20;
      const fallbackAvatar = `https://robohash.org/${walletAddress}?set=set5&size=200x200`;
      setAvatar(fallbackAvatar);
      localStorage.setItem("user_avatar", fallbackAvatar);
    }
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

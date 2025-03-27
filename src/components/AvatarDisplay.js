"use client";

import React, { useEffect, useState } from "react";
import styles from "./avatar.module.css";

export default function AvatarDisplay({ walletAddress, size = 64 }) {
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user_avatar");

    if (saved) {
      setAvatar(saved);
    } else if (walletAddress) {
      const index = parseInt(walletAddress.slice(-2), 16) % 20;
      const generated = `https://api.multiavatar.com/3d/avatar-${index + 1}.svg`;
      setAvatar(generated);
    }
  }, [walletAddress]);

  if (!avatar) return null;

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

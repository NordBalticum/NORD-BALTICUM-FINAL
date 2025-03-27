"use client";

import React, { useEffect, useState } from "react";
import styles from "@/components/avatar.module.css";

const avatarProviders = [
  (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
  (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`,
  (seed) => `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}`,
  (seed) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
  (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${seed}`,
];

export default function AvatarDisplay({ walletAddress, size = 64 }) {
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user_avatar_url");
    if (saved) {
      setAvatar(saved);
    } else {
      const seed = walletAddress || "defaultuser";
      const index = parseInt(seed.slice(-2), 16) % avatarProviders.length;
      const url = avatarProviders[index](seed);
      setAvatar(url);
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

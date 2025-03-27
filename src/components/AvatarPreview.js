// components/AvatarPreview.js
"use client";

import React, { useEffect, useState } from "react";
import styles from "./avatar.module.css";

export default function AvatarPreview({ size = 52 }) {
  const [avatar, setAvatar] = useState("/avatars/avatar1.png");

  useEffect(() => {
    const saved = localStorage.getItem("user_avatar_url");
    if (saved) setAvatar(saved);
  }, []);

  return (
    <img
      src={avatar}
      alt="User Avatar"
      width={size}
      height={size}
      className={styles.avatarPreview}
    />
  );
}

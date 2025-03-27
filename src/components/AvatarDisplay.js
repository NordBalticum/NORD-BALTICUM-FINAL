"use client";

import React, { useEffect, useState } from "react";
import styles from "./avatarpicker.module.css";

export default function AvatarDisplay({ size = 64 }) {
  const [avatar, setAvatar] = useState("/avatars/avatar1.png");

  useEffect(() => {
    const saved = localStorage.getItem("user_avatar");
    if (saved) setAvatar(saved);
  }, []);

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

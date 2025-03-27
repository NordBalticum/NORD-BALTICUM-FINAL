"use client";

import React, { useEffect, useState } from "react";
import styles from "@/components/avatarpicker.module.css";

const avatars = Array.from({ length: 20 }, (_, i) => `/avatars/avatar${i + 1}.png`);

export default function AvatarPicker() {
  const [selected, setSelected] = useState("/avatars/avatar1.png");

  useEffect(() => {
    const stored = localStorage.getItem("profile_avatar");
    if (stored) setSelected(stored);
  }, []);

  const handleSelect = (url) => {
    localStorage.setItem("profile_avatar", url);
    setSelected(url);
  };

  return (
    <div className={styles.avatarPicker}>
      <div className={styles.current}>
        <img src={selected} alt="Selected Avatar" />
        <p>Click any avatar to update</p>
      </div>
      <div className={styles.grid}>
        {avatars.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Avatar ${index + 1}`}
            className={`${styles.avatar} ${selected === url ? styles.selected : ""}`}
            onClick={() => handleSelect(url)}
          />
        ))}
      </div>
    </div>
  );
}

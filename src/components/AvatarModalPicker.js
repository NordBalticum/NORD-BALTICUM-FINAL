"use client";

import React, { useState, useEffect } from "react";
import styles from "@/components/avatar.module.css";

const avatarProviders = [
  (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
  (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`,
  (seed) => `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}`,
  (seed) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
  (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${seed}`,
];

export default function AvatarModalPicker({ onClose, onSelect, walletAddress = "user" }) {
  const [selected, setSelected] = useState(null);

  const avatars = avatarProviders.map((gen, i) => gen(`${walletAddress}_${i}`));

  useEffect(() => {
    const saved = localStorage.getItem("user_avatar_url");
    if (saved) setSelected(saved);
  }, []);

  const handlePick = (url) => {
    localStorage.setItem("user_avatar_url", url);
    setSelected(url);
    if (onSelect) onSelect(url);
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Choose Your Avatar</h3>
        <img src={selected || avatars[0]} className={styles.mainAvatar} alt="Avatar" />
        <div className={styles.grid}>
          {avatars.map((url) => (
            <img
              key={url}
              src={url}
              className={`${styles.avatar} ${selected === url ? styles.active : ""}`}
              onClick={() => handlePick(url)}
              alt="avatar"
            />
          ))}
        </div>
        <button className={styles.button} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

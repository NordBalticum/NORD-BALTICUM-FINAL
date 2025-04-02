"use client";

import React, { useEffect, useState } from "react";
import styles from "./avatar.module.css";

// Rimta, suaugusiems skirta avatarų kolekcija
const externalAvatars = Array.from({ length: 20 }, (_, i) =>
  `https://api.dicebear.com/7.x/pixel-art-neutral/svg?seed=wallet${i + 1}`
);

export default function AvatarModalPicker({ onClose, onSelect }) {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("user_avatar");
    if (saved) setSelected(saved);
    else setSelected(externalAvatars[0]);
  }, []);

  const handlePick = (avatarUrl) => {
    setSelected(avatarUrl);
    localStorage.setItem("user_avatar", avatarUrl);
    if (onSelect) onSelect(avatarUrl);
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Choose Your Avatar</h3>

        <div className={styles.mainPreview}>
          <img
            src={selected}
            alt="Selected Avatar"
            className={styles.mainAvatar}
            draggable={false}
          />
        </div>

        <div className={styles.grid}>
          {externalAvatars.map((avatar) => (
            <img
              key={avatar}
              src={avatar}
              alt="Avatar Option"
              className={`${styles.avatarSmall} ${selected === avatar ? styles.active : ""}`}
              onClick={() => handlePick(avatar)}
              loading="lazy"
              draggable={false}
            />
          ))}
        </div>

        <button className={styles.button} onClick={onClose}>
          Save Avatar
        </button>
      </div>
    </div>
  );
}

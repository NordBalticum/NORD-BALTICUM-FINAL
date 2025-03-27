"use client";

import React, { useEffect, useState } from "react";
import styles from "./avatar.module.css";

const avatarList = Array.from({ length: 20 }, (_, i) =>
  `https://api.multiavatar.com/3d/avatar-${i + 1}.svg`
);

export default function AvatarModalPicker({ onClose, onSelect }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user_avatar");
    if (saved) setSelected(saved);
  }, []);

  const handlePick = (avatar) => {
    setSelected(avatar);
    localStorage.setItem("user_avatar", avatar);
    if (onSelect) onSelect(avatar);
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Choose your Avatar</h3>
        <img src={selected || avatarList[0]} className={styles.mainAvatar} alt="Selected Avatar" />
        <div className={styles.grid}>
          {avatarList.map((avatar) => (
            <img
              key={avatar}
              src={avatar}
              alt="avatar"
              className={`${styles.avatar} ${selected === avatar ? styles.active : ""}`}
              onClick={() => handlePick(avatar)}
            />
          ))}
        </div>
        <button className={styles.button} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

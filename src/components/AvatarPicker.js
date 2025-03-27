import React, { useState } from "react";
import styles from "./avatarpicker.module.css";

const avatarList = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
  "/avatars/avatar7.png",
  "/avatars/avatar8.png",
  "/avatars/avatar9.png",
  "/avatars/avatar10.png",
  "/avatars/avatar11.png",
  "/avatars/avatar12.png",
  "/avatars/avatar13.png",
  "/avatars/avatar14.png",
  "/avatars/avatar15.png",
  "/avatars/avatar16.png",
  "/avatars/avatar17.png",
  "/avatars/avatar18.png",
  "/avatars/avatar19.png",
  "/avatars/avatar20.png",
];

export default function AvatarPicker({ onSelect }) {
  const [selected, setSelected] = useState(avatarList[0]);

  const handlePick = (avatar) => {
    setSelected(avatar);
    onSelect(avatar);
  };

  return (
    <div className={styles.wrapper}>
      <img src={selected} className={styles.mainAvatar} alt="Selected Avatar" />
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
    </div>
  );
}

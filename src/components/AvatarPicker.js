import React, { useState } from "react";
import styles from "./avatarpicker.module.css";

const avatarList = [
  "https://i.pravatar.cc/150?img=1",
  "https://i.pravatar.cc/150?img=2",
  "https://i.pravatar.cc/150?img=3",
  "https://i.pravatar.cc/150?img=4",
  "https://i.pravatar.cc/150?img=5",
  "https://i.pravatar.cc/150?img=6",
  "https://i.pravatar.cc/150?img=7",
  "https://i.pravatar.cc/150?img=8",
  "https://i.pravatar.cc/150?img=9",
  "https://i.pravatar.cc/150?img=10",
  "https://i.pravatar.cc/150?img=11",
  "https://i.pravatar.cc/150?img=12",
  "https://i.pravatar.cc/150?img=13",
  "https://i.pravatar.cc/150?img=14",
  "https://i.pravatar.cc/150?img=15",
  "https://i.pravatar.cc/150?img=16",
  "https://i.pravatar.cc/150?img=17",
  "https://i.pravatar.cc/150?img=18",
  "https://i.pravatar.cc/150?img=19",
  "https://i.pravatar.cc/150?img=20",
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

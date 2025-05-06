// pages/networksettings.js
"use client";

import React, { useState, useEffect } from "react";
import clsx from "clsx";
import styles from "@/styles/networksettings.module.css";
import { Check, Plus } from "lucide-react";

import { DEFAULT_NETWORKS, RPCS } from "@/contexts/BalanceContext";

const ALL_NETWORKS = Object.keys(RPCS);

const NetworkSettings = () => {
  const [enabled, setEnabled] = useState(DEFAULT_NETWORKS);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("enabledNetworks"));
    if (Array.isArray(stored)) {
      setEnabled([...new Set([...DEFAULT_NETWORKS, ...stored])]);
    }
  }, []);

  const toggleNetwork = (key) => {
    let updated;
    if (enabled.includes(key)) {
      updated = enabled.filter(k => !DEFAULT_NETWORKS.includes(k) && k !== key);
    } else {
      updated = [...new Set([...enabled, key])];
    }
    localStorage.setItem("enabledNetworks", JSON.stringify(updated));
    setEnabled([...new Set([...DEFAULT_NETWORKS, ...updated])]);
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.header}>Manage Networks</h1>
      <div className={styles.grid}>
        {ALL_NETWORKS.map(key => (
          <div
            key={key}
            className={clsx(styles.card, enabled.includes(key) && styles.enabled)}
            onClick={() => toggleNetwork(key)}
          >
            <div className={styles.label}>{key}</div>
            <div className={styles.icon}>
              {enabled.includes(key) ? <Check size={16} /> : <Plus size={16} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkSettings;

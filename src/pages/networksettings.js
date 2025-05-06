// pages/networksettings.js
"use client";

import React, { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import styles from "@/styles/networksettings.module.css";
import { Check, Plus } from "lucide-react";
import fallbackRPCs from "@/utils/fallbackRPCs";

const DEFAULT_NETWORKS = [
  "eth", "matic", "bnb", "avax",
  "sepolia", "mumbai", "tbnb", "fuji"
];

const ALL_NETWORKS = Object.keys(fallbackRPCs);

const NetworkSettings = () => {
  const [enabled, setEnabled] = useState(DEFAULT_NETWORKS);
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(() => {
    return ALL_NETWORKS.filter(key =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      fallbackRPCs[key]?.label?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.header}>Manage Networks</h1>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search networks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className={styles.grid}>
        {filtered.map(key => (
          <div
            key={key}
            className={clsx(styles.card, enabled.includes(key) && styles.enabled)}
            onClick={() => toggleNetwork(key)}
          >
            <div className={styles.label}>{fallbackRPCs[key]?.label || key}</div>
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

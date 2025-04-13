"use client";

import { useState, useEffect, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";

const NETWORKS = {
  eth: { label: "Ethereum", icon: "/icons/eth.svg" },
  bnb: { label: "BNB", icon: "/icons/bnb.svg" },
  tbnb: { label: "BNB Testnet", icon: "/icons/bnb.svg" },
  matic: { label: "Polygon", icon: "/icons/matic.svg" },
  avax: { label: "Avalanche", icon: "/icons/avax.svg" },
};

export default function NetworkSelector({ defaultNetwork = "bnb", onChange }) {
  const [selected, setSelected] = useState(defaultNetwork);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (network) => {
    setSelected(network);
    setOpen(false);
    if (onChange) onChange(network);
  };

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Selected button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 hover:bg-white/20 transition"
      >
        <img src={NETWORKS[selected].icon} alt="" className="w-6 h-6 rounded-full" />
        <span className="text-white font-medium">{NETWORKS[selected].label}</span>
        <FaChevronDown className={`text-white transform transition ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-10 mt-2 w-full bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
          {Object.entries(NETWORKS).map(([net, { label, icon }]) => (
            <button
              key={net}
              onClick={() => handleSelect(net)}
              className="flex items-center gap-2 w-full px-4 py-2 text-white hover:bg-white/20 transition text-left"
            >
              <img src={icon} alt="" className="w-5 h-5 rounded-full" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// src/components/NetworkSelector.js
"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { useNetwork } from "@/contexts/NetworkContext";
import networks from "@/data/networks";
import styles from "@/styles/send.module.css"; // pritaikytas style failas (gali keisti pagal save)

export default function NetworkSelector() {
  const { activeNetwork, switchNetwork } = useNetwork();

  const mainnets = networks.map(n => n);
  const testnets = networks.filter(n => n.testnet).map(n => n.testnet);

  const allOptions = [
    { label: "Mainnets", items: mainnets },
    { label: "Testnets", items: testnets },
  ];

  return (
    <Select.Root value={activeNetwork} onValueChange={switchNetwork}>
      <Select.Trigger className={styles.selectTrigger}>
        <div className={styles.selectValueWrapper}>
          <img
            src={networks.find(n => n.value === activeNetwork || n.testnet?.value === activeNetwork)?.icon}
            alt="icon"
            className={styles.selectIcon}
          />
          <Select.Value placeholder="Select network" />
        </div>
        <Select.Icon>
          <ChevronDown size={18} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="z-50 bg-black border border-neutral-700 rounded-xl shadow-2xl" position="popper" sideOffset={5}>
          <Select.Viewport>
            {allOptions.map((group, idx) => (
              <div key={idx}>
                <div className="px-4 py-2 text-xs text-gray-400">{group.label}</div>
                {group.items.map(net => (
                  <Select.Item key={net.value} value={net.value} className={styles.selectItem}>
                    <img src={net.icon} alt={net.label} className={styles.selectIcon} />
                    <Select.ItemText>{net.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </div>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

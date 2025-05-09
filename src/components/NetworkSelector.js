"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { useNetwork } from "@/contexts/NetworkContext";
import networks from "@/data/networks"; // Import updated networks.js
import styles from "@/styles/networkSelector.module.css"; // Custom styles for the selector

export default function NetworkSelector() {
  const { activeNetwork, switchNetwork } = useNetwork();

  const mainnets = networks.filter(n => !n.testnet);  // Filter only mainnets
  const userNetworks = mainnets.filter(net => net.active); // User added networks (active ones)

  return (
    <Select.Root value={activeNetwork} onValueChange={switchNetwork}>
      <Select.Trigger className={styles.selectTrigger}>
        <div className={styles.selectValueWrapper}>
          <img
            src={networks.find(n => n.value === activeNetwork)?.icon}
            alt="network icon"
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
            <div className="px-4 py-2 text-xs text-gray-400">User Networks</div>
            {userNetworks.map(net => (
              <Select.Item key={net.value} value={net.value} className={styles.selectItem}>
                <img src={net.icon} alt={net.label} className={styles.selectIcon} />
                <Select.ItemText>{net.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

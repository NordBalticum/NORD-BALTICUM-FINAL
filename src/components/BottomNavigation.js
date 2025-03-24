// src/components/BottomNavigation.js

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaWallet, FaClock, FaArrowDown, FaArrowUp, FaCog } from 'react-icons/fa';
import styles from './bottomnavigation.module.css';

const BottomNavigation = () => {
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', icon: <FaWallet />, label: 'Wallet' },
    { href: '/transactions', icon: <FaClock />, label: 'History' },
    { href: '/receive', icon: <FaArrowDown />, label: 'Receive' },
    { href: '/send', icon: <FaArrowUp />, label: 'Send' },
    { href: '/settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map(({ href, icon, label }) => {
        const isActive = router.pathname === href;
        return (
          <Link href={href} key={href} passHref>
            <button className={`${styles.navButton} ${isActive ? styles.active : ''}`}>
              <span className={styles.icon}>{icon}</span>
              {label}
            </button>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;

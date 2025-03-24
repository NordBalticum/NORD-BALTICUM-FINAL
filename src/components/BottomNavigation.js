import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaWallet, FaClock, FaArrowDown, FaArrowUp, FaCog } from 'react-icons/fa';
import styles from './bottomnavigation.module.css';

const BottomNavigation = () => {
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', icon: <FaWallet />, label: 'Wallet' },
    { href: '/send', icon: <FaArrowUp />, label: 'Send' },
    { href: '/receive', icon: <FaArrowDown />, label: 'Receive' },
    { href: '/history', icon: <FaClock />, label: 'History' },
    { href: '/settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <nav className={styles.bottomNav} role="navigation" aria-label="Bottom navigation">
      {navItems.map(({ href, icon, label }) => {
        const isActive = router.pathname === href;
        return (
          <Link href={href} key={href} passHref legacyBehavior>
            <button
              type="button"
              className={`${styles.navButton} ${isActive ? styles.active : ''}`}
              aria-label={label}
            >
              <span className={styles.icon}>{icon}</span>
              <span>{label}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;

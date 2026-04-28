'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <nav style={{ 
      borderBottom: '1px solid var(--border-color)', 
      padding: '0 24px', 
      height: 64, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="/icon.png" alt="ET Logo" width={32} height={32} style={{ borderRadius: 6 }} />
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>ET Expense</span>
        </Link>
        <div style={{ display: 'flex', gap: 24 }}>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              style={{ 
                fontSize: 14, 
                fontWeight: 500, 
                color: pathname === item.href ? 'var(--accent-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }} />
      </div>
    </nav>
  );
}

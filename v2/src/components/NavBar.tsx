'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useHousehold } from '@/hooks/useHousehold';

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { household } = useHousehold();
  
  const selectedUser = searchParams.get('u');
  const names = household?.names || {};

  const handleUserChange = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('u', id);
    router.push(`${pathname}?${params.toString()}`);
  };

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
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {Object.keys(names).length > 0 && (
          <select 
            value={selectedUser || ''} 
            onChange={(e) => handleUserChange(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {Object.entries(names).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }} />
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useHousehold } from '@/hooks/useHousehold';
import { Suspense, useState, useEffect } from 'react';

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('et_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('et_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <button 
      onClick={toggleTheme}
      className="btn btn-secondary"
      style={{ padding: '8px', width: 36, height: 36, borderRadius: '50%' }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

function UserSwitcher() {
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

  if (Object.keys(names).length === 0) return null;

  return (
    <select 
      value={selectedUser || ''} 
      onChange={(e) => handleUserChange(e.target.value)}
      style={{
        padding: '6px 12px',
        borderRadius: 12,
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
  );
}

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav style={{ 
      borderBottom: '1px solid var(--border-color)', 
      padding: '0 24px', 
      height: 64, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ position: 'relative', width: 32, height: 32, background: 'var(--bg-card)', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
            <img 
              src="/icon.png" 
              alt="ET" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as any).style.display = 'none';
                if ((e.target as any).parentElement) {
                  (e.target as any).parentElement.innerHTML = '<div style="background:var(--text-primary);color:var(--bg-primary);width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px">ET</div>';
                }
              }}
            />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', display: 'block' }}>ET Expense</span>
        </Link>
        <div style={{ display: 'flex', gap: 24 }} className="hide-mobile">
          {[{ name: 'Dashboard', href: '/' }, { name: 'Settings', href: '/settings' }].map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              style={{ 
                fontSize: 14, 
                fontWeight: 500, 
                color: pathname === item.href ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none'
              }}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ThemeToggle />
        <Suspense fallback={<div style={{ width: 80, height: 32, background: 'var(--bg-secondary)', borderRadius: 12 }} />}>
          <UserSwitcher />
        </Suspense>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }} />
      </div>
    </nav>
  );
}

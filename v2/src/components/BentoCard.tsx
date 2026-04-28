'use client';

import { useEffect, useState } from 'react';

export function BentoCard({ 
  children, 
  title, 
  className = '', 
  colSpan = 12,
  rowSpan = 1 
}: { 
  children: React.ReactNode; 
  title?: string;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div 
      className={`bento-card ${className}`}
      style={{ 
        gridColumn: isMobile ? 'span 1' : `span ${colSpan} / span ${colSpan}`,
        gridRow: isMobile ? 'auto' : `span ${rowSpan} / span ${rowSpan}`
      }}
    >
      {title && <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</h3>}
      {children}
    </div>
  );
}

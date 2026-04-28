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
  return (
    <div 
      className={`bento-card ${className}`}
      style={{ 
        gridColumn: `span ${colSpan} / span ${colSpan}`,
        gridRow: `span ${rowSpan} / span ${rowSpan}`
      }}
    >
      {title && <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</h3>}
      {children}
    </div>
  );
}

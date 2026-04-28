'use client';

export function UserAvatarToggle({
  users,
  selectedId,
  onSelect
}: {
  users: Record<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {Object.entries(users).map(([id, name]) => (
        <button
          key={id}
          className={`btn ${selectedId === id ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onSelect(id)}
          style={{ borderRadius: '9999px', padding: '6px 12px' }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

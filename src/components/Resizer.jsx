import React from 'react';

export default function Resizer({ onMouseDown }) {
  return (
    <div 
      onMouseDown={onMouseDown}
      style={{
        width: '6px',
        backgroundColor: '#121214',
        cursor: 'col-resize',
        zIndex: 10,
        transition: 'background-color 0.2s',
        flexShrink: 0
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-teal)'}
      onMouseLeave={(e) => e.target.style.backgroundColor = '#121214'}
    />
  );
}

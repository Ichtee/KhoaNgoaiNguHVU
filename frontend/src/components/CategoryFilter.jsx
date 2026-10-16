import React from 'react';
import { LayoutGrid, Code2, Server, Database, Cpu, Layers } from 'lucide-react';

const iconMap = {
  Code2: Code2,
  Server: Server,
  Database: Database,
  Cpu: Cpu,
  Layers: Layers
};

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div style={{ margin: '1.5rem 0 2.5rem 0', display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
      
      {/* All Option */}
      <button
        onClick={() => onSelectCategory('all')}
        style={{
          padding: '0.6rem 1.25rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease',
          background: selectedCategory === 'all' ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
          color: selectedCategory === 'all' ? '#ffffff' : 'var(--text-muted)',
          border: selectedCategory === 'all' ? 'none' : '1px solid var(--border-subtle)',
          boxShadow: selectedCategory === 'all' ? '0 4px 12px var(--accent-glow)' : 'none'
        }}
      >
        <LayoutGrid size={16} /> Tất Cả Bài Viết
      </button>

      {/* Category Pills */}
      {categories.map((cat) => {
        const IconComponent = iconMap[cat.icon] || Code2;
        const isSelected = selectedCategory === cat.slug || selectedCategory === cat._id;
        
        return (
          <button
            key={cat._id || cat.slug}
            onClick={() => onSelectCategory(cat.slug || cat._id)}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              background: isSelected ? cat.color : 'var(--bg-secondary)',
              color: isSelected ? '#ffffff' : 'var(--text-muted)',
              border: isSelected ? 'none' : '1px solid var(--border-subtle)',
              boxShadow: isSelected ? `0 4px 12px ${cat.color}44` : 'none'
            }}
          >
            <IconComponent size={16} /> {cat.name}
          </button>
        );
      })}

    </div>
  );
}

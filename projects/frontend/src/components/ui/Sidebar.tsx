import React from 'react'

interface SidebarItem {
  id: string
  label: string
  category: string
}

interface SidebarProps {
  items: SidebarItem[]
  selectedId: string
  onSelect: (id: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ items, selectedId, onSelect }) => {
  return (
    <nav aria-label="Feature navigation" className="space-y-2">
      {items.map((item) => {
        const isActive = item.id === selectedId
        return (
          <button
            key={item.id}
            className={`w-full rounded-xl border px-3 py-3 text-left transition ${
              isActive
                ? 'border-cyan-300/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100 shadow-lg shadow-cyan-900/30'
                : 'border-white/10 bg-slate-900/70 text-slate-200 hover:border-cyan-300/30 hover:bg-slate-800/80 hover:text-white'
            }`}
            onClick={() => onSelect(item.id)}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="text-xs text-slate-300/80">{item.category}</p>
          </button>
        )
      })}
    </nav>
  )
}

export default Sidebar

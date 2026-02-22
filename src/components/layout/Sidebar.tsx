import { NavLink } from 'react-router-dom'

const links = [
  { to: '/orders', label: 'Órdenes', icon: '🧾' },
  { to: '/merchants', label: 'Merchants', icon: '🏪' },
  { to: '/stores', label: 'Stores', icon: '💳' },
]

export function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-tight text-white">CASHEA</h1>
        <p className="text-xs text-gray-400 mt-0.5">Data Explorer</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Store, CreditCard } from 'lucide-react'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/orders', label: 'Órdenes', icon: <ShoppingBag className="w-5 h-5" /> },
  { to: '/merchants', label: 'Merchants', icon: <Store className="w-5 h-5" /> },
  { to: '/stores', label: 'Stores', icon: <CreditCard className="w-5 h-5" /> },
]

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex-col sticky top-0">
        <div className="px-6 py-8 border-b border-gray-800">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <span className="text-white">C</span>
            </div>
            CASHEA
          </h1>
          <p className="text-xs text-indigo-400 mt-1 font-medium tracking-wider uppercase ml-10">
            Explorer
          </p>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center justify-center">{icon}</div>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 rounded-t-2xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe">
        <div className="flex items-center justify-around p-2 px-4 h-16">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full gap-1 rounded-lg transition-colors ${isActive
                  ? 'text-indigo-600'
                  : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <div className="flex items-center justify-center">{icon}</div>
              <span className="text-[10px] font-bold">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}

import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-24 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}

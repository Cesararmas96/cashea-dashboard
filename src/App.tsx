import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { OrdersPage } from './pages/OrdersPage'
import { MerchantsPage } from './pages/MerchantsPage'
import { StoresPage } from './pages/StoresPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/orders" replace /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'merchants', element: <MerchantsPage /> },
      { path: 'stores', element: <StoresPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}

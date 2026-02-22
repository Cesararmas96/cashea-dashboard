import { useState, useEffect, useMemo } from 'react'
import { loadClient, loadOrdersIndex } from '../services/dataLoader'
import type { ClientOrder } from '../types/client'
import type { OrderIndexItem } from '../services/dataLoader'
import { Search, ChevronLeft, Calendar, FileText, User, ShoppingBag } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  CLOSED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
}

const INSTALLMENT_COLORS: Record<string, string> = {
  DONE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DELAYED: 'bg-rose-100 text-rose-800 border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function OrdersPage() {
  const [ordersList, setOrdersList] = useState<OrderIndexItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState<number | false>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrdersIndex()
      .then(setOrdersList)
      .catch(() => setError('No se pudo cargar la lista de órdenes.'))
      .finally(() => setLoadingList(false))
  }, [])

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>()
    ordersList.forEach(o => statuses.add(o.status))
    return ['ALL', ...Array.from(statuses).sort()]
  }, [ordersList])

  const filteredOrders = useMemo(() => {
    return ordersList.filter(o => {
      const matchesSearch =
        o.id.toString().includes(searchTerm) ||
        o.identifierNumber.toString().includes(searchTerm) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter = filterStatus === 'ALL' || o.status === filterStatus;

      return matchesSearch && matchesFilter;
    }).slice(0, 100) // Paginamos a 100 para no hacer lenta la UI en búsquedas vacías
  }, [ordersList, searchTerm, filterStatus])

  async function handleSelectOrder(identifierNumber: number) {
    setLoadingDetail(identifierNumber)
    setError(null)
    try {
      const data = await loadClient(identifierNumber)
      setSelectedOrder(data)
    } catch {
      setError(`No se encontró la orden local para el id ${identifierNumber}`)
    } finally {
      setLoadingDetail(false)
    }
  }

  // --- DETAIL VIEW ---
  if (selectedOrder) {
    const order = selectedOrder
    return (
      <div className="max-w-4xl mx-auto animation-fade-in pb-12">
        <button
          onClick={() => setSelectedOrder(null)}
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver a las órdenes
        </button>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative">
          <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

          <div className="px-4 md:px-8 py-6 -mt-12 relative flex flex-col md:flex-row md:justify-between items-start md:items-end flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-4 rounded-full shadow-md border-4 border-white flex-shrink-0">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
              <div className="pt-2">
                <p className="text-blue-200 text-sm font-medium mb-1 uppercase tracking-widest drop-shadow-md">Orden / Invoice</p>
                <h1 className="text-3xl font-extrabold text-gray-900 line-clamp-1">{order.invoiceId ?? `#${order.id}`}</h1>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl border border-transparent font-bold tracking-wider text-sm self-start md:self-auto ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
              ESTADO: {order.status}
            </div>
          </div>

          <div className="px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 border-y border-gray-100">
            <InfoCard icon={<FileText className="w-4 h-4" />} label="Identificador" value={String(order.identifierNumber)} />
            <InfoCard icon={<Calendar className="w-4 h-4" />} label="Fecha de Creación" value={new Date(order.createdAt).toLocaleString('es-VE')} />
            <InfoCard label="Monto Total" value={`$${order.amount.toFixed(2)}`} />
            <InfoCard label="Canal" value={order.channel} />
            <InfoCard label="Tienda" value={`${order.store.name} (ID: ${order.store.id})`} />
          </div>

          <div className="px-4 md:px-8 py-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" /> Detalles del Cliente
            </h3>
            {order.paymentDetails?.user ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl flex-shrink-0">
                  {order.paymentDetails.user.fullName.charAt(0)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
                  <InfoCard label="Nombre" value={order.paymentDetails.user.fullName} />
                  <InfoCard label="Número de Cédula" value={order.paymentDetails.user.identificationNumber} />
                  <InfoCard label="Teléfono" value={order.paymentDetails.user.phoneNumber} />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-6 text-center">
                <p className="text-gray-500 font-medium">Sin datos de cliente asociados</p>
                <p className="text-xs text-gray-400 mt-1">Es posible que la orden fuera cancelada prematuramente</p>
              </div>
            )}
          </div>

          {order.paymentDetails?.installments && order.paymentDetails.installments.length > 0 && (
            <div className="px-4 md:px-8 py-6 bg-slate-50 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Plan de Cuotas</h3>
              <div className="space-y-3">
                {[...order.paymentDetails.installments]
                  .sort((a, b) => a.installmentNumber - b.installmentNumber)
                  .map((inst) => (
                    <div key={inst.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
                          {inst.installmentNumber === 0 ? '0' : inst.installmentNumber}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {inst.installmentNumber === 0 ? 'Enganche (Inicial)' : `Cuota mensual`}
                          </p>
                          <p className="text-xs text-gray-500 font-medium font-mono mt-0.5">
                            Fecha de cobro: {new Date(inst.scheduledPaymentDate).toLocaleDateString('es-VE')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <span className="text-lg font-extrabold text-gray-900">${inst.amount.toFixed(2)}</span>
                        <span className={`text-[10px] sm:text-xs uppercase font-extrabold tracking-widest px-3 py-1.5 rounded-lg border ${INSTALLMENT_COLORS[inst.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {inst.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- LIST VIEW ---
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-2">
            Órdenes y Transacciones
          </h2>
          <p className="text-gray-500 font-medium">Explora tus registros de venta y sus respectivos planes de pago.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col lg:flex-row gap-4 lg:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar orden, cliente o identificador..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all font-medium"
          />
        </div>

        <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar flex gap-2 pt-2 lg:pt-0">
          {availableStatuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${filterStatus === status
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
            >
              {status === 'ALL' ? 'Todos los estados' : status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center font-medium">
          {error}
        </div>
      )}

      {loadingList ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Sincronizando órdenes...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold text-gray-500">
              Mostrando {filteredOrders.length} {filteredOrders.length === 100 ? '(límite)' : ''} resultados
            </p>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
              <span className="text-5xl mb-4 block">📭</span>
              <p className="text-lg text-gray-900 font-bold">No se encontraron órdenes</p>
              <p className="text-gray-500 text-sm mt-1">Revisa los términos de búsqueda o cambia los filtros de estado.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-widest text-gray-500 font-bold">
                      <th className="px-4 md:px-6 py-4 whitespace-nowrap">Orden</th>
                      <th className="px-4 md:px-6 py-4 whitespace-nowrap">Cliente</th>
                      <th className="px-4 md:px-6 py-4 whitespace-nowrap">Monto</th>
                      <th className="px-4 md:px-6 py-4 whitespace-nowrap">Estado</th>
                      <th className="px-4 md:px-6 py-4 whitespace-nowrap">Canal</th>
                      <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                        onClick={() => handleSelectOrder(order.identifierNumber)}
                      >
                        <td className="px-4 md:px-6 py-4 align-middle whitespace-nowrap">
                          <div className="font-bold text-gray-900">#{order.identifierNumber}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5 max-w-[120px] truncate" title={order.id}>{order.id}</div>
                        </td>
                        <td className="px-4 md:px-6 py-4 align-middle whitespace-nowrap">
                          <div className="font-semibold text-gray-800">{order.customerName || <span className="text-gray-400 italic">Desconocido</span>}</div>
                        </td>
                        <td className="px-4 md:px-6 py-4 align-middle whitespace-nowrap">
                          <div className="font-black text-gray-900">${order.amount.toFixed(2)}</div>
                        </td>
                        <td className="px-4 md:px-6 py-4 align-middle whitespace-nowrap">
                          <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded border ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 align-middle whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded-md">{order.channel}</div>
                        </td>
                        <td className="px-4 md:px-6 py-4 align-middle text-right whitespace-nowrap">
                          <button className="text-blue-600 font-semibold md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {loadingDetail === order.identifierNumber ? 'Cargando...' : 'Detalles →'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold text-blue-900/50 uppercase tracking-widest leading-tight mb-1 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
    </div>
  )
}

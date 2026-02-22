import { useState, useEffect, useMemo } from 'react'
import { loadMerchantsIndex, loadOrdersIndex, loadStoresIndex } from '../services/dataLoader'
import type { MerchantIndexItem, OrderIndexItem, StoreIndexItem } from '../services/dataLoader'
import { TrendingUp, ShoppingBag, Store, Activity, Filter, RefreshCcw } from 'lucide-react'
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
    'COMPLETED': '#10b981',
    'OPEN': '#3b82f6',
    'CANCELLED': '#ef4444',
    'CLOSED': '#6366f1',
    'IN_PROGRESS': '#f59e0b',
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export function DashboardPage() {
    const [merchants, setMerchants] = useState<MerchantIndexItem[]>([])
    const [orders, setOrders] = useState<OrderIndexItem[]>([])
    const [, setStores] = useState<StoreIndexItem[]>([])
    const [loading, setLoading] = useState(true)

    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')
    const [minAmount, setMinAmount] = useState<string>('')
    const [maxAmount, setMaxAmount] = useState<string>('')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        Promise.all([
            loadMerchantsIndex().catch(() => []),
            loadOrdersIndex().catch(() => []),
            loadStoresIndex().catch(() => [])
        ]).then(([m, o, s]) => {
            setMerchants(m)
            setOrders(o)
            setStores(s)
            setLoading(false)
        })
    }, [])

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            let matchesDate = true;
            if (dateFrom || dateTo) {
                const orderDate = o.createdAt ? new Date(o.createdAt).getTime() : 0;
                const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
                const toTime = dateTo ? new Date(dateTo).getTime() + 86399999 : Infinity;

                if (orderDate) {
                    matchesDate = orderDate >= fromTime && orderDate <= toTime;
                }
            }

            let matchesAmount = true;
            if (minAmount || maxAmount) {
                const min = parseFloat(minAmount) || 0;
                const max = parseFloat(maxAmount) || Infinity;
                matchesAmount = o.amount >= min && o.amount <= max;
            }

            return matchesDate && matchesAmount;
        })
    }, [orders, dateFrom, dateTo, minAmount, maxAmount])

    const kpis = useMemo(() => {
        const totalOrders = filteredOrders.length
        const totalVolume = filteredOrders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.amount : 0), 0)
        const activeMerchants = merchants.filter(m => m.enabled).length
        const avgTicket = totalOrders > 0 ? totalVolume / filteredOrders.filter(o => o.status !== 'CANCELLED').length : 0
        const cancelledOrders = filteredOrders.filter(o => o.status === 'CANCELLED').length

        return { totalOrders, totalVolume, activeMerchants, avgTicket, cancelledOrders }
    }, [filteredOrders, merchants])

    const statusData = useMemo(() => {
        const counts = filteredOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)

        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    }, [filteredOrders])

    const channelData = useMemo(() => {
        const channels = filteredOrders.reduce((acc, order) => {
            if (order.status === 'CANCELLED') return acc;
            acc[order.channel] = (acc[order.channel] || 0) + order.amount;
            return acc;
        }, {} as Record<string, number>)

        return Object.entries(channels).map(([name, Total]) => ({ name, Total })).sort((a, b) => b.Total - a.Total).slice(0, 5) // top 5
    }, [filteredOrders])

    const revenueTrendData = useMemo(() => {
        const trend = filteredOrders.reduce((acc, order) => {
            if (order.status === 'CANCELLED' || !order.createdAt) return acc;

            // Format YYYY-MM
            const date = new Date(order.createdAt);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            acc[monthStr] = (acc[monthStr] || 0) + order.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(trend)
            .map(([month, volume]) => ({ month, volume }))
            .sort((a, b) => a.month.localeCompare(b.month)); // sort chronologically
    }, [filteredOrders]);

    const stateData = useMemo(() => {
        const states = merchants.reduce((acc, merchant) => {
            if (!merchant.state || merchant.state === 'Desconocido') return acc;
            acc[merchant.state] = (acc[merchant.state] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(states)
            .map(([state, count]) => ({ state, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // top 10 states
    }, [merchants]);
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Analizando datos del sistema...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pb-12 animation-fade-in">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-600 mb-2">
                        Dashboard de Inteligencia
                    </h2>
                    <p className="text-gray-500">Métricas principales y estado actual del negocio.</p>
                </div>

                <div className="flex gap-2">
                    {(dateFrom || dateTo || minAmount || maxAmount) && (
                        <button
                            onClick={() => { setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount(''); }}
                            className="p-3 text-sm font-semibold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" /> Limpiar
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-xl border flex items-center gap-2 text-sm font-bold transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Filter className="w-5 h-5" /> Filtros
                    </button>
                </div>
            </div>

            {/* Panel de Filtros */}
            {showFilters && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 animation-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50 pointer-events-none"></div>
                    <div className="relative z-10">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Desde Fecha</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-shadow" />
                    </div>
                    <div className="relative z-10">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Hasta Fecha</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-shadow" />
                    </div>
                    <div className="relative z-10">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Monto Mínimo ($)</label>
                        <input type="number" step="0.01" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="Ej: 10" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-shadow" />
                    </div>
                    <div className="relative z-10">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Monto Máximo ($)</label>
                        <input type="number" step="0.01" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="Ej: 500.50" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-shadow" />
                    </div>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <KpiCard
                    title="Volumen Operativo (Neto)"
                    value={`$${kpis.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtitle="Excluyendo canceladas"
                    icon={<TrendingUp className="w-6 h-6 text-white" />}
                    gradient="from-emerald-500 to-teal-400"
                />
                <KpiCard
                    title="Órdenes Procesadas"
                    value={kpis.totalOrders.toLocaleString()}
                    subtitle={`${kpis.cancelledOrders} canceladas (${((kpis.cancelledOrders / kpis.totalOrders) * 100).toFixed(1)}%)`}
                    icon={<ShoppingBag className="w-6 h-6 text-white" />}
                    gradient="from-blue-600 to-indigo-500"
                />
                <KpiCard
                    title="Ticket Promedio"
                    value={`$${kpis.avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtitle="Por orden completada/activa"
                    icon={<Activity className="w-6 h-6 text-white" />}
                    gradient="from-purple-600 to-pink-500"
                />
                <KpiCard
                    title="Merchants Activos"
                    value={kpis.activeMerchants.toLocaleString()}
                    subtitle={`De un total de ${merchants.length} registrados`}
                    icon={<Store className="w-6 h-6 text-white" />}
                    gradient="from-orange-500 to-yellow-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Gráfico Bar - Canales */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        Top 5 Canales de Venta (Volumen $)
                    </h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={channelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Volumen']}
                                />
                                <Bar dataKey="Total" fill="#6366f1" radius={[6, 6, 0, 0]}>
                                    {
                                        channelData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico Pie - Status */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                        Distribución de Estados
                    </h3>
                    <p className="text-xs text-gray-500 mb-6">Porcentaje de estatus actual en base a N. Órdenes</p>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value} órdenes`, 'Cantidad']}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Fila de Gráficos de Analítica Avanzada */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Gráfico Tendencia Ingresos */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        Evolución de Volumen Operativo (Neto)
                    </h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Volumen']}
                                />
                                <Area type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico Bar - Estados Top */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        Top 10 Regiones con más Aliados
                    </h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [value, 'Aliados (Merchants)']}
                                />
                                <Bar dataKey="count" fill="#ec4899" radius={[6, 6, 0, 0]}>
                                    {stateData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[(index + 3) % DEFAULT_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    )
}

function KpiCard({ title, value, subtitle, icon, gradient }: { title: string, value: string, subtitle: string, icon: React.ReactNode, gradient: string }) {
    return (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 z-0`}></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                    {icon}
                </div>
            </div>
            <div className="relative z-10">
                <h4 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h4>
                <p className="text-xs font-semibold text-gray-400 mt-1">{subtitle}</p>
            </div>
        </div>
    )
}

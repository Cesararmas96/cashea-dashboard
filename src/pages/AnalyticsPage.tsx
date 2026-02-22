import { useState, useEffect, useMemo } from 'react'
import { loadMerchantsIndex, loadOrdersIndex, loadStoresIndex } from '../services/dataLoader'
import type { MerchantIndexItem, OrderIndexItem, StoreIndexItem } from '../services/dataLoader'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie, Legend } from 'recharts'
import { BarChart3, TrendingUp, Users, Target, Activity, ShieldAlert, Award, Repeat, ExternalLink } from 'lucide-react'

const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#0ea5e9']

export function AnalyticsPage() {
    const [, setMerchants] = useState<MerchantIndexItem[]>([])
    const [orders, setOrders] = useState<OrderIndexItem[]>([])
    const [, setStores] = useState<StoreIndexItem[]>([])
    const [loading, setLoading] = useState(true)

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

    // 1. AOV Over Time
    const aovOverTime = useMemo(() => {
        const data: Record<string, { totalAmount: number, count: number }> = {}
        orders.forEach(o => {
            if (o.status === 'CANCELLED' || !o.createdAt) return
            const d = new Date(o.createdAt)
            const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (!data[month]) data[month] = { totalAmount: 0, count: 0 }
            data[month].totalAmount += o.amount
            data[month].count += 1
        })
        return Object.entries(data)
            .map(([month, { totalAmount, count }]) => ({
                month,
                aov: parseFloat((totalAmount / count).toFixed(2)),
                volume: parseFloat(totalAmount.toFixed(2))
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
    }, [orders])

    // 2. Orders Size Distribution
    const ticketSizeDistribution = useMemo(() => {
        const ranges = {
            '< $50': 0,
            '$50 - $100': 0,
            '$100 - $300': 0,
            '$300 - $500': 0,
            '> $500': 0
        }
        orders.forEach(o => {
            if (o.status === 'CANCELLED') return
            if (o.amount < 50) ranges['< $50'] += 1
            else if (o.amount < 100) ranges['$50 - $100'] += 1
            else if (o.amount < 300) ranges['$100 - $300'] += 1
            else if (o.amount < 500) ranges['$300 - $500'] += 1
            else ranges['> $500'] += 1
        })
        return Object.entries(ranges).map(([range, count]) => ({ range, count }))
    }, [orders])

    // 3. Top Channels by Activity
    const topChannels = useMemo(() => {
        const channelActivity: Record<string, number> = {}
        orders.forEach(o => {
            if (o.status === 'CANCELLED' || !o.channel) return
            channelActivity[o.channel] = (channelActivity[o.channel] || 0) + 1
        })

        return Object.entries(channelActivity)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
    }, [orders])

    // 4. Daily Patterns (Hour of day) mock or based on timestamps if time is reliable
    // Assume createdAt is UTC.
    const hourlyActivity = useMemo(() => {
        const hours = Array(24).fill(0)
        orders.forEach(o => {
            if (!o.createdAt) return
            const d = new Date(o.createdAt)
            hours[d.getHours()] += 1
        })
        return hours.map((count, hour) => ({ hour: `${String(hour).padStart(2, '0')}:00`, count }))
    }, [orders])

    // 5. Approved vs Cancelled Over Time
    const riskOverTime = useMemo(() => {
        const data: Record<string, { approved: number, cancelled: number }> = {}
        orders.forEach(o => {
            if (!o.createdAt) return
            const d = new Date(o.createdAt)
            const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (!data[month]) data[month] = { approved: 0, cancelled: 0 }
            if (o.status === 'CANCELLED') {
                data[month].cancelled += o.amount
            } else {
                data[month].approved += o.amount
            }
        })
        return Object.entries(data)
            .map(([month, vals]) => ({ month, ...vals }))
            .sort((a, b) => a.month.localeCompare(b.month))
    }, [orders])

    // 6. Top Clients
    const topClients = useMemo(() => {
        const clientData: Record<number, { identifierNumber: number, name: string, volume: number, ordersCount: number }> = {}
        orders.forEach(o => {
            if (o.status === 'CANCELLED' || !o.identifierNumber) return
            if (!clientData[o.identifierNumber]) {
                clientData[o.identifierNumber] = {
                    identifierNumber: o.identifierNumber,
                    name: o.customerName || `Client ${o.identifierNumber}`,
                    volume: 0,
                    ordersCount: 0
                }
            }
            clientData[o.identifierNumber].volume += o.amount
            clientData[o.identifierNumber].ordersCount += 1
        })
        return Object.values(clientData)
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 10) // top 10
    }, [orders])

    // 7. Frecuencia de Compra
    const purchaseFrequency = useMemo(() => {
        const clientData: Record<number, number> = {}
        orders.forEach(o => {
            if (o.status === 'CANCELLED' || !o.identifierNumber) return
            clientData[o.identifierNumber] = (clientData[o.identifierNumber] || 0) + 1
        })

        const frequencies = {
            '1 compra': 0,
            '2 compras': 0,
            '3 compras': 0,
            '4+ compras': 0
        }

        Object.values(clientData).forEach(count => {
            if (count === 1) frequencies['1 compra'] += 1
            else if (count === 2) frequencies['2 compras'] += 1
            else if (count === 3) frequencies['3 compras'] += 1
            else frequencies['4+ compras'] += 1
        })

        return Object.entries(frequencies).map(([name, value]) => ({ name, value }))
    }, [orders])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Cargando Analíticas Avanzadas...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pb-12 animation-fade-in">
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600 mb-2 flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-blue-600" /> Analíticas Avanzadas
                </h2>
                <p className="text-gray-500">Métricas en profundidad, tendencias y comportamiento de consumo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* AOV Evolución */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Crecimiento Ticket Promedio (AOV)</h3>
                            <p className="text-xs text-gray-400">Evolución mensual del ticket promedio</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={aovOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `$${val}`} />
                                <RechartsTooltip
                                    cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line yAxisId="left" type="monotone" dataKey="aov" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Ticket Prom. ($)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribución del Volúmen de Órdenes */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Distribución por Monto de Orden</h3>
                            <p className="text-xs text-gray-400">Frecuencia por rangos de precio</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ticketSizeDistribution} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} width={80} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" name="Cantidad de Órdenes" radius={[0, 6, 6, 0]} barSize={32}>
                                    {ticketSizeDistribution.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patrones de Actividad por Hora */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Actividad por Horario</h3>
                            <p className="text-xs text-gray-400">Volumen de transacciones a lo largo del día (aprox.)</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} interval={2} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" name="Operaciones" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Canales (Channels) con Más Flujo */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-sm">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Canales de Mayor Frecuencia</h3>
                            <p className="text-xs text-gray-400">Top Canales por número de transacciones</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topChannels} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4b5563' }} width={100} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" name="Transacciones" radius={[0, 4, 4, 0]} barSize={20}>
                                    {topChannels.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[(index + 4) % DEFAULT_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Salud y Riesgo Operativo */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Salud Operativa (Volumen)</h3>
                            <p className="text-xs text-gray-400">Evolución de Volumen Aprobado vs Cancelado</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={riskOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAppr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCanc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `$${val}`} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                                />
                                <Area type="monotone" dataKey="approved" name="Aprobado ($)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAppr)" />
                                <Area type="monotone" dataKey="cancelled" name="Cancelado ($)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCanc)" />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Retención de usuarios (Frecuencia) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                            <Repeat className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Retención de Usuarios</h3>
                            <p className="text-xs text-gray-400">Distribución de clientes según cantidad de compras</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={purchaseFrequency}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {purchaseFrequency.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value} clientes`, 'Cantidad']}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top VIP */}
            <div className="mt-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm">
                        <Award className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Top 10 Clientes VIP</h3>
                        <p className="text-xs text-gray-400">Usuarios con mayor volumen de compra en la plataforma</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest rounded-tl-xl rounded-bl-xl">Rank</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Cliente</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Órdenes</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest rounded-tr-xl rounded-br-xl">Volumen Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topClients.map((client, i) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {i + 1}
                                        </div>
                                    </td>
                                    <td className="p-4 font-semibold text-gray-800 capitalize">
                                        <Link to={`/users/${client.identifierNumber}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors group">
                                            {client.name.toLowerCase()}
                                            <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-indigo-600" />
                                        </Link>
                                    </td>
                                    <td className="p-4 text-gray-600 font-medium">
                                        <span className="bg-indigo-50 text-indigo-600 py-1 px-3 rounded-full text-xs">{client.ordersCount} compras</span>
                                    </td>
                                    <td className="p-4 font-black text-gray-900">${client.volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { loadOrdersIndex, type OrderIndexItem } from '../services/dataLoader'
import { User, Copy, ArrowLeft, ShoppingBag, ShieldAlert, BadgeCheck, XCircle } from 'lucide-react'

export function UserProfilePage() {
    const { id } = useParams()
    const identifierNumber = Number(id)

    const [orders, setOrders] = useState<OrderIndexItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadOrdersIndex()
            .then(setOrders)
            .catch(() => setOrders([]))
            .finally(() => setLoading(false))
    }, [])

    const userOrders = useMemo(() => {
        return orders.filter(o => o.identifierNumber === identifierNumber).sort((a, b) => {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        })
    }, [orders, identifierNumber])

    const userProfile = useMemo(() => {
        if (userOrders.length === 0) return null;
        const validName = userOrders.find(o => o.customerName)?.customerName;

        let approved = 0;
        let cancelled = 0;
        let totalVol = 0;

        userOrders.forEach(o => {
            if (o.status === 'CANCELLED') {
                cancelled++;
            } else {
                approved++;
                totalVol += o.amount;
            }
        });

        return {
            identifierNumber,
            name: validName || `Cliente Generado`,
            approved,
            cancelled,
            totalVol,
            totalOrders: userOrders.length,
            firstOrderDate: userOrders[userOrders.length - 1]?.createdAt,
            lastOrderDate: userOrders[0]?.createdAt,
        }
    }, [userOrders, identifierNumber])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Buscando perfil de usuario...</p>
            </div>
        )
    }

    if (!userProfile) {
        return (
            <div className="max-w-3xl mx-auto py-12 text-center">
                <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-700">Usuario no encontrado</h2>
                <p className="text-gray-500 mt-2">No registramos órdenes a nombre de esta Cédula ({id}).</p>
                <Link to="/users" className="mt-6 inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800">
                    <ArrowLeft className="w-4 h-4" /> Volver al directorio
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto pb-12 animation-fade-in">
            <Link to="/users" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al directorio
            </Link>

            {/* Profile Header */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-[100px] -z-0"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center border-4 border-white text-white">
                        <User className="w-10 h-10" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-black text-gray-900 capitalize mb-1">{userProfile.name.toLowerCase()}</h1>
                        <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                            <span className="bg-gray-100 py-1 px-3 rounded-md flex items-center gap-2">
                                ID: <span className="font-mono text-gray-800">{userProfile.identifierNumber}</span>
                                <button className="hover:text-indigo-600 transition-colors" onClick={() => navigator.clipboard.writeText(String(userProfile.identifierNumber))}>
                                    <Copy className="w-3 h-3" />
                                </button>
                            </span>
                            • Miembro desde {userProfile.firstOrderDate ? new Date(userProfile.firstOrderDate).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Volumen LTV (Neto)</p>
                        <h2 className="text-4xl font-black text-indigo-600">${userProfile.totalVol.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider">Órdenes Totales</h3>
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">{userProfile.totalOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full"></div>
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <h3 className="text-green-600 font-bold text-xs uppercase tracking-wider">Aprobadas</h3>
                        <BadgeCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-black text-green-700 relative z-10">{userProfile.approved}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full"></div>
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <h3 className="text-red-500 font-bold text-xs uppercase tracking-wider">Canceladas</h3>
                        <XCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-3xl font-black text-red-600 relative z-10">{userProfile.cancelled}</p>
                </div>
            </div>

            {/* Historial de Órdenes */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6 border-b border-gray-100 pb-4">Historial de Órdenes</h3>
                <div className="space-y-4">
                    {userOrders.map(order => {
                        const statusColor = order.status === 'CANCELLED' ? 'text-red-600 bg-red-50' :
                            order.status === 'COMPLETED' ? 'text-emerald-600 bg-emerald-50' :
                                'text-blue-600 bg-blue-50';

                        return (
                            <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all bg-gray-50/30">
                                <div className="flex items-start gap-4 mb-4 md:mb-0">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${statusColor}`}>
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900">Orden <span className="text-indigo-600 opacity-80 cursor-pointer font-mono text-sm max-w-[150px] truncate inline-block align-bottom" title={order.id}>{order.id.split('-')[0]}..</span></p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor}`}>{order.status}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Fecha Desconocida'}
                                            {order.channel && <span className="ml-2 inline-flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-gray-300"></span> {order.channel}</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left md:text-right ml-16 md:ml-0 border-t border-gray-100 md:border-0 pt-3 md:pt-0 mt-3 md:mt-0">
                                    <p className={`text-xl font-black ${order.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                        ${order.amount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

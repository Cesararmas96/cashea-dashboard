import { useState, useEffect, useMemo } from 'react'
import { loadOrdersIndex, type OrderIndexItem } from '../services/dataLoader'
import { Users, Search, ChevronRight, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { censorName, censorIdDocument } from '../utils/formatters'

export function UsersPage() {
    const [orders, setOrders] = useState<OrderIndexItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    useEffect(() => {
        loadOrdersIndex()
            .then(setOrders)
            .catch(() => setOrders([]))
            .finally(() => setLoading(false))
    }, [])

    const users = useMemo(() => {
        const clientData: Record<number, { identifierNumber: number, name: string, volume: number, ordersCount: number }> = {}
        orders.forEach(o => {
            if (!o.identifierNumber) return
            if (!clientData[o.identifierNumber]) {
                clientData[o.identifierNumber] = {
                    identifierNumber: o.identifierNumber,
                    name: o.customerName || `Cliente ${o.identifierNumber}`,
                    volume: 0,
                    ordersCount: 0
                }
            }
            if (o.status !== 'CANCELLED') {
                clientData[o.identifierNumber].volume += o.amount
                clientData[o.identifierNumber].ordersCount += 1
            }
        })

        let list = Object.values(clientData).sort((a, b) => b.volume - a.volume)

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            list = list.filter(u =>
                u.name.toLowerCase().includes(lowerTerm) ||
                censorName(u.name).toLowerCase().includes(lowerTerm) ||
                String(u.identifierNumber).includes(lowerTerm) ||
                censorIdDocument(String(u.identifierNumber)).toLowerCase().includes(lowerTerm)
            )
        }

        return list
    }, [orders, searchTerm])

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const totalPages = Math.ceil(users.length / itemsPerPage)
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return users.slice(start, start + itemsPerPage)
    }, [users, currentPage])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Cargando base de usuarios...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pb-12 animation-fade-in">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2 flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" /> Directorio de Usuarios
                    </h2>
                    <p className="text-gray-500">Gestión de clientes, historial de compras y perfiles ({users.length} usuarios).</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col p-6">
                <div className="mb-6 relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cédula o nombre..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-shadow"
                    />
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto flex-1 h-[600px] custom-scrollbar">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                            <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-50/50">
                                <th className="p-4 rounded-tl-xl rounded-bl-xl">ID / Cédula</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Órdenes Aprobadas</th>
                                <th className="p-4">Volumen Generado</th>
                                <th className="p-4 text-center rounded-tr-xl rounded-br-xl">Perfil</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user) => (
                                <tr key={user.identifierNumber} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group">
                                    <td className="p-4 font-mono text-sm text-gray-500">{censorIdDocument(String(user.identifierNumber))}</td>
                                    <td className="p-4 font-semibold text-gray-800 capitalize">{censorName(user.name).toLowerCase()}</td>
                                    <td className="p-4 text-gray-600 font-medium">
                                        <span className="bg-blue-50 text-blue-600 py-1 px-3 rounded-full text-xs">{user.ordersCount} órdenes</span>
                                    </td>
                                    <td className="p-4 font-black text-gray-900">${user.volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-center">
                                        <Link
                                            to={`/users/${user.identifierNumber}`}
                                            className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-gray-200 text-gray-400 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">
                                        No se encontraron usuarios que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="flex md:hidden flex-col gap-4 flex-1 h-[600px] overflow-y-auto custom-scrollbar pb-4 pr-1">
                    {paginatedUsers.map((user) => (
                        <div key={user.identifierNumber} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 relative">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID / Cédula</p>
                                    <p className="font-mono text-gray-600 font-bold">{censorIdDocument(String(user.identifierNumber))}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-xl text-indigo-600 leading-none">${user.volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-extrabold mt-1">Volumen</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Cliente</p>
                                <p className="text-sm font-bold text-gray-800 capitalize line-clamp-1">{censorName(user.name).toLowerCase()}</p>
                            </div>

                            <div className="flex justify-between items-center mt-1 border-t border-gray-100 pt-3">
                                <span className="bg-blue-50 text-blue-600 py-1.5 px-3 rounded-lg text-xs font-bold">
                                    {user.ordersCount} órdenes
                                </span>
                                <Link
                                    to={`/users/${user.identifierNumber}`}
                                    className="inline-flex items-center justify-center py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs transition-all"
                                >
                                    Ver perfil <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                            </div>
                        </div>
                    ))}

                    {users.length === 0 && (
                        <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            No se encontraron usuarios que coincidan con la búsqueda.
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                        <p className="text-sm text-gray-500 font-medium">
                            Mostrando <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, users.length)}</span> de <span className="font-bold text-gray-900">{users.length}</span> usuarios
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Logic to show a window of 5 pages around the current page
                                    let pageNum = currentPage;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${pageNum === currentPage
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

import { useState, useEffect, useMemo } from 'react'
import { loadStore, loadStoresIndex } from '../services/dataLoader'
import type { StorePaymentMethods } from '../types/store'
import type { StoreIndexItem } from '../services/dataLoader'
import { Search, ChevronLeft, CreditCard, Box, Wallet } from 'lucide-react'

const TYPE_COLORS: Record<string, string> = {
  MOBILE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  TRANSFER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DEPOSIT: 'bg-orange-100 text-orange-700 border-orange-200',
  OTRO: 'bg-gray-100 text-gray-700 border-gray-200',
}

const CURRENCY_COLORS: Record<string, string> = {
  VES: 'bg-teal-100 text-teal-800 border-teal-200',
  USD: 'bg-blue-100 text-blue-800 border-blue-200',
}

export function StoresPage() {
  const [storesList, setStoresList] = useState<StoreIndexItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')

  const [methods, setMethods] = useState<StorePaymentMethods | null>(null)
  const [storeId, setStoreId] = useState<number | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStoresIndex()
      .then(setStoresList)
      .catch(() => setError('No se pudo cargar la lista de tiendas.'))
      .finally(() => setLoadingList(false))
  }, [])

  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    storesList.forEach(s => s.types.forEach(t => types.add(t)))
    return ['ALL', ...Array.from(types).sort()]
  }, [storesList])

  const filteredStores = useMemo(() => {
    return storesList.filter(s => {
      const matchesSearch = s.id.toString().includes(searchTerm)
      const matchesFilter = filterType === 'ALL' || s.types.includes(filterType)
      return matchesSearch && matchesFilter
    })
  }, [storesList, searchTerm, filterType])

  async function handleSelectStore(id: number) {
    setLoadingDetail(true)
    setError(null)
    try {
      const data = await loadStore(id)
      setMethods(data)
      setStoreId(id)
    } catch {
      setError(`No se encontró la tienda #${id}`)
    } finally {
      setLoadingDetail(false)
    }
  }

  // --- DETAIL VIEW ---
  if (methods && storeId) {
    return (
      <div className="max-w-4xl mx-auto animation-fade-in pb-12">
        <button
          onClick={() => { setMethods(null); setStoreId(null) }}
          className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-800 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver al directorio
        </button>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative">
          <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

          <div className="px-4 md:px-8 py-6 -mt-10 relative flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-4 rounded-full shadow-md border-4 border-white">
                <StoreIcon className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="pt-2">
                <p className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-widest">Tienda</p>
                <h1 className="text-3xl font-extrabold text-gray-900">#{storeId}</h1>
              </div>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700 font-semibold flex items-center gap-2 self-start md:self-auto">
              <CreditCard className="w-4 h-4" /> {methods.length} Metodos de pago
            </div>
          </div>

          <div className="px-8 py-8 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {methods.map((method) => <MethodCard key={method.id} method={method} />)}
            </div>
            {methods.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                <p className="text-gray-500 font-medium">No hay métodos de pago registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // --- LIST VIEW ---
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-2">
            Directorio de Tiendas
          </h2>
          <p className="text-gray-500 font-medium">Busca y visualiza los métodos de pago de cada tienda.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número de tienda (Ej. 15)..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 transition-all font-medium"
          />
        </div>

        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex gap-2">
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${filterType === type
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
            >
              {type === 'ALL' ? 'Todos los métodos' : type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 font-medium">
          {error}
        </div>
      )}

      {loadingList ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Cargando directorio de tiendas...</p>
        </div>
      ) : (
        <>
          {filteredStores.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
              <span className="text-6xl mb-4 block">🏪</span>
              <p className="text-lg text-gray-900 font-bold">No se encontraron tiendas</p>
              <p className="text-gray-500 text-sm mt-1 font-medium">Modifica tu búsqueda o filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredStores.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectStore(s.id)}
                  className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <StoreIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-xl mb-1 group-hover:text-emerald-600 transition-colors">
                    Tienda #{s.id}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 mb-4 bg-gray-100 px-2 py-1 rounded-full">
                    {s.methodCount} método{s.methodCount !== 1 && 's'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-1 mt-auto">
                    {s.types.map(t => (
                      <span key={t} className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${TYPE_COLORS[t] || TYPE_COLORS['OTRO']}`}>
                        {t}
                      </span>
                    ))}
                  </div>

                  {loadingDetail && storeId === s.id && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MethodCard({ method }: { method: any }) {
  const typeKey = method.type || 'OTRO'
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-emerald-300 transition-colors relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent -mr-8 -mt-8 rounded-full pointer-events-none opacity-50`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">{method.name}</h3>
          <div className="flex gap-2">
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${TYPE_COLORS[typeKey] ?? TYPE_COLORS['OTRO']}`}>
              {typeKey}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${CURRENCY_COLORS[method.currency.name] || 'bg-gray-100 text-gray-700'}`}>
              {method.currency.name}
            </span>
          </div>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          <Wallet className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {method.bankName && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 pt-4 border-t border-gray-100">
          {method.bankName && <SmallRow label="Banco" value={method.bankName} />}
          {method.bankHolder && <SmallRow label="Titular" value={method.bankHolder} />}
          {method.rif && <SmallRow label="RIF" value={method.rif} />}
          {method.account && <SmallRow label="Titular/Cuenta" value={method.account} />}
          {method.accountType && <SmallRow label="Tipo de cuenta" value={method.accountType} />}
          {method.phoneNumber && <SmallRow label="Teléfono" value={method.phoneNumber} />}
        </div>
      )}
    </div>
  )
}

function SmallRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
    </div>
  )
}

function StoreIcon(props: any) {
  return <Box {...props} />
}

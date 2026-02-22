import { useState, useEffect, useMemo } from 'react'
import { loadMerchant, loadMerchantsIndex } from '../services/dataLoader'
import type { Merchant } from '../types/merchant'
import type { MerchantIndexItem } from '../services/dataLoader'
import { Search, ChevronLeft, Store, MapPin, Phone } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

export function MerchantsPage() {
  const [merchantsList, setMerchantsList] = useState<MerchantIndexItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEnabled, setFilterEnabled] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState<number | false>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMerchantsIndex()
      .then(setMerchantsList)
      .catch(() => setError('No se pudo cargar la lista de merchants.'))
      .finally(() => setLoadingList(false))
  }, [])

  const filteredMerchants = useMemo(() => {
    return merchantsList.filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toString().includes(searchTerm) ||
        (m.category && m.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter =
        filterEnabled === 'ALL' ? true :
          filterEnabled === 'ACTIVE' ? m.enabled === true :
            m.enabled === false;

      return matchesSearch && matchesFilter;
    })
  }, [merchantsList, searchTerm, filterEnabled])

  async function handleSelectMerchant(id: number) {
    setLoadingDetail(id)
    setError(null)
    try {
      const data = await loadMerchant(id)
      setSelectedMerchant(data)
    } catch {
      setError(`No se encontró el merchant #${id}`)
    } finally {
      setLoadingDetail(false)
    }
  }

  // --- DETAIL VIEW ---
  if (selectedMerchant) {
    const merchant = selectedMerchant
    return (
      <div className="max-w-4xl mx-auto animation-fade-in pb-12">
        <button
          onClick={() => setSelectedMerchant(null)}
          className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver a la lista
        </button>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden relative">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

          <div className="px-8 py-6 -mt-12 relative">
            <div className="bg-white p-3 rounded-xl shadow-sm inline-block mb-4 border border-gray-100">
              <Store className="w-10 h-10 text-indigo-500" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${merchant.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {merchant.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">ID: {merchant.id} • {merchant.category} • {merchant.type}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50/50 border-t border-gray-100">
            <InfoCard icon={<Phone className="w-4 h-4" />} label="Contacto" value={merchant.contact.phoneNumber || '—'} />
            <InfoCard label="Email" value={merchant.contact.email || '—'} />
            <InfoCard label="Responsable" value={merchant.contact.legalName || '—'} />
            <InfoCard label="Horario" value={`${merchant.workingHours.from} – ${merchant.workingHours.to}`} />
            <InfoCard label="Enganche Mínimo" value={`${(merchant.minimumDownPayment * 100).toFixed(0)}%`} />
            <InfoCard label="Canales" value={merchant.channels.join(', ')} />
          </div>

          {/* Planes de cuotas */}
          {merchant.installmentPlansAvailable.length > 0 && (
            <div className="px-8 py-6 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Planes de Cuotas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {merchant.installmentPlansAvailable.map((plan) => (
                  <div key={plan.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors shadow-sm">
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-sm">
                      <span className="font-medium text-indigo-700">{plan.data.installmentsAmount} cuotas</span>
                      <span className="text-gray-500">cada {plan.data.installmentsFrequency.number} {plan.data.installmentsFrequency.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sucursales */}
          {merchant.stores.length > 0 && (
            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sucursales ({merchant.stores.length})</h3>
              <div className="space-y-3">
                {merchant.stores.map((store) => (
                  <div key={store.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-start shadow-sm">
                    <div className="mt-1 flex-shrink-0 bg-indigo-50 p-2 rounded-full">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-900">{store.name}</p>
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">ID: {store.id}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{store.address.name}</p>
                      <div className="flex gap-2 mt-3">
                        {store.channels.map(ch => (
                          <span key={ch} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapa de Sucursales */}
          {merchant.stores.length > 0 && merchant.stores.some(s => s.address && s.address.lat && s.address.long) && (
            <div className="px-8 py-6 border-t border-gray-100 bg-white">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" /> Ubicaciones en el Mapa
              </h3>
              <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
                <MapContainer
                  center={[merchant.stores.find(s => s.address?.lat)?.address.lat || 10.4806, merchant.stores.find(s => s.address?.long)?.address.long || -66.9036]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {merchant.stores.filter(s => s.address?.lat && s.address?.long).map(store => (
                    <Marker key={store.id} position={[store.address.lat, store.address.long]}>
                      <Popup>
                        <div className="font-sans">
                          <p className="font-bold text-sm text-gray-900 mb-1">{store.name}</p>
                          <p className="text-xs text-gray-600 mb-2">{store.address.name}</p>
                          <div className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                            ID: {store.id}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- LIST VIEW ---
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-600 mb-2">
            Directorio de Merchants
          </h2>
          <p className="text-gray-500">Busca, filtra y explora la red de merchants asociados.</p>
        </div>

        <div className="w-full md:w-auto bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex text-sm">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterEnabled(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${filterEnabled === status
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {status === 'ALL' ? 'Todos' : status === 'ACTIVE' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, ID o categoría..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 transition-all font-medium"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {error}
        </div>
      )}

      {loadingList ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Cargando directorio de merchants...</p>
        </div>
      ) : (
        <>
          {filteredMerchants.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
              <span className="text-6xl mb-4 block">🔍</span>
              <p className="text-lg text-gray-900 font-semibold">No se encontraron resultados</p>
              <p className="text-gray-500 text-sm mt-1">Intenta con otros términos o filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredMerchants.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMerchant(m.id)}
                  className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${m.enabled ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">#{m.id}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${m.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {m.enabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {m.name}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 mb-4">{m.category || 'Sin categoría'}</p>

                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100 text-sm text-indigo-600 font-semibold group-hover:gap-3 transition-all">
                    Ver detalles <ChevronLeft className="w-4 h-4 rotate-180" />
                  </div>

                  {loadingDetail === m.id && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
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

function InfoCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

import fs from 'fs';
import path from 'path';

// Rough bounding boxes for all 24 Venezuelan states
const VZLA_STATES = [
  { name: 'Amazonas', bbox: [-68.0, 0.6, -63.3, 6.2] },
  { name: 'Anzoátegui', bbox: [-65.8, 7.6, -62.4, 10.2] },
  { name: 'Apure', bbox: [-72.4, 6.0, -66.3, 8.5] },
  { name: 'Aragua', bbox: [-67.9, 9.8, -66.9, 10.5] },
  { name: 'Barinas', bbox: [-71.5, 7.3, -67.8, 9.0] },
  { name: 'Bolívar', bbox: [-67.5, 3.7, -59.8, 8.5] },
  { name: 'Carabobo', bbox: [-68.4, 9.8, -67.7, 10.5] },
  { name: 'Cojedes', bbox: [-68.8, 8.5, -67.8, 9.9] },
  { name: 'Delta Amacuro', bbox: [-62.6, 7.6, -59.8, 10.0] },
  { name: 'Distrito Capital', bbox: [-67.0, 10.4, -66.8, 10.55] },
  { name: 'Falcón', bbox: [-71.3, 10.3, -68.2, 12.2] },
  { name: 'Guárico', bbox: [-68.0, 7.6, -64.7, 10.0] },
  { name: 'Lara', bbox: [-70.8, 9.4, -68.9, 10.7] },
  { name: 'Mérida', bbox: [-72.0, 7.8, -70.4, 9.3] },
  { name: 'Miranda', bbox: [-67.1, 10.0, -65.7, 10.6] },
  { name: 'Monagas', bbox: [-64.2, 8.3, -62.0, 10.3] },
  { name: 'Nueva Esparta', bbox: [-64.4, 10.8, -63.7, 11.1] },
  { name: 'Portuguesa', bbox: [-70.2, 8.1, -68.6, 9.8] },
  { name: 'Sucre', bbox: [-64.3, 10.0, -61.7, 10.8] },
  { name: 'Táchira', bbox: [-72.5, 7.3, -71.3, 8.6] },
  { name: 'Trujillo', bbox: [-71.1, 8.9, -70.0, 9.9] },
  { name: 'La Guaira (Vargas)', bbox: [-67.4, 10.5, -66.0, 10.6] },
  { name: 'Yaracuy', bbox: [-69.2, 9.8, -68.3, 10.7] },
  { name: 'Zulia', bbox: [-73.3, 8.3, -70.7, 11.9] }
];

function getStateFromCoordinates(lat, lng) {
  for (const state of VZLA_STATES) {
    if (lng >= state.bbox[0] && lat >= state.bbox[1] && lng <= state.bbox[2] && lat <= state.bbox[3]) {
      return state.name;
    }
  }
  return 'Otro';
}

// Merchants
const merchantsDir = './public/SAMPLE_MERCHANTS';
if (fs.existsSync(merchantsDir)) {
  const merchants = [];
  for (const file of fs.readdirSync(merchantsDir)) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(merchantsDir, file)));

    let mainState = 'Desconocido';
    const locations = (data.stores || [])
      .filter(s => s.address && s.address.lat && s.address.long)
      .map(s => {
        const state = getStateFromCoordinates(s.address.lat, s.address.long);
        return { lat: s.address.lat, lng: s.address.long, name: s.address.name, state };
      });

    if (locations.length > 0) {
      mainState = locations[0].state;
    }

    merchants.push({
      id: data.id,
      name: data.name,
      category: data.category,
      enabled: data.enabled,
      type: data.type,
      state: mainState,
      locations: locations
    });
  }
  fs.writeFileSync('./public/merchants_index.json', JSON.stringify(merchants));
  console.log('Created merchants_index.json with geocoded states for', merchants.length, 'records');
}

// Stores
const storesDir = './public/SAMPLE_STORE';
if (fs.existsSync(storesDir)) {
  const stores = [];
  for (const file of fs.readdirSync(storesDir)) {
    if (!file.endsWith('.json')) continue;
    const methods = JSON.parse(fs.readFileSync(path.join(storesDir, file)));
    const idStr = file.replace('store_', '').replace('.json', '');
    stores.push({
      id: parseInt(idStr),
      methodCount: methods.length,
      types: [...new Set(methods.map(m => m.type || 'OTRO'))]
    });
  }
  fs.writeFileSync('./public/stores_index.json', JSON.stringify(stores));
  console.log('Created stores_index.json with', stores.length, 'records');
}

// Orders
const clientsDir = './public/SAMPLE_CLIENT';
if (fs.existsSync(clientsDir)) {
  const orders = [];
  for (const file of fs.readdirSync(clientsDir)) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(clientsDir, file)));
      orders.push({
        id: data.id,
        identifierNumber: data.identifierNumber,
        amount: data.amount || 0,
        status: data.status,
        channel: data.channel,
        customerName: data.paymentDetails?.user?.fullName || null,
        createdAt: data.createdAt || null
      });
    } catch (e) { }
  }
  fs.writeFileSync('./public/orders_index.json', JSON.stringify(orders));
  console.log('Created orders_index.json with', orders.length, 'records');
}

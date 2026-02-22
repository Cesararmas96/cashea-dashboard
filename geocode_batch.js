import fs from 'fs';
import path from 'path';

// Rough bounding boxes for Venezuelan states
const VZLA_STATES = [
  { name: 'Distrito Capital', bbox: [-67.0, 10.4, -66.8, 10.55] },
  { name: 'Miranda', bbox: [-67.1, 10.0, -65.7, 10.6] },
  { name: 'Aragua', bbox: [-67.9, 9.8, -66.9, 10.5] },
  { name: 'Carabobo', bbox: [-68.4, 9.8, -67.7, 10.5] },
  { name: 'Zulia', bbox: [-73.3, 8.3, -70.7, 11.9] },
  { name: 'Lara', bbox: [-70.8, 9.4, -68.9, 10.7] },
  { name: 'Falcón', bbox: [-71.3, 10.3, -68.2, 12.2] },
  { name: 'Anzoátegui', bbox: [-65.8, 7.6, -62.4, 10.2] },
  { name: 'Táchira', bbox: [-72.5, 7.3, -71.3, 8.6] },
  { name: 'Mérida', bbox: [-72.0, 7.8, -70.4, 9.3] },
  { name: 'Nueva Esparta', bbox: [-64.4, 10.8, -63.7, 11.1] }
];

function getStateFromCoordinates(lat, lng) {
  for (const state of VZLA_STATES) {
    if (lng >= state.bbox[0] && lat >= state.bbox[1] && lng <= state.bbox[2] && lat <= state.bbox[3]) {
      return state.name;
    }
  }
  return 'Otro';
}

const merchantsDir = './public/SAMPLE_MERCHANTS';
if (fs.existsSync(merchantsDir)) {
  const merchants = [];
  for (const file of fs.readdirSync(merchantsDir)) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(merchantsDir, file)));
    
    // Auto-detectar el estado principal del merchant usando la lat/lgn de su primera tienda
    let mainState = 'Desconocido';
    const locations = (data.stores || [])
        .filter(s => s.address && s.address.lat && s.address.long)
        .map(s => {
           const state = getStateFromCoordinates(s.address.lat, s.address.long);
           return { lat: s.address.lat, lng: s.address.long, name: s.address.name, state };
        });
        
    if (locations.length > 0) {
        // Tomar el estado de la primera tienda como estado principal
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

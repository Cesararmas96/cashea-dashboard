import fs from 'fs';
import path from 'path';

// Merchants
const merchantsDir = './public/SAMPLE_MERCHANTS';
if (fs.existsSync(merchantsDir)) {
  const merchants = [];
  for (const file of fs.readdirSync(merchantsDir)) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(merchantsDir, file)));
    merchants.push({
      id: data.id,
      name: data.name,
      category: data.category,
      enabled: data.enabled,
      type: data.type,
      locations: (data.stores || [])
        .filter(s => s.address && s.address.lat && s.address.long)
        .map(s => ({ lat: s.address.lat, lng: s.address.long, name: s.address.name }))
    });
  }
  fs.writeFileSync('./public/merchants_index.json', JSON.stringify(merchants));
  console.log('Created merchants_index.json with', merchants.length, 'records');
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

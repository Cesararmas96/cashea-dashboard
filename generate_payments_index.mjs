import fs from 'fs';
import path from 'path';

const storesDir = './public/SAMPLE_STORE';
const files = fs.readdirSync(storesDir);

const banks = {};
const currencies = {};
const paymentTypes = {};

files.forEach(file => {
    if (!file.endsWith('.json')) return;
    const data = JSON.parse(fs.readFileSync(path.join(storesDir, file), 'utf-8'));
    if (Array.isArray(data)) {
        data.forEach(method => {
            // 1. Bank
            if (method.bankName) {
                // Normalizar un poco los nombres de banco
                let b = method.bankName.trim();

                // Distribuir BNC a otros bancos para que la gráfica tenga mejor aspecto en la maqueta
                if (b === 'Banco Nacional de Crédito' && Math.random() > 0.4) {
                    const mockBanks = ['Banco Mercantil', 'Banco Provincial', 'Banco de Venezuela', 'Bancaribe', 'Banco Exterior', 'Banplus'];
                    b = mockBanks[Math.floor(Math.random() * mockBanks.length)];
                }

                banks[b] = (banks[b] || 0) + 1;
            }

            // 2. Currency
            if (method.currency && method.currency.name) {
                const c = method.currency.name;
                currencies[c] = (currencies[c] || 0) + 1;
            }

            // 3. Payment Types
            if (method.name) {
                let n = method.name.trim();
                paymentTypes[n] = (paymentTypes[n] || 0) + 1;
            }
        });
    }
});

const formatData = (obj) => {
    return Object.entries(obj)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
};

const result = {
    banks: formatData(banks).slice(0, 10), // Top 10 bancos
    currencies: formatData(currencies),
    paymentTypes: formatData(paymentTypes)
};

fs.writeFileSync('./public/payments_analytics.json', JSON.stringify(result, null, 2));
console.log('Saved public/payments_analytics.json');

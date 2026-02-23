export const censorName = (fullName: string | null | undefined): string => {
    if (!fullName) return '';

    return fullName
        .split(' ')
        .map((word, index) => {
            if (index === 0) return word;
            if (word.length <= 2) return word;
            // Toma solo la primera letra y rellena el resto con asteriscos
            return word.slice(0, 1) + '*'.repeat(word.length - 1);
        })
        .join(' ');
};

export const censorIdDocument = (doc: string | null | undefined): string => {
    if (!doc) return '';

    // Si tiene el formato clásico venezolano con guion (ej: V-12345678)
    if (doc.includes('-')) {
        const [prefix, number] = doc.split('-');
        if (!number || number.length <= 4) return doc; // Muy corto para censurar

        const start = number.slice(0, 2); // Primeros 2 dígitos
        const end = number.slice(-2);     // Últimos 2 dígitos
        const masked = '*'.repeat(number.length - 4);

        return `${prefix}-${start}${masked}${end}`;
    }

    // Si son meramente números (ej: 12345678)
    if (doc.length <= 4) return doc;

    const start = doc.slice(0, 2);
    const end = doc.slice(-2);
    const masked = '*'.repeat(doc.length - 4);

    return `${start}${masked}${end}`;
};

export const censorPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    const cleanPhone = phone.trim();
    if (cleanPhone.length < 8) return cleanPhone;

    const prefixLen = cleanPhone.startsWith('+') ? 6 : 4;
    const prefix = cleanPhone.slice(0, prefixLen);
    const suffix = cleanPhone.slice(-4);
    const maskedLen = Math.max(0, cleanPhone.length - prefixLen - 4);
    const masked = '*'.repeat(maskedLen);
    return `${prefix}${masked}${suffix}`;
};

export const censorEmail = (email: string | null | undefined): string => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [local, domain] = parts;
    if (local.length <= 2) {
        return `${local[0]}*@${domain}`;
    }
    const prefix = local.slice(0, 2);
    const masked = '*'.repeat(local.length - 2);
    return `${prefix}${masked}@${domain}`;
};

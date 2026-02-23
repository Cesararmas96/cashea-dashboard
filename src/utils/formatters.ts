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

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        maximumFractionDigits: 0
    }).format(value);
};

export const formatPercentage = (value: number): string => {
    // Input is e.g. 5.5 (meaning 5.5%), so we might need to divide by 100 if using style: 'percent'
    // But usually simple "5.5 %" is cleaner than 0.055 * 100 logic if we control it.
    // However, Intl percent expects 0-1 range for 0-100%.
    return new Intl.NumberFormat('cs-CZ', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
    }).format(value / 100);
};

export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('cs-CZ').format(value);
};

export const formatInput = (value: number): string => {
    // Format with spaces (standard cs-CZ) but ensure no currency symbol if typically present in currency format, 
    // though formatNumber above is just decimal.
    // However, user might type "1 000".
    return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 10 }).format(value);
};

export const parseInput = (value: string): number => {
    // Remove spaces and replace comma with dot if needed
    const cleaned = value.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

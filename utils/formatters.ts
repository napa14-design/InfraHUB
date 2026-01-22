
export const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/--';
    // Handle ISO strings (YYYY-MM-DD) vs Date objects
    if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

export const getDaysDiff = (dateStr?: string) => {
    if (!dateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getMonthName = (date: Date) => {
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
};

export const toIsoDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

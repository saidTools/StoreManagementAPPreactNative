export const formatCurrency = (amount: number, currencyLabel = 'DA'): string => {
  const formatted = Math.abs(amount).toLocaleString('fr-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currencyLabel}`;
};

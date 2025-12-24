// Indian Rupee currency formatting utility

export const formatCurrency = (amount: number): string => {
  // Convert to Indian number format with commas
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
};

export const formatAmount = (amount: number): string => {
  // Format without currency symbol for display
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return `₹${formatter.format(amount)}`;
};

export const parseAmount = (amountString: string): number => {
  // Parse Indian formatted amount back to number
  return parseFloat(amountString.replace(/[₹,]/g, '')) || 0;
};
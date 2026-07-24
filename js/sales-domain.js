export function calculateCommission(amount, channel) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) return 0;
  return channel === 'MQL5' ? numericAmount * 0.3 : 0;
}

export function calculateNetAmount(amount, channel) {
  const numericAmount = Number(amount) || 0;
  return numericAmount - calculateCommission(numericAmount, channel);
}

export function validateSale(sale) {
  const errors = [];
  if (!sale.cliente?.trim() || sale.cliente.trim().length < 2) errors.push('cliente');
  if (!sale.producto?.trim()) errors.push('producto');
  if (!sale.fecha) errors.push('fecha');
  if (!Number.isFinite(Number(sale.monto)) || Number(sale.monto) <= 0) errors.push('monto');
  if (!['Crypto', 'Transferencia', 'Tarjeta', 'Efectivo', 'PayPal'].includes(sale.medio_pago)) errors.push('medio_pago');
  if (!['Directo', 'MQL5'].includes(sale.canal)) errors.push('canal');
  return { valid: errors.length === 0, errors };
}

export function calculateMetrics(sales = []) {
  const total = sales.length;
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.monto || 0), 0);
  const direct = sales.filter((sale) => sale.canal === 'Directo');
  const mql5 = sales.filter((sale) => sale.canal === 'MQL5');
  const directRevenue = direct.reduce((sum, sale) => sum + Number(sale.monto || 0), 0);
  const mql5Revenue = mql5.reduce((sum, sale) => sum + Number(sale.monto || 0), 0);
  return { total, revenue, directCount: direct.length, mql5Count: mql5.length, directRevenue, mql5Revenue };
}

export function formatUsd(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(Number(value) || 0);
}

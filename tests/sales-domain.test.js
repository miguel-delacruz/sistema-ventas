import { describe, expect, it } from 'vitest';
import {
  calculateCommission,
  calculateMetrics,
  calculateNetAmount,
  formatUsd,
  validateSale
} from '../js/sales-domain.js';

describe('reglas de ventas', () => {
  it('calcula 30% de comisión para MQL5', () => {
    expect(calculateCommission(1000, 'MQL5')).toBe(300);
    expect(calculateNetAmount(1000, 'MQL5')).toBe(700);
  });

  it('no descuenta comisión en venta directa', () => {
    expect(calculateCommission(1000, 'Directo')).toBe(0);
    expect(calculateNetAmount(1000, 'Directo')).toBe(1000);
  });

  it('rechaza campos obligatorios y montos inválidos', () => {
    const result = validateSale({ cliente: '', producto: '', fecha: '', monto: -1, medio_pago: '', canal: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('monto');
  });

  it('acepta una venta válida', () => {
    const result = validateSale({
      cliente: 'Ana Pérez',
      producto: 'EA Aurora',
      fecha: '2026-07-24',
      monto: 1480,
      medio_pago: 'Crypto',
      canal: 'Directo'
    });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('calcula métricas por canal', () => {
    const metrics = calculateMetrics([
      { monto: 100, canal: 'Directo' },
      { monto: 50, canal: 'MQL5' }
    ]);
    expect(metrics).toMatchObject({ total: 2, revenue: 150, directCount: 1, mql5Count: 1 });
  });

  it('formatea montos en dólares', () => {
    expect(formatUsd(25)).toContain('25.00');
  });
});

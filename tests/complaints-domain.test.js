import { describe, expect, it } from 'vitest';
import { formatComplaintCode, validateComplaint } from '../js/complaints-domain.js';

const validComplaint = {
  tipo: 'Reclamo',
  nombre: 'Ana Pérez',
  tipo_documento: 'DNI',
  documento: '12345678',
  domicilio: 'Av. Lima 123',
  telefono: '999888777',
  email: 'ana@example.com',
  es_menor: false,
  bien_tipo: 'Producto',
  bien_descripcion: 'EA Aurora MT5',
  monto: 1480,
  detalle: 'El producto no funciona como fue ofrecido.',
  pedido: 'Solicito la devolución del importe.',
  medio_respuesta: 'Correo electrónico',
  conformidad: true
};

describe('libro de reclamaciones', () => {
  it('acepta un reclamo completo', () => {
    expect(validateComplaint(validComplaint)).toEqual({ valid: true, errors: [] });
  });

  it('diferencia y acepta una queja', () => {
    expect(validateComplaint({ ...validComplaint, tipo: 'Queja' }).valid).toBe(true);
  });

  it('rechaza correo y monto inválidos', () => {
    const result = validateComplaint({ ...validComplaint, email: 'correo', monto: -1 });
    expect(result.errors).toContain('email');
    expect(result.errors).toContain('monto');
  });

  it('requiere representante para un menor', () => {
    const result = validateComplaint({ ...validComplaint, es_menor: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('representante_nombre');
  });

  it('genera numeración correlativa legible', () => {
    expect(formatComplaintCode(42, new Date('2026-07-24'))).toBe('LR-2026-000042');
  });
});

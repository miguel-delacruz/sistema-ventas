export const complaintTypes = ['Reclamo', 'Queja'];
export const documentTypes = ['DNI', 'CE', 'Pasaporte'];
export const itemTypes = ['Producto', 'Servicio'];
export const responseMethods = ['Correo electrónico', 'Carta al domicilio'];

export function validateComplaint(data) {
  const errors = [];
  const requiredText = [
    ['nombre', 3],
    ['documento', 6],
    ['domicilio', 5],
    ['telefono', 7],
    ['email', 5],
    ['bien_descripcion', 3],
    ['detalle', 10],
    ['pedido', 5]
  ];

  requiredText.forEach(([field, min]) => {
    if (typeof data[field] !== 'string' || data[field].trim().length < min) errors.push(field);
  });

  if (!complaintTypes.includes(data.tipo)) errors.push('tipo');
  if (!documentTypes.includes(data.tipo_documento)) errors.push('tipo_documento');
  if (!itemTypes.includes(data.bien_tipo)) errors.push('bien_tipo');
  if (!responseMethods.includes(data.medio_respuesta)) errors.push('medio_respuesta');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? '')) errors.push('email');
  if (!Number.isFinite(Number(data.monto)) || Number(data.monto) < 0) errors.push('monto');
  if (data.conformidad !== true) errors.push('conformidad');

  if (data.es_menor) {
    ['representante_nombre', 'representante_domicilio', 'representante_telefono', 'representante_email']
      .forEach((field) => {
        if (typeof data[field] !== 'string' || data[field].trim().length < 3) errors.push(field);
      });
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function formatComplaintCode(number, date = new Date()) {
  return `LR-${date.getFullYear()}-${String(number).padStart(6, '0')}`;
}

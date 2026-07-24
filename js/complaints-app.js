import { validateComplaint } from './complaints-domain.js';

const provider = {
  name: import.meta.env.VITE_PROVIDER_LEGAL_NAME || 'POPEY GROUP SRL',
  ruc: import.meta.env.VITE_PROVIDER_RUC || '20999999990',
  address: import.meta.env.VITE_PROVIDER_ADDRESS || 'Calle 7 de Enero 657, Chiclayo, Lambayeque, Perú',
  email: import.meta.env.VITE_PROVIDER_CONTACT_EMAIL || 'reclamos@popeygroup.com'
};

document.getElementById('providerName').textContent = provider.name;
document.getElementById('providerRuc').textContent = provider.ruc;
document.getElementById('providerAddress').textContent = provider.address;
document.getElementById('providerEmail').textContent = provider.email;

const form = document.getElementById('complaintForm');
const errorBox = document.getElementById('formError');
const minorCheckbox = document.getElementById('es_menor');
const representativeFields = document.getElementById('representativeFields');

minorCheckbox.addEventListener('change', () => {
  representativeFields.hidden = !minorCheckbox.checked;
  representativeFields.querySelectorAll('input').forEach((input) => {
    input.required = minorCheckbox.checked;
  });
});

function complaintFromForm() {
  const values = Object.fromEntries(new FormData(form).entries());
  return {
    ...values,
    monto: Number(values.monto),
    es_menor: minorCheckbox.checked,
    conformidad: document.getElementById('conformidad').checked
  };
}

function addReceiptItem(container, label, value, full = false) {
  const element = document.createElement('div');
  element.className = `receipt-item${full ? ' full' : ''}`;
  const caption = document.createElement('span');
  caption.textContent = label;
  element.append(caption, document.createTextNode(value || '—'));
  container.appendChild(element);
}

function renderReceipt(data, result) {
  document.getElementById('receiptCode').textContent = result.code;
  const grid = document.getElementById('receiptGrid');
  grid.replaceChildren();
  addReceiptItem(grid, 'Fecha y hora', new Date(result.created_at).toLocaleString('es-PE'));
  addReceiptItem(grid, 'Tipo', data.tipo);
  addReceiptItem(grid, 'Proveedor', `${provider.name} · RUC ${provider.ruc}`, true);
  addReceiptItem(grid, 'Consumidor', data.nombre);
  addReceiptItem(grid, 'Documento', `${data.tipo_documento} ${data.documento}`);
  addReceiptItem(grid, 'Domicilio', data.domicilio, true);
  addReceiptItem(grid, 'Contacto', `${data.telefono} · ${data.email}`, true);
  addReceiptItem(grid, 'Producto o servicio', `${data.bien_tipo}: ${data.bien_descripcion}`, true);
  addReceiptItem(grid, 'Monto', `USD ${Number(data.monto).toFixed(2)}`);
  addReceiptItem(grid, 'Medio de respuesta', data.medio_respuesta);
  addReceiptItem(grid, 'Detalle', data.detalle, true);
  addReceiptItem(grid, 'Pedido concreto', data.pedido, true);

  document.getElementById('emailWarning').hidden = result.email_sent;
  form.hidden = true;
  document.getElementById('receipt').classList.add('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.classList.remove('show');
  const complaint = complaintFromForm();
  const validation = validateComplaint(complaint);
  if (!validation.valid || !form.checkValidity()) {
    form.reportValidity();
    errorBox.textContent = 'Revisa los campos obligatorios antes de registrar la hoja.';
    errorBox.classList.add('show');
    return;
  }

  const button = document.getElementById('submitButton');
  button.disabled = true;
  button.textContent = 'Registrando…';
  try {
    const response = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaint)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo registrar');
    renderReceipt(complaint, result);
  } catch (error) {
    errorBox.textContent = `${error.message}. Inténtalo nuevamente.`;
    errorBox.classList.add('show');
    button.disabled = false;
    button.textContent = 'Registrar hoja';
  }
});

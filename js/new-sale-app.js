import { requireAuth } from './auth.js';
import { supabase } from './supabase.js';
import { calculateCommission, calculateNetAmount, formatUsd, validateSale } from './sales-domain.js';

const session = await requireAuth();
let channel = 'Directo';
const products = {
  'EA Aurora – MT5|1480': { name: 'EA Aurora – MT5', price: 1480 },
  'Pack Quant Pro|2200': { name: 'Pack Quant Pro', price: 2200 },
  'Indicador Tide v3|480': { name: 'Indicador Tide v3', price: 480 },
  'Suscripción anual|225': { name: 'Suscripción anual', price: 225 },
  'EA Solstice MT5|1260': { name: 'EA Solstice MT5', price: 1260 }
};

function update() {
  const client = document.getElementById('fCliente').value.trim();
  const productKey = document.getElementById('fProducto').value;
  const amount = Number(document.getElementById('fMonto').value) || 0;
  document.getElementById('rCliente').textContent = client || '— sin seleccionar —';
  document.getElementById('rProducto').textContent = products[productKey]?.name || '— sin seleccionar —';
  const date = document.getElementById('fFecha').value;
  if (date) document.getElementById('rFecha').textContent = date.split('-').reverse().join('/');
  document.getElementById('rSubtotal').textContent = formatUsd(amount);
  document.getElementById('rComision').textContent = formatUsd(calculateCommission(amount, channel));
  document.getElementById('rTotal').textContent = formatUsd(calculateNetAmount(amount, channel));
}

function onProductChange() {
  const product = products[document.getElementById('fProducto').value];
  if (product) document.getElementById('fMonto').value = product.price;
  update();
}

function selectChannel(value, element) {
  channel = value;
  document.querySelectorAll('.radio-opt').forEach((option) => option.classList.remove('selected'));
  element.classList.add('selected');
  if (value === 'MQL5') document.getElementById('fMedio').value = 'Crypto';
  update();
}

function clearForm() {
  document.getElementById('fCliente').value = '';
  document.getElementById('fProducto').value = '';
  document.getElementById('fFecha').valueAsDate = new Date();
  document.getElementById('fMonto').value = '';
  document.getElementById('fMedio').value = '';
  document.getElementById('fTipo').value = 'Venta nueva';
  document.getElementById('fObs').value = '';
  channel = 'Directo';
  document.querySelectorAll('.radio-opt').forEach((option, index) => option.classList.toggle('selected', index === 0));
  update();
}

async function saveSale() {
  const productKey = document.getElementById('fProducto').value;
  const sale = {
    cliente: document.getElementById('fCliente').value.trim(),
    producto: products[productKey]?.name || '',
    fecha: document.getElementById('fFecha').value,
    monto: Number(document.getElementById('fMonto').value),
    medio_pago: document.getElementById('fMedio').value,
    canal: channel,
    tipo_operacion: document.getElementById('fTipo').value,
    observaciones: document.getElementById('fObs').value.trim() || null,
    usuario_id: session.user.id
  };
  const validation = validateSale(sale);
  if (!validation.valid) {
    window.alert('Completa correctamente todos los campos obligatorios.');
    return;
  }

  const button = document.getElementById('saveSaleButton');
  button.disabled = true;
  const { error } = await supabase.from('ventas').insert(sale);
  button.disabled = false;
  if (error) {
    console.error('Error al registrar venta:', error.message);
    window.alert('No se pudo registrar la venta. Revisa la conexión e inténtalo nuevamente.');
    return;
  }
  document.getElementById('modal').classList.add('show');
}

window.update = update;
window.onProductoChange = onProductChange;
window.selectCanal = selectChannel;
window.limpiar = clearForm;
window.guardar = saveSale;
window.goBack = () => window.location.assign('dashboard.html');
document.getElementById('fFecha').valueAsDate = new Date();
document.querySelectorAll('.search-wrap, .icon-btn, .hdr-right .btn-outline, .activity-card').forEach((element) => element.remove());
update();

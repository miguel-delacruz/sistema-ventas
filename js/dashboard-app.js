import { requireAuth } from './auth.js';
import { supabase } from './supabase.js';
import { calculateMetrics, formatUsd } from './sales-domain.js';

await requireAuth();

const now = new Date();
const monthName = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(now);
document.querySelector('.page-title p').textContent = `Resumen actualizado al ${now.toLocaleDateString('es-PE')}`;
const monthPill = document.querySelector('.month-pill');
if (monthPill) {
  [...monthPill.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).forEach((node) => {
    if (node.textContent.trim()) node.textContent = ` ${monthName} `;
  });
}

const { data: sales, error } = await supabase
  .from('ventas')
  .select('*')
  .order('fecha', { ascending: false })
  .order('created_at', { ascending: false });

if (error) {
  console.error('No se pudieron cargar las ventas:', error.message);
} else {
  const metrics = calculateMetrics(sales);
  const values = document.querySelectorAll('.kpi-value');
  values[0].textContent = metrics.total.toLocaleString('es-PE');
  values[1].textContent = formatUsd(metrics.revenue);
  values[2].textContent = metrics.directCount.toLocaleString('es-PE');
  values[3].textContent = metrics.mql5Count.toLocaleString('es-PE');

  document.querySelector('.card-count').textContent = `${sales.length} operaciones registradas.`;
  const body = document.getElementById('salesBody');
  body.replaceChildren();
  sales.slice(0, 8).forEach((sale) => {
    const row = document.createElement('tr');
    const cells = [
      new Date(`${sale.fecha}T00:00:00`).toLocaleDateString('es-PE'),
      sale.cliente,
      sale.producto,
      formatUsd(sale.monto),
      sale.canal
    ];
    cells.forEach((value, index) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (index === 3) cell.className = 'td-monto';
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
}

document.querySelectorAll('.btn-outline, .search-wrap, .icon-btn').forEach((element) => element.remove());

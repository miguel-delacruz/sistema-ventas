import { requireAuth } from './auth.js';
import { supabase } from './supabase.js';
import { calculateMetrics, formatUsd } from './sales-domain.js';

await requireAuth();
let allSales = [];

function render(sales) {
  const metrics = calculateMetrics(sales);
  const values = document.querySelectorAll('.kpi-value');
  values[0].textContent = String(metrics.total);
  values[1].textContent = formatUsd(metrics.revenue);
  const best = metrics.directRevenue >= metrics.mql5Revenue ? 'Directo' : 'MQL5';
  values[2].textContent = best;

  const total = metrics.revenue || 1;
  const directPct = (metrics.directRevenue / total) * 100;
  const mql5Pct = (metrics.mql5Revenue / total) * 100;
  document.querySelector('.donut-total').textContent = formatUsd(metrics.revenue);
  const distValues = document.querySelectorAll('.dist-val');
  const distAmounts = document.querySelectorAll('.dist-pct');
  distValues[0].textContent = `${directPct.toFixed(1)}%`;
  distValues[1].textContent = `${mql5Pct.toFixed(1)}%`;
  distValues[2].textContent = '0%';
  distAmounts[0].textContent = formatUsd(metrics.directRevenue);
  distAmounts[1].textContent = formatUsd(metrics.mql5Revenue);
  distAmounts[2].textContent = formatUsd(0);
  if (window.reportDonutChart) {
    window.reportDonutChart.data.datasets[0].data = [directPct, mql5Pct, 0];
    window.reportDonutChart.update();
  }
}

async function load() {
  const { data, error } = await supabase.from('ventas').select('*').order('fecha');
  if (error) {
    console.error('No se pudieron cargar reportes:', error.message);
    return;
  }
  allSales = data;
  render(allSales);
}

function filterBy(label) {
  const now = new Date();
  const start = new Date(now);
  if (label === 'Hoy') start.setHours(0, 0, 0, 0);
  else if (label === '7 días') start.setDate(now.getDate() - 6);
  else if (label === '30 días') start.setDate(now.getDate() - 29);
  else if (label === 'Mes en curso') start.setDate(1);
  else if (label === 'Trimestre') start.setMonth(now.getMonth() - 2, 1);
  else if (label === 'Año') start.setMonth(0, 1);
  else return render(allSales);
  render(allSales.filter((sale) => new Date(`${sale.fecha}T00:00:00`) >= start));
}

document.querySelectorAll('.filter-pill').forEach((button) => {
  button.addEventListener('click', () => filterBy(button.textContent.trim()));
});
const actionButtons = document.querySelectorAll('.top-actions button');
actionButtons[0]?.addEventListener('click', load);
actionButtons[1]?.addEventListener('click', () => window.print());
actionButtons[2]?.remove();
document.querySelectorAll('.search-wrap, .icon-btn').forEach((element) => element.remove());
await load();

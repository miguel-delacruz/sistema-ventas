import { createClient } from '@supabase/supabase-js';
import { formatComplaintCode, validateComplaint } from '../js/complaints-domain.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sendCopy({ complaint, code, createdAt }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RECLAMACIONES_FROM_EMAIL;
  if (!apiKey || !from) return Promise.resolve(false);

  const provider = escapeHtml(process.env.VITE_PROVIDER_LEGAL_NAME || 'POPEY GROUP SRL');
  const html = `
    <h1>Hoja de Reclamación ${escapeHtml(code)}</h1>
    <p><strong>Proveedor:</strong> ${provider}</p>
    <p><strong>Fecha:</strong> ${escapeHtml(new Date(createdAt).toLocaleString('es-PE'))}</p>
    <p><strong>Tipo:</strong> ${escapeHtml(complaint.tipo)}</p>
    <p><strong>Consumidor:</strong> ${escapeHtml(complaint.nombre)}</p>
    <p><strong>Producto o servicio:</strong> ${escapeHtml(complaint.bien_descripcion)}</p>
    <p><strong>Detalle:</strong> ${escapeHtml(complaint.detalle)}</p>
    <p><strong>Pedido:</strong> ${escapeHtml(complaint.pedido)}</p>
    <hr>
    <p>El proveedor responderá en un plazo máximo improrrogable de 15 días hábiles.</p>
  `;

  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [complaint.email],
      subject: `Hoja de Reclamación ${code}`,
      html
    })
  }).then((response) => response.ok);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const complaint = request.body ?? {};
  if (complaint.website) return response.status(400).json({ error: 'Invalid submission' });
  const validation = validateComplaint(complaint);
  if (!validation.valid) {
    return response.status(400).json({ error: 'Datos incompletos', fields: validation.errors });
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return response.status(503).json({ error: 'Servicio no configurado' });

  const record = {
    tipo: complaint.tipo,
    nombre: complaint.nombre.trim(),
    tipo_documento: complaint.tipo_documento,
    documento: complaint.documento.trim(),
    domicilio: complaint.domicilio.trim(),
    telefono: complaint.telefono.trim(),
    email: complaint.email.trim().toLowerCase(),
    es_menor: Boolean(complaint.es_menor),
    representante_nombre: complaint.es_menor ? complaint.representante_nombre.trim() : null,
    representante_domicilio: complaint.es_menor ? complaint.representante_domicilio.trim() : null,
    representante_telefono: complaint.es_menor ? complaint.representante_telefono.trim() : null,
    representante_email: complaint.es_menor ? complaint.representante_email.trim().toLowerCase() : null,
    bien_tipo: complaint.bien_tipo,
    bien_descripcion: complaint.bien_descripcion.trim(),
    monto: Number(complaint.monto),
    detalle: complaint.detalle.trim(),
    pedido: complaint.pedido.trim(),
    medio_respuesta: complaint.medio_respuesta,
    conformidad: true
  };

  try {
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await supabase.from('reclamaciones').insert(record).select('numero,created_at').single();
    if (error) throw error;

    const code = formatComplaintCode(data.numero, new Date(data.created_at));
    const emailSent = await sendCopy({ complaint: record, code, createdAt: data.created_at });
    console.info(JSON.stringify({
      level: 'info',
      event: 'complaint_created',
      code,
      type: record.tipo,
      email_sent: emailSent
    }));

    return response.status(201).json({
      status: 'created',
      code,
      created_at: data.created_at,
      email_sent: emailSent
    });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', event: 'complaint_failed', reason: error.message }));
    return response.status(500).json({ error: 'No se pudo registrar la hoja de reclamación' });
  }
}

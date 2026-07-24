import { createClient } from '@supabase/supabase-js';

export default async function handler(_request, response) {
  const startedAt = Date.now();
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(JSON.stringify({ level: 'error', event: 'health_check', reason: 'missing_configuration' }));
    return response.status(503).json({
      status: 'degraded',
      database: 'not_configured',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { error } = await supabase.from('ventas').select('id').limit(1);
    if (error) throw error;
    const durationMs = Date.now() - startedAt;
    console.info(JSON.stringify({ level: 'info', event: 'health_check', database: 'connected', duration_ms: durationMs }));
    return response.status(200).json({
      status: 'ok',
      database: 'connected',
      version: '1.0.0',
      duration_ms: durationMs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', event: 'health_check', reason: error.message }));
    return response.status(503).json({
      status: 'degraded',
      database: 'unavailable',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
}

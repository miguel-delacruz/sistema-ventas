import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  if (!process.env.CRON_SECRET || request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn(JSON.stringify({ level: 'warn', event: 'backup_rejected' }));
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  try {
    const { data: sales, error: readError } = await supabase.from('ventas').select('*').order('created_at');
    if (readError) throw readError;
    const { data: complaints, error: complaintsError } = await supabase
      .from('reclamaciones')
      .select('*')
      .order('created_at');
    if (complaintsError) throw complaintsError;

    const bucket = 'backups';
    const { error: bucketError } = await supabase.storage.createBucket(bucket, { public: false });
    if (bucketError && !bucketError.message.toLowerCase().includes('already exists')) throw bucketError;

    const timestamp = new Date().toISOString().replaceAll(':', '-');
    const fileName = `ventas-${timestamp}.json`;
    const payload = JSON.stringify({
      generated_at: new Date().toISOString(),
      ventas_count: sales.length,
      reclamaciones_count: complaints.length,
      ventas: sales,
      reclamaciones: complaints
    }, null, 2);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, payload, { contentType: 'application/json', upsert: false });
    if (uploadError) throw uploadError;

    const { data: files } = await supabase.storage.from(bucket).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    const expired = (files ?? []).slice(7).map((file) => file.name);
    if (expired.length) await supabase.storage.from(bucket).remove(expired);

    console.info(JSON.stringify({
      level: 'info',
      event: 'backup_completed',
      file: fileName,
      sales: sales.length,
      complaints: complaints.length
    }));
    return response.status(200).json({
      status: 'ok',
      file: fileName,
      sales: sales.length,
      complaints: complaints.length
    });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', event: 'backup_failed', reason: error.message }));
    return response.status(500).json({ status: 'error', message: 'Backup failed' });
  }
}

import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data, error } = await supabase.from('ventas').select('*').order('created_at');
if (error) throw error;
const { data: complaints, error: complaintsError } = await supabase
  .from('reclamaciones')
  .select('*')
  .order('created_at');
if (complaintsError) throw complaintsError;

await mkdir('backups', { recursive: true });
const file = `backups/ventas-${new Date().toISOString().replaceAll(':', '-')}.json`;
await writeFile(file, JSON.stringify({
  generated_at: new Date().toISOString(),
  ventas_count: data.length,
  reclamaciones_count: complaints.length,
  ventas: data,
  reclamaciones: complaints
}, null, 2));
console.info(`Backup creado: ${file} (${data.length} ventas, ${complaints.length} reclamaciones)`);

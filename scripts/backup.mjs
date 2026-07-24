import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data, error } = await supabase.from('ventas').select('*').order('created_at');
if (error) throw error;

await mkdir('backups', { recursive: true });
const file = `backups/ventas-${new Date().toISOString().replaceAll(':', '-')}.json`;
await writeFile(file, JSON.stringify({ generated_at: new Date().toISOString(), count: data.length, ventas: data }, null, 2));
console.info(`Backup creado: ${file} (${data.length} ventas)`);

import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const file = process.argv[2];
if (!file) throw new Error('Uso: npm run restore -- backups/archivo.json');
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
}

const backup = JSON.parse(await readFile(file, 'utf8'));
if (!Array.isArray(backup.ventas)) throw new Error('El archivo no contiene una lista de ventas válida.');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});
const { error } = await supabase.from('ventas').upsert(backup.ventas, { onConflict: 'id' });
if (error) throw error;
console.info(`Restauradas ${backup.ventas.length} ventas desde ${file}`);

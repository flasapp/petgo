import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep a margin below the applicable Google Cloud quotas.
export const quotaFilename = fileURLToPath(new URL('../.gopet-local/google-usage.json', import.meta.url));

export function createQuotaStore(path, limit) {
  let queue = Promise.resolve();
  return (kind) => {
    const operation = queue.then(async () => {
      const month = new Date().toISOString().slice(0, 7);
      let usage = { month, counts: {} };
      try {
        const saved = JSON.parse(await readFile(path, 'utf8'));
        if (saved.month === month) usage = saved;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const count = usage.counts[kind] || 0;
      if (count >= limit) throw new Error('Se agotó el cupo local de Google Maps.');
      usage.counts[kind] = count + 1;
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(usage));
    });
    queue = operation.catch(() => {});
    return operation;
  };
}


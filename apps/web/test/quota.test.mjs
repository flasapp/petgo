import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createQuotaStore } from '../scripts/quota.mjs';

test('reserves and persists a separate limit for each Google request type', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'petgo-quota-'));
  try {
    const file = join(directory, 'usage.json');
    const reserve = createQuotaStore(file, 2);
    await Promise.all([reserve('routes'), reserve('routes')]);
    await assert.rejects(reserve('routes'), /cupo/);
    await reserve('autocomplete');
    await assert.rejects(createQuotaStore(file, 2)('routes'), /cupo/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

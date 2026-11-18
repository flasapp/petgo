import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlace, getRoute } from '../scripts/google.mjs';

test('explains why a street without a number cannot be used for a fuel estimate', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({
      formattedAddress: 'Carlos Roldán, Barros Blancos, Uruguay',
      location: { latitude: -34.75, longitude: -56.02 },
      addressComponents: [{ types: ['country'], shortText: 'UY' }],
      types: ['route'],
    }),
  }));

  await assert.rejects(getPlace('route-place-id', 'unused-key'), /calle o zona sin punto exacto.*número, esquina/);
});

test('accepts a numbered street address in Uruguay', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({
      formattedAddress: 'Minas 1007, Montevideo, Uruguay',
      location: { latitude: -34.9, longitude: -56.18 },
      addressComponents: [
        { types: ['street_number'], longText: '1007' },
        { types: ['country'], shortText: 'UY' },
      ],
      types: ['street_address'],
    }),
  }));

  assert.deepEqual(await getPlace('exact-place-id', 'unused-key'), {
    id: 'exact-place-id',
    address: 'Minas 1007, Montevideo, Uruguay',
    coordinates: [-56.18, -34.9],
  });
});

test('reports a blocked Routes API as a service failure', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => ({
    ok: false,
    status: 403,
    json: async () => ({ error: { message: 'API is not enabled' } }),
  }));

  await assert.rejects(getRoute([-56.18, -34.9], [-56.16, -34.88], 'unused-key'), {
    message: /Routes API.*habilitada/,
    statusCode: 503,
  });
});

test('reads the driving duration returned by Routes API', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ routes: [{ distanceMeters: 4431, duration: '731.5s' }] }),
  }));

  const route = await getRoute([-56.18, -34.9], [-56.16, -34.88], 'unused-key');
  assert.equal(route.distanceMeters, 4431);
  assert.equal(route.durationSeconds, 731.5);
});

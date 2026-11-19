import test from 'node:test';
import assert from 'node:assert/strict';
import { createHumanGate, verifyTurnstile } from '../scripts/human-gate.mjs';

test('accepts only a successful Turnstile token for this hostname', async () => {
  const fetcher = async (_url, options) => {
    assert.equal(options.body.get('secret'), 'private');
    assert.equal(options.body.get('response'), 'token');
    return { ok: true, json: async () => ({ success: true, hostname: 'gopet.example' }) };
  };
  assert.equal(await verifyTurnstile('token', 'private', 'gopet.example', fetcher), true);
  assert.equal(await verifyTurnstile('token', 'private', 'other.example', fetcher), false);
  assert.equal(await verifyTurnstile('', 'private', 'gopet.example', fetcher), false);
});

test('requires a fresh verification and limits Google requests per session', () => {
  let time = 0;
  const gate = createHumanGate(() => time);
  const response = { setHeader: (_name, value) => { response.cookie = value.split(';')[0]; } };
  const request = { headers: { cookie: '' } };
  assert.equal(gate.consume(request, 'autocomplete').status, 403);
  gate.issue(response);
  request.headers.cookie = response.cookie;
  for (let count = 0; count < 40; count += 1) assert.equal(gate.consume(request, 'autocomplete'), null);
  assert.equal(gate.consume(request, 'autocomplete').status, 429);
  for (let count = 0; count < 3; count += 1) assert.equal(gate.consume(request, 'estimate'), null);
  assert.equal(gate.consume(request, 'estimate').status, 429);
  time = 10 * 60 * 1000;
  assert.equal(gate.consume(request, 'estimate').status, 403);
});

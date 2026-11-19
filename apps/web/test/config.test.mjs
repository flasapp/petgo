import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readConfig } from '../scripts/config.mjs';

const example = Object.fromEntries(readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
  .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
const validConfig = { ...example, BASE_PLACE_ID: 'test-base-place-id' };

test('loads business values from environment configuration', () => {
  const config = readConfig(validConfig);
  assert.deepEqual(config.fuel, { cityKmPerLiter: 11, roadKmPerLiter: 15, priceUYUPerLiter: 95 });
  assert.equal(config.laborUYUPerHour, 400);
  assert.equal(config.montevideoMarkupPercent, 30);
  assert.equal(config.minimumSaleUYU, 600);
  assert.equal(config.googleMonthlyLimit, 9000);
  assert.equal(config.googleKey, undefined);
  assert.equal(config.enableMap, false);
  assert.equal(config.enableMessage, false);
  assert.equal(config.humanCheckEnabled, true);
  assert.equal(config.turnstileSiteKey, undefined);
});

test('shows optional map and message only when explicitly enabled', () => {
  const { ENABLE_MAP: _map, ENABLE_MESSAGE: _message, ...withoutFlags } = validConfig;
  assert.equal(readConfig(withoutFlags).enableMap, false);
  assert.equal(readConfig(withoutFlags).enableMessage, false);
  assert.equal(readConfig({ ...validConfig, ENABLE_MAP: 'true', ENABLE_MESSAGE: 'true' }).enableMap, true);
  assert.equal(readConfig({ ...validConfig, ENABLE_MAP: 'true', ENABLE_MESSAGE: 'true' }).enableMessage, true);
  assert.equal(readConfig({ ...validConfig, ENABLE_MAP: 'TRUE', ENABLE_MESSAGE: '1' }).enableMap, false);
  assert.equal(readConfig({ ...validConfig, ENABLE_MAP: 'TRUE', ENABLE_MESSAGE: '1' }).enableMessage, false);
});

test('allows disabling Turnstile with CHEK_IS_HUMAN=false', () => {
  const config = readConfig({ ...validConfig, CHEK_IS_HUMAN: 'false', TURNSTILE_SITE_KEY: '<unused>' });
  assert.equal(config.humanCheckEnabled, false);
  assert.equal(config.turnstileSiteKey, undefined);
  assert.equal(config.turnstileSecretKey, undefined);
});

test('rejects missing or invalid configuration before serving prices', () => {
  assert.throws(() => readConfig(example), /BASE_PLACE_ID/);
  assert.throws(() => readConfig({ ...validConfig, FUEL_PRICE_UYU_PER_LITER: '' }), /FUEL_PRICE_UYU_PER_LITER/);
  assert.throws(() => readConfig({ ...validConfig, LABOR_UYU_PER_HOUR: '-1' }), /LABOR_UYU_PER_HOUR/);
  assert.throws(() => readConfig({ ...validConfig, MONTEVIDEO_MARKUP_PERCENT: 'abc' }), /MONTEVIDEO_MARKUP_PERCENT/);
  assert.throws(() => readConfig({ ...validConfig, TURNSTILE_SITE_KEY: '<script>' }), /TURNSTILE_SITE_KEY/);
  assert.throws(() => readConfig({ ...validConfig, CHEK_IS_HUMAN: 'yes' }), /CHEK_IS_HUMAN/);
});

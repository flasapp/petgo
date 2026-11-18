function requiredText(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Falta ${name} en .env.`);
  return value;
}

function number(env, name, { positive = false, integer = false } = {}) {
  const raw = requiredText(env, name);
  const value = Number(raw);
  if (!Number.isFinite(value) || (positive ? value <= 0 : value < 0) || (integer && !Number.isSafeInteger(value))) {
    throw new Error(`${name} debe ser un número ${positive ? 'mayor que cero' : 'no negativo'}${integer ? ' entero' : ''}.`);
  }
  return value;
}

function publicKey(env, name) {
  const value = env[name]?.trim();
  if (value && !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error(`${name} contiene caracteres no válidos.`);
  return value || undefined;
}

function checkIsHuman(env) {
  const value = env.CHEK_IS_HUMAN?.trim().toLowerCase() || 'true';
  if (value !== 'true' && value !== 'false') throw new Error('CHEK_IS_HUMAN debe ser true o false.');
  return value === 'true';
}

export function readConfig(env) {
  const whatsappNumber = requiredText(env, 'WHATSAPP_NUMBER');
  if (!/^\d{8,15}$/.test(whatsappNumber)) throw new Error('WHATSAPP_NUMBER debe contener solo dígitos, con código de país.');
  const port = number(env, 'PORT', { positive: true, integer: true });
  if (port > 65535) throw new Error('PORT debe estar entre 1 y 65535.');
  const basePlaceId = requiredText(env, 'BASE_PLACE_ID');
  if (basePlaceId.length > 300) throw new Error('BASE_PLACE_ID es demasiado largo.');
  const humanCheckEnabled = checkIsHuman(env);

  return Object.freeze({
    port,
    googleKey: env.GOOGLE_MAPS_API_KEY?.trim() || undefined,
    humanCheckEnabled,
    turnstileSiteKey: humanCheckEnabled ? publicKey(env, 'TURNSTILE_SITE_KEY') : undefined,
    turnstileSecretKey: humanCheckEnabled ? env.TURNSTILE_SECRET_KEY?.trim() || undefined : undefined,
    basePlaceId,
    whatsappNumber,
    googleMonthlyLimit: number(env, 'GOOGLE_MONTHLY_LIMIT', { positive: true, integer: true }),
    fuel: Object.freeze({
      cityKmPerLiter: number(env, 'FUEL_CITY_KM_PER_LITER', { positive: true }),
      roadKmPerLiter: number(env, 'FUEL_ROAD_KM_PER_LITER', { positive: true }),
      priceUYUPerLiter: number(env, 'FUEL_PRICE_UYU_PER_LITER', { positive: true }),
    }),
    laborUYUPerHour: number(env, 'LABOR_UYU_PER_HOUR', { positive: true }),
    montevideoMarkupPercent: number(env, 'MONTEVIDEO_MARKUP_PERCENT'),
    minimumSaleUYU: number(env, 'MINIMUM_SALE_UYU'),
  });
}

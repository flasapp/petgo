import 'dotenv/config';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConfig } from './config.mjs';
import { buildCircuit, calculateFuel, calculateLaborCost, calculateSalePrice, calculateWait, classifyTrip, isMontevideo, splitRouteDistance } from './fuel.mjs';
import { getPlace, getRoute, suggestPlaces } from './google.mjs';
import { createHumanGate, verifyTurnstile } from './human-gate.mjs';
import { createQuotaStore, quotaFilename } from './quota.mjs';

const root = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const boundary = JSON.parse(await readFile(new URL('../data/montevideo.geojson', import.meta.url), 'utf8')).features[0];
const config = readConfig(process.env);
const { port, googleKey, basePlaceId } = config;
const host = process.env.HOST || '127.0.0.1';
const reserveGoogleRequest = createQuotaStore(quotaFilename, config.googleMonthlyLimit);
const humanGate = createHumanGate();
let baseCoordinates;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  let text = '';
  for await (const chunk of request) {
    text += chunk;
    if (text.length > 4096) throw new Error('La solicitud es demasiado grande.');
  }
  return JSON.parse(text);
}

async function place(id, label) {
  if (typeof id !== 'string' || !id || id.length > 300) throw new Error('Seleccioná una dirección sugerida.');
  await reserveGoogleRequest('placeDetails');
  try {
    return await getPlace(id, googleKey);
  } catch (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

async function estimateTrip(input, onProgress = () => {}) {
  const roundTrip = input.roundTrip === true;
  const wait = calculateWait(roundTrip ? input.waitMinutes : 0);
  const hasOtherReturn = roundTrip && input.returnId && input.returnId !== input.originId;
  const legCount = roundTrip ? 4 : 3;
  const needsBase = !baseCoordinates;
  const stepCount = 2 + (hasOtherReturn ? 1 : 0) + (needsBase ? 1 : 0) + legCount;
  let completedSteps = 0;
  const progress = (message) => onProgress({ type: 'progress', percent: Math.round(completedSteps / stepCount * 94), message });
  const advance = (message) => { completedSteps += 1; progress(message); };
  progress('Verificando las direcciones…');
  const origin = await place(input.originId, 'Origen');
  advance('Origen verificado. Buscando el destino…');
  const destination = await place(input.destinationId, 'Destino');
  advance('Destino verificado. Preparando el recorrido…');
  const lastStop = hasOtherReturn ? await place(input.returnId, 'Destino final de la vuelta') : origin;
  if (hasOtherReturn) advance('Destino de la vuelta verificado.');
  const customerStops = roundTrip ? [origin, destination, lastStop] : [origin, destination];
  const zone = classifyTrip(customerStops.map((stop) => stop.coordinates), boundary);
  if (!zone) {
    throw new Error('Este recorrido requiere consulta manual: ningún punto está en Montevideo.');
  }
  if (needsBase) {
    await reserveGoogleRequest('placeDetails');
    baseCoordinates = (await getPlace(basePlaceId, googleKey)).coordinates;
    if (!isMontevideo(baseCoordinates, boundary)) {
      baseCoordinates = undefined;
      throw new Error('No se pudo calcular este recorrido. Consultá por WhatsApp.');
    }
    advance('Base ubicada. Calculando los tramos…');
  }
  const points = buildCircuit(baseCoordinates, origin.coordinates, destination.coordinates, roundTrip ? lastStop.coordinates : undefined);
  const labels = roundTrip
    ? ['Hasta la recogida', 'Traslado de ida', 'Traslado de vuelta', 'Regreso a base']
    : ['Hasta la recogida', 'Traslado', 'Regreso a base'];
  const legs = [];
  for (let index = 0; index < labels.length; index += 1) {
    if (points[index][0] === points[index + 1][0] && points[index][1] === points[index + 1][1]) {
      legs.push({ label: labels[index], distanceMeters: 0, durationSeconds: 0, cityMeters: 0, roadMeters: 0 });
      advance(`Tramo ${index + 1} de ${labels.length} calculado.`);
      continue;
    }
    await reserveGoogleRequest('routes');
    const route = await getRoute(points[index], points[index + 1], googleKey);
    legs.push({ label: labels[index], distanceMeters: route.distanceMeters, durationSeconds: route.durationSeconds, ...splitRouteDistance(route, boundary) });
    advance(`Tramo ${index + 1} de ${labels.length} calculado.`);
  }
  const fuel = calculateFuel(legs, config.fuel);
  const durationSeconds = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0);
  const labor = calculateLaborCost(durationSeconds, wait.requestedMinutes, config.laborUYUPerHour);
  const cost = {
    fuelUYU: fuel.costUYU,
    drivingUYU: labor.drivingUYU,
    waitingUYU: labor.waitingUYU,
    totalUYU: fuel.costUYU + labor.totalUYU,
  };
  let mapUrl;
  if (config.enableMap) {
    mapUrl = new URL('https://www.google.com/maps/embed/v1/directions');
    mapUrl.search = new URLSearchParams({
      key: googleKey,
      origin: `place_id:${origin.id}`,
      destination: `place_id:${destination.id}`,
      mode: 'driving',
      language: 'es',
      region: 'uy',
    }).toString();
  }
  return {
    zone,
    ...(mapUrl ? { mapUrl: mapUrl.href } : {}),
    legs: legs.map(({ label, distanceMeters, durationSeconds: seconds }) => ({ label, meters: distanceMeters, seconds })),
    ...fuel,
    durationSeconds,
    roundTrip,
    wait,
    drivingAndWaitSeconds: durationSeconds + wait.requestedMinutes * 60,
    laborRateUYUPerHour: config.laborUYUPerHour,
    cost,
    sale: zone === 'Montevideo' ? calculateSalePrice(cost.totalUYU, config.montevideoMarkupPercent, config.minimumSaleUYU) : null,
    tollsPending: zone === 'Interior',
  };
}

createServer(async (request, response) => {

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  if (pathname.startsWith('/api/')) {
    try {
      if (pathname === '/api/verify-human' && request.method === 'POST') {
        if (!config.humanCheckEnabled) return json(response, 404, { error: 'La verificación está desactivada.' });
        if (!config.turnstileSecretKey || !config.turnstileSiteKey) return json(response, 503, { error: 'La verificación no está configurada. Consultá por WhatsApp.' });
        const hostname = new URL(`http://${request.headers.host}`).hostname;
        const { token } = await readJson(request);
        if (!await verifyTurnstile(token, config.turnstileSecretKey, hostname)) {
          return json(response, 403, { error: 'La verificación no se completó. Intentá de nuevo.' });
        }
        humanGate.issue(response);
        return json(response, 200, { verified: true });
      }
      if (!googleKey) return json(response, 503, { error: 'Falta la clave de Google Maps. Pegala después de GOOGLE_MAPS_API_KEY= en el archivo .env y reiniciá la web; mientras tanto podés consultar por WhatsApp.' });
      if (config.humanCheckEnabled && (!config.turnstileSecretKey || !config.turnstileSiteKey)) return json(response, 503, { error: 'La verificación no está configurada. Consultá por WhatsApp.' });
      if (pathname === '/api/places' && request.method === 'GET') {
        const query = new URL(request.url, 'http://localhost').searchParams.get('q')?.trim();
        if (!query || (query.match(/\p{L}/gu)?.length ?? 0) < 3 || query.length > 120) return json(response, 200, { suggestions: [] });
        const denied = config.humanCheckEnabled && humanGate.consume(request, 'autocomplete');
        if (denied) return json(response, denied.status, { error: denied.error });
        await reserveGoogleRequest('autocomplete');
        return json(response, 200, { suggestions: await suggestPlaces(query, googleKey) });
      }
      if (pathname === '/api/fuel-estimate' && request.method === 'POST') {
        const denied = config.humanCheckEnabled && humanGate.consume(request, 'estimate');
        if (denied) return json(response, denied.status, { error: denied.error });
        return json(response, 200, await estimateTrip(await readJson(request)));
      }
      if (pathname === '/api/fuel-estimate-stream' && request.method === 'POST') {
        const denied = config.humanCheckEnabled && humanGate.consume(request, 'estimate');
        if (denied) return json(response, denied.status, { error: denied.error });
        const input = await readJson(request);
        response.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' });
        response.flushHeaders();
        const send = (event) => { if (!response.destroyed) response.write(`${JSON.stringify(event)}\n`); };
        try {
          send({ type: 'progress', percent: 0, message: 'Iniciando el cálculo…' });
          const result = await estimateTrip(input, send);
          send({ type: 'result', percent: 100, result });
        } catch (error) {
          send({ type: 'error', error: error.message || 'No se pudo calcular la ruta.' });
        }
        response.end();
        return;
      }
      return json(response, 405, { error: 'Operación no admitida.' });
    } catch (error) {
      return json(response, error.statusCode || 422, { error: error.message || 'No se pudo calcular la ruta.' });
    }
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }

  try {
    const content = file === resolve(root, 'index.html')
      ? (await readFile(file, 'utf8'))
        .replace('__WHATSAPP_NUMBER__', config.whatsappNumber)
        .replace('__CHECK_IS_HUMAN__', String(config.humanCheckEnabled))
        .replace('__ENABLE_MAP__', String(config.enableMap))
        .replace('__ENABLE_MESSAGE__', String(config.enableMessage))
        .replace('__TURNSTILE_SITE_KEY__', config.turnstileSiteKey || '')
      : await readFile(file);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500).end();
  }
}).listen(port, host, () => {
  console.log(`GoPet disponible en http://${host}:${port}`);
  if (!googleKey) console.warn('Google Maps desactivado: pegá la clave en .env y reiniciá el servidor.');
});

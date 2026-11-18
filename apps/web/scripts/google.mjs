const placesBase = 'https://places.googleapis.com/v1';
const routesUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';

function serviceUnavailable(message) {
  const error = new Error(message);
  error.statusCode = 503;
  return error;
}

async function googleRequest(url, key, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, ...options.headers },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const api = url === routesUrl ? 'Routes API' : 'Places API';
    if (/billing/i.test(data.error?.message || '')) {
      throw serviceUnavailable(`Falta activar la facturación del proyecto de Google Cloud para usar ${api}.`);
    }
    if (response.status === 403 || response.status === 429 || response.status >= 500) {
      throw serviceUnavailable(`Google rechazó ${api} (${response.status}). Revisá que esté habilitada y que la clave tenga permiso para usarla.`);
    }
    throw new Error(`Google respondió ${response.status} al consultar ${api}.`);
  }
  return response.json();
}

export async function suggestPlaces(query, key) {
  const data = await googleRequest(`${placesBase}/places:autocomplete`, key, {
    method: 'POST',
    body: JSON.stringify({ input: query, includedRegionCodes: ['uy'], languageCode: 'es', regionCode: 'uy' }),
  });
  return (data.suggestions || []).flatMap(({ placePrediction }) => placePrediction ? [{
    id: placePrediction.placeId,
    label: placePrediction.text?.text || '',
  }] : []);
}

export async function getPlace(id, key) {
  const data = await googleRequest(`${placesBase}/places/${encodeURIComponent(id)}`, key, {
    headers: { 'X-Goog-FieldMask': 'formattedAddress,location,addressComponents,types' },
  });
  const country = data.addressComponents?.find((part) => part.types?.includes('country'))?.shortText;
  const hasNumber = data.addressComponents?.some((part) => part.types?.includes('street_number'));
  const preciseType = data.types?.some((type) => ['street_address', 'premise', 'subpremise', 'point_of_interest', 'establishment', 'intersection'].includes(type));
  if (country !== 'UY' || !Number.isFinite(data.location?.latitude) || !Number.isFinite(data.location?.longitude)) {
    throw new Error('La dirección no se pudo verificar en Uruguay.');
  }
  if (!(hasNumber || preciseType)) {
    throw new Error('Google encontró una calle o zona sin punto exacto. Agregá número, esquina o elegí un lugar concreto de las sugerencias.');
  }
  return { id, address: data.formattedAddress, coordinates: [data.location.longitude, data.location.latitude] };
}

export async function getRoute(from, to, key) {
  const waypoint = (coordinates) => ({ location: { latLng: { latitude: coordinates[1], longitude: coordinates[0] } } });
  const data = await googleRequest(routesUrl, key, {
    method: 'POST',
    headers: { 'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.geoJsonLinestring' },
    body: JSON.stringify({
      origin: waypoint(from), destination: waypoint(to), travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE', polylineQuality: 'HIGH_QUALITY',
      polylineEncoding: 'GEO_JSON_LINESTRING',
    }),
  });
  const route = data.routes?.[0];
  if (!route) throw new Error('Google no encontró una ruta por carretera.');
  if (!/^\d+(?:\.\d+)?s$/.test(route.duration || '')) throw new Error('Google no devolvió una duración verificable para la ruta.');
  return { ...route, durationSeconds: Number(route.duration.slice(0, -1)) };
}

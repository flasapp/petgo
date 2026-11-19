import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { lineSplit } from '@turf/line-split';
import { polygonToLine } from '@turf/polygon-to-line';
import { length } from '@turf/length';
import { lineString, point } from '@turf/helpers';

export function calculateLaborCost(drivingSeconds, waitMinutes, hourlyRateUYU) {
  if (!Number.isFinite(drivingSeconds) || drivingSeconds < 0 || !Number.isSafeInteger(waitMinutes) || waitMinutes < 0 || !Number.isFinite(hourlyRateUYU) || hourlyRateUYU <= 0) {
    throw new Error('El tiempo de trabajo no es válido.');
  }
  const drivingUYU = drivingSeconds * hourlyRateUYU / 3600;
  const waitingUYU = waitMinutes * hourlyRateUYU / 60;
  return { drivingUYU, waitingUYU, totalUYU: drivingUYU + waitingUYU };
}

export function calculateSalePrice(pricingBaseUYU, markupPercent, minimumUYU) {
  if (![pricingBaseUYU, markupPercent, minimumUYU].every(Number.isFinite) || pricingBaseUYU < 0 || markupPercent < 0 || minimumUYU < 0) {
    throw new Error('Los valores del precio no son válidos.');
  }
  const markupUYU = pricingBaseUYU * markupPercent / 100;
  const beforeMinimumUYU = pricingBaseUYU + markupUYU;
  const withMinimumUYU = Math.max(minimumUYU, beforeMinimumUYU);
  const priceUYU = Math.ceil(withMinimumUYU / 5) * 5;
  return {
    markupPercent,
    markupUYU,
    beforeMinimumUYU,
    minimumUYU,
    minimumAdjustmentUYU: withMinimumUYU - beforeMinimumUYU,
    roundingAdjustmentUYU: priceUYU - withMinimumUYU,
    priceUYU,
  };
}

export function calculateWait(waitMinutes) {
  if (!Number.isSafeInteger(waitMinutes) || waitMinutes < 0 || waitMinutes > Number.MAX_SAFE_INTEGER / 60) {
    throw new Error('Indicá la espera en minutos enteros, desde 0.');
  }
  return { requestedMinutes: waitMinutes };
}

export function isMontevideo(coordinates, boundary) {
  return booleanPointInPolygon(point(coordinates), boundary);
}

export function classifyTrip(stops, boundary) {
  const locations = stops.map((stop) => isMontevideo(stop, boundary));
  if (!locations.some(Boolean)) return null;
  return locations.every(Boolean) ? 'Montevideo' : 'Interior';
}

export function buildCircuit(base, origin, destination, returnDestination) {
  return returnDestination
    ? [base, origin, destination, returnDestination, base]
    : [base, origin, destination, base];
}

export function splitRouteDistance(route, boundary) {
  const coordinates = route.polyline?.geoJsonLinestring?.coordinates;
  if (!Number.isFinite(route.distanceMeters) || route.distanceMeters < 0 || !Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error('La ruta no tiene distancia o geometría verificable.');
  }
  const line = lineString(coordinates);
  const split = lineSplit(line, polygonToLine(boundary)).features;
  const pieces = split.length ? split : [line];
  let cityGeometryKm = 0;
  let roadGeometryKm = 0;
  for (const piece of pieces) {
    const km = length(piece, { units: 'kilometers' });
    const points = piece.geometry.coordinates;
    const middleIndex = Math.floor((points.length - 1) / 2);
    const middle = [
      (points[middleIndex][0] + points[middleIndex + 1][0]) / 2,
      (points[middleIndex][1] + points[middleIndex + 1][1]) / 2,
    ];
    if (isMontevideo(middle, boundary)) cityGeometryKm += km;
    else roadGeometryKm += km;
  }
  const geometryKm = cityGeometryKm + roadGeometryKm;
  if (!geometryKm) throw new Error('No se pudo separar la ruta por departamento.');
  const cityMeters = route.distanceMeters * cityGeometryKm / geometryKm;
  return { cityMeters, roadMeters: route.distanceMeters - cityMeters };
}

export function calculateFuel(legs, config) {
  const meters = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  const cityMeters = legs.reduce((sum, leg) => sum + leg.cityMeters, 0);
  const roadMeters = meters - cityMeters;
  const liters = cityMeters / 1000 / config.cityKmPerLiter + roadMeters / 1000 / config.roadKmPerLiter;
  return { meters, cityMeters, roadMeters, liters, costUYU: Math.ceil(liters * config.priceUYUPerLiter) };
}

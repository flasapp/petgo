import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCircuit, calculateFuel, calculateLaborCost, calculateSalePrice, calculateWait, classifyTrip, isMontevideo, splitRouteDistance } from '../scripts/fuel.mjs';

const boundary = {
  type: 'Feature', properties: {},
  geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
};
const route = (distanceMeters, coordinates) => ({
  distanceMeters, polyline: { geoJsonLinestring: { type: 'LineString', coordinates } },
});
const fuelConfig = { cityKmPerLiter: 11, roadKmPerLiter: 15, priceUYUPerLiter: 95 };

test('classifies endpoints against the department boundary', () => {
  assert.equal(isMontevideo([0.5, 0.5], boundary), true);
  assert.equal(isMontevideo([1.5, 0.5], boundary), false);
});

test('classifies a return destination and requires one Montevideo customer stop', () => {
  assert.equal(classifyTrip([[0.2, 0.2], [0.8, 0.8]], boundary), 'Montevideo');
  assert.equal(classifyTrip([[0.2, 0.2], [1.2, 0.8]], boundary), 'Interior');
  assert.equal(classifyTrip([[1.2, 0.2], [1.2, 0.8], [0.2, 0.8]], boundary), 'Interior');
  assert.equal(classifyTrip([[1.2, 0.2], [1.2, 0.8]], boundary), null);
});

test('builds one-way and round-trip circuits including return to base', () => {
  assert.deepEqual(buildCircuit('B', 'O', 'D'), ['B', 'O', 'D', 'B']);
  assert.deepEqual(buildCircuit('B', 'O', 'D', 'R'), ['B', 'O', 'D', 'R', 'B']);
  assert.deepEqual(buildCircuit('B', 'O', 'D', 'O'), ['B', 'O', 'D', 'O', 'B']);
});

test('splits road distance when a route crosses the boundary', () => {
  const split = splitRouteDistance(route(1000, [[-0.5, 0.5], [0.5, 0.5], [1.5, 0.5]]), boundary);
  assert.ok(Math.abs(split.cityMeters - 500) < 0.01);
  assert.equal(split.cityMeters + split.roadMeters, 1000);
});

test('keeps routes wholly inside or outside the boundary intact', () => {
  assert.equal(splitRouteDistance(route(1000, [[0.2, 0.2], [0.8, 0.8]]), boundary).cityMeters, 1000);
  assert.equal(splitRouteDistance(route(1000, [[1.2, 0.2], [1.8, 0.8]]), boundary).roadMeters, 1000);
});

test('uses the bundled official Montevideo boundary', () => {
  const official = JSON.parse(readFileSync(new URL('../data/montevideo.geojson', import.meta.url), 'utf8')).features[0];
  assert.equal(isMontevideo([-56.2, -34.9], official), true);
  assert.equal(isMontevideo([-55.9, -34.9], official), false);
  const split = splitRouteDistance(route(50000, [[-56.25, -34.85], [-55.9, -34.85]]), official);
  assert.ok(split.cityMeters > 0 && split.roadMeters > 0);
  assert.equal(split.cityMeters + split.roadMeters, 50000);
});

test('calculates both fuel yields and rounds only the final UYU cost upward', () => {
  const fuel = calculateFuel([
    { distanceMeters: 11000, cityMeters: 11000 },
    { distanceMeters: 15000, cityMeters: 0 },
  ], fuelConfig);
  assert.equal(fuel.meters, 26000);
  assert.equal(fuel.liters, 2);
  assert.equal(fuel.costUYU, 190);
  assert.equal(calculateFuel([{ distanceMeters: 1000, cityMeters: 1000 }], fuelConfig).costUYU, 9);
});

test('separates driving and waiting labor before applying a 30 percent markup and UYU 600 minimum', () => {
  const labor = calculateLaborCost(3600, 90, 400);
  assert.deepEqual(labor, { drivingUYU: 400, waitingUYU: 600, totalUYU: 1000 });
  assert.deepEqual(calculateSalePrice(1000, 30, 600), {
    markupPercent: 30, markupUYU: 300, beforeMinimumUYU: 1300,
    minimumUYU: 600, minimumAdjustmentUYU: 0, priceUYU: 1300,
  });
  assert.equal(calculateSalePrice(100, 30, 600).priceUYU, 600);
  assert.throws(() => calculateSalePrice(-1, 30, 600));
});

test('validates the entire waiting time used as labor', () => {
  assert.deepEqual(calculateWait(0), { requestedMinutes: 0 });
  assert.deepEqual(calculateWait(90), { requestedMinutes: 90 });
  assert.throws(() => calculateWait(-1));
  assert.throws(() => calculateWait(1.5));
});

test('rejects a route without verifiable geometry', () => {
  assert.throws(() => splitRouteDistance({ distanceMeters: 1000 }, boundary));
});

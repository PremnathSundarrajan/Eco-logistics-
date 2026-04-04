//Paste it directy into your backend's routes folder: E:\logistics backend 2\transport-backend\routes\carbonOptimizer.js*

'use strict';

const express = require('express');
const router  = express.Router();

// ─── OR-Tools Python Microservice Bridge ──────────────────────────────────────
// Set VRP_SERVICE_URL in your backend .env to point to the Python service.
// If not set, or if the Python service is unavailable, falls back to pure-JS.
// Example: VRP_SERVICE_URL=https://eco-logistics-solver.onrender.com
const VRP_SERVICE_URL = process.env.VRP_SERVICE_URL || null;

/**
 * Try calling the Python OR-Tools microservice.
 * Returns parsed response data on success, null on any failure.
 */
async function tryPythonSolver(payload, timeoutMs = 35000) {
  if (!VRP_SERVICE_URL) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${VRP_SERVICE_URL}/solve`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`[carbonOptimizer] Python service returned ${response.status} — falling back to JS solver`);
      return null;
    }
    const data = await response.json();
    console.log(`[carbonOptimizer] Python OR-Tools solver used (${data.executionTimeMs}ms, ${data.vehiclesUsed} vehicles)`);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[carbonOptimizer] Python service timed out — falling back to JS solver');
    } else {
      console.warn('[carbonOptimizer] Python service unavailable:', err.message, '— falling back to JS solver');
    }
    return null;
  }
}

// ─── Input Validation ─────────────────────────────────────────────────────────

function validateInput(body) {
  const errors = [];
  const { depot = 0, numVehiclesAvailable, vehicleCapacity,
          distanceMatrix, demands, timeWindows, serviceTimes } = body;

  if (typeof numVehiclesAvailable !== 'number' || numVehiclesAvailable < 1)
    errors.push('numVehiclesAvailable must be a positive integer.');

  if (typeof vehicleCapacity !== 'number' || vehicleCapacity < 1)
    errors.push('vehicleCapacity must be a positive number.');

  if (!Array.isArray(distanceMatrix) || distanceMatrix.length < 2)
    errors.push('distanceMatrix must be a 2D array with at least 2 nodes.');

  const n = Array.isArray(distanceMatrix) ? distanceMatrix.length : 0;

  if (Array.isArray(distanceMatrix)) {
    distanceMatrix.forEach((row, i) => {
      if (!Array.isArray(row) || row.length !== n)
        errors.push(`distanceMatrix[${i}] must have exactly ${n} columns.`);
    });
  }

  if (!Array.isArray(demands) || demands.length !== n)
    errors.push(`demands must be an array of length ${n}.`);

  if (!Array.isArray(timeWindows) || timeWindows.length !== n)
    errors.push(`timeWindows must be an array of [start, end] pairs of length ${n}.`);

  if (!Array.isArray(serviceTimes) || serviceTimes.length !== n)
    errors.push(`serviceTimes must be an array of length ${n}.`);

  if (typeof depot !== 'number' || depot < 0 || depot >= n)
    errors.push(`depot ${depot} is out of range.`);

  return errors;
}

// ─── Route Utilities ─────────────────────────────────────────────────────────

function routeDistance(route, matrix) {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) d += matrix[route[i]][route[i + 1]];
  return d;
}

function routeDemand(route, demands, depot) {
  return route.reduce((s, n) => (n !== depot ? s + (demands[n] || 0) : s), 0);
}

function checkTimeWindows(route, matrix, timeWindows, serviceTimes, speedKmMin) {
  let t = timeWindows[route[0]][0];
  const arrivals = [t];
  for (let k = 0; k < route.length - 1; k++) {
    const from = route[k];
    const to   = route[k + 1];
    t += matrix[from][to] / speedKmMin;
    t += serviceTimes[from] || 0;
    const [earliest, latest] = timeWindows[to];
    if (t > latest) return { feasible: false, arrivalTimes: arrivals };
    if (t < earliest) t = earliest;
    arrivals.push(t);
  }
  return { feasible: true, arrivalTimes: arrivals };
}

// ─── Phase 1: Clarke-Wright Savings ──────────────────────────────────────────

function clarkeWright({ numNodes, depot, distanceMatrix, demands,
                        vehicleCapacity, timeWindows, serviceTimes,
                        speedKmMin, numVehicles }) {

  const routes = [];
  for (let i = 0; i < numNodes; i++) {
    if (i === depot) continue;
    routes.push([depot, i, depot]);
  }

  const savings = [];
  for (let i = 0; i < numNodes; i++) {
    if (i === depot) continue;
    for (let j = i + 1; j < numNodes; j++) {
      if (j === depot) continue;
      const s = distanceMatrix[depot][i] + distanceMatrix[depot][j] - distanceMatrix[i][j];
      savings.push({ i, j, s });
    }
  }
  savings.sort((a, b) => b.s - a.s); 

  for (const { i, j } of savings) {
    if (routes.length <= 1) break;

    let ri = -1, rj = -1;
    for (let k = 0; k < routes.length; k++) {
      const r = routes[k];
      if (r[r.length - 2] === i) ri = k;
      if (r[1] === j)            rj = k;
    }
    if (ri === -1 || rj === -1 || ri === rj) continue;

    const mergedDemand = routeDemand(routes[ri], demands, depot)
                       + routeDemand(routes[rj], demands, depot);
    if (mergedDemand > vehicleCapacity) continue;

    const merged = [...routes[ri].slice(0, -1), ...routes[rj].slice(1)];

    const { feasible } = checkTimeWindows(merged, distanceMatrix, timeWindows, serviceTimes, speedKmMin);
    if (!feasible) continue;

    routes[ri] = merged;
    routes.splice(rj, 1);
  }

  if (routes.length > numVehicles) {
    routes.sort((a, b) => routeDemand(b, demands, depot) - routeDemand(a, demands, depot));
    return routes.slice(0, numVehicles);
  }

  return routes;
}

// ─── Phase 2: 2-opt Refinement Per Route ─────────────────────────────────────

function twoOpt(route, matrix, timeWindows, serviceTimes, speedKmMin) {
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        const before = matrix[route[i - 1]][route[i]] + matrix[route[j]][route[j + 1]];
        const after  = matrix[route[i - 1]][route[j]] + matrix[route[i]][route[j + 1]];
        if (after < before - 1e-9) {
          const candidate = [
            ...route.slice(0, i),
            ...route.slice(i, j + 1).reverse(),
            ...route.slice(j + 1),
          ];
          const { feasible } = checkTimeWindows(candidate, matrix, timeWindows, serviceTimes, speedKmMin);
          if (feasible) {
            route = candidate;
            improved = true;
          }
        }
      }
    }
  }
  return route;
}

// ─── Phase 3: Or-opt (Inter-route single-stop relocation) ────────────────────

function orOpt(routes, matrix, demands, vehicleCapacity, timeWindows, serviceTimes, speedKmMin, depot, deadlineMs) {
  if (deadlineMs > 0 && Date.now() > deadlineMs - 500) return routes;

  const MAX_MOVES = Math.min(200, routes.length * 10);
  let moveCount = 0;

  let improved = true;
  while (improved) {
    improved = false;

    if (deadlineMs > 0 && Date.now() > deadlineMs) break;
    if (moveCount >= MAX_MOVES) break;

    outer:
    for (let ri = 0; ri < routes.length; ri++) {
      for (let pos = 1; pos < routes[ri].length - 1; pos++) {
        if (deadlineMs > 0 && Date.now() > deadlineMs) break outer;

        const node = routes[ri][pos];
        const candidateRi = [...routes[ri].slice(0, pos), ...routes[ri].slice(pos + 1)];
        if (candidateRi.length <= 2) continue;

        const distRi     = routeDistance(routes[ri], matrix);
        const distCandRi = routeDistance(candidateRi, matrix);

        for (let rj = 0; rj < routes.length; rj++) {
          if (rj === ri) continue;
          if (routeDemand(routes[rj], demands, depot) + (demands[node] || 0) > vehicleCapacity) continue;

          for (let ins = 1; ins < routes[rj].length; ins++) {
            const candidateRj = [
              ...routes[rj].slice(0, ins),
              node,
              ...routes[rj].slice(ins),
            ];
            const distRj     = routeDistance(routes[rj], matrix);
            const distCandRj = routeDistance(candidateRj, matrix);

            if (distCandRi + distCandRj < distRi + distRj - 1e-9) {
              const twRi = checkTimeWindows(candidateRi, matrix, timeWindows, serviceTimes, speedKmMin);
              const twRj = checkTimeWindows(candidateRj, matrix, timeWindows, serviceTimes, speedKmMin);
              if (twRi.feasible && twRj.feasible) {
                routes[ri] = candidateRi;
                routes[rj] = candidateRj;
                improved = true;
                moveCount++;
                break outer;
              }
            }
          }
        }
      }
    }
  }
  return routes;
}

// ─── Main Solver ─────────────────────────────────────────────────────────────

function solveGVRPTW({
  numNodes, depot, distanceMatrix, demands, vehicleCapacity,
  timeWindows, serviceTimes, vehicleSpeedKmh, numVehicles, maxSolveMs = 10000,
}) {
  const speedKmMin = vehicleSpeedKmh / 60;
  const deadline   = maxSolveMs > 0 ? Date.now() + maxSolveMs : 0;

  let routes = clarkeWright({
    numNodes, depot, distanceMatrix, demands,
    vehicleCapacity, timeWindows, serviceTimes,
    speedKmMin, numVehicles,
  });

  routes = routes.map(r => twoOpt(r, distanceMatrix, timeWindows, serviceTimes, speedKmMin));
  routes = orOpt(routes, distanceMatrix, demands, vehicleCapacity, timeWindows, serviceTimes, speedKmMin, depot, deadline);
  routes = routes.map(r => twoOpt(r, distanceMatrix, timeWindows, serviceTimes, speedKmMin));

  return routes.filter(r => r.length > 2);
}

// ─── CO₂ Computation ─────────────────────────────────────────────────────────

function computeRouteCO2(route, matrix, demands, depot, baseRate, loadFactor) {
  let co2 = 0;
  let currentLoad = route
    .filter(n => n !== depot)
    .reduce((s, n) => s + (demands[n] || 0), 0);

  for (let i = 0; i < route.length - 1; i++) {
    const dist = matrix[route[i]][route[i + 1]];
    co2 += dist * (baseRate + loadFactor * currentLoad);
    currentLoad = Math.max(0, currentLoad - (demands[route[i + 1]] || 0));
  }
  return co2;
}

function computeBaselineCO2(numNodes, depot, matrix, demands, baseRate, loadFactor) {
  let total = 0;
  for (let i = 0; i < numNodes; i++) {
    if (i === depot) continue;
    const d    = demands[i] || 0;
    const dist = matrix[depot][i] + matrix[i][depot];
    total += dist * (baseRate + loadFactor * d);
  }
  return total;
}

// ─── Express Route Handler ────────────────────────────────────────────────────

/**
 * POST /api/optimize-carbon-routes
 */
router.post('/optimize-carbon-routes', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      depot            = 0,
      numVehiclesAvailable,
      vehicleCapacity,
      distanceMatrix,
      demands,
      timeWindows,
      serviceTimes,
      vehicleSpeedKmh  = 50,
      baseEmissionRate = 0.2,
      loadFactor       = 0.001,
      maxSolveMs       = 10000, 
    } = req.body;

    const errors = validateInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: 'Invalid payload.', details: errors });
    }

    const numNodes = distanceMatrix.length;

    const solverPayload = {
      depot, numVehiclesAvailable, vehicleCapacity, distanceMatrix, demands,
      timeWindows, serviceTimes, vehicleSpeedKmh, baseEmissionRate, loadFactor, maxSolveMs,
    };

    // ── 2a. Try Python OR-Tools microservice first (best quality, 1000+ nodes) ──
    const pythonResult = await tryPythonSolver(solverPayload, maxSolveMs + 5000);
    if (pythonResult) {
      return res.status(pythonResult.success ? 200 : 200).json(pythonResult);
    }

    // ── 2b. Fall back to pure-JS solver (works up to ~200 nodes) ─────────────
    console.log(`[carbonOptimizer] Using pure-JS fallback solver for ${numNodes} nodes`);
    const routes = solveGVRPTW({
      numNodes, depot, distanceMatrix, demands, vehicleCapacity,
      timeWindows, serviceTimes, vehicleSpeedKmh, numVehicles: numVehiclesAvailable, maxSolveMs,
    });

    if (routes.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'No feasible routes found. Check that demands ≤ vehicleCapacity and time windows are achievable.',
        routes: [], vehiclesUsed: 0, totalDistanceKm: 0,
        totalCo2Kg: 0, carbonSavingsPercent: 0,
        executionTimeMs: Date.now() - startTime,
      });
    }

    // ── 3. Compute stats ───────────────────────────────────────────────────
    let totalDistanceKm = 0;
    let totalCo2Kg = 0;

    for (const route of routes) {
      totalDistanceKm += routeDistance(route, distanceMatrix);
      totalCo2Kg      += computeRouteCO2(route, distanceMatrix, demands, depot, baseEmissionRate, loadFactor);
    }

    const baselineCo2        = computeBaselineCO2(numNodes, depot, distanceMatrix, demands, baseEmissionRate, loadFactor);
    const carbonSavingsPercent = baselineCo2 > 0
      ? Math.round(((baselineCo2 - totalCo2Kg) / baselineCo2) * 1000) / 10
      : 0;

    return res.status(200).json({
      success: true,
      routes,
      vehiclesUsed: routes.length,
      totalDistanceKm:      Math.round(totalDistanceKm * 10) / 10,
      totalCo2Kg:           Math.round(totalCo2Kg * 100) / 100,
      carbonSavingsPercent,
      baselineCo2Kg:        Math.round(baselineCo2 * 100) / 100,
      solverUsed:           'Clarke-Wright + 2-opt + Or-opt (Pure JS)',
      executionTimeMs:      Date.now() - startTime,
    });

  } catch (err) {
    console.error('[carbonOptimizer] Error:', err);
    return res.status(500).json({
      success: false,
      error:   'Internal solver error.',
      details: err.message,
      executionTimeMs: Date.now() - startTime,
    });
  }
});

module.exports = router;
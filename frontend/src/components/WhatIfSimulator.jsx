import React, { useState, useEffect } from 'react';
import { Sliders, Info, Play } from 'lucide-react';
import axios from 'axios';

export default function WhatIfSimulator({ baselineInputs, initialForecast = 9150, initialRisk = 'HIGH' }) {
  const [downtime, setDowntime] = useState(18);
  const [rainfall, setRainfall] = useState(120);
  const [blasting, setBlasting] = useState(8);
  const [availability, setAvailability] = useState(75);

  const [simResult, setSimResult] = useState({
    currentForecast: initialForecast,
    currentRisk: initialRisk,
    newForecast: initialForecast,
    newRisk: initialRisk,
    recoveredTons: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (baselineInputs) {
      setDowntime(Math.round(baselineInputs.equipment_downtime ?? 18));
      setRainfall(Math.round(baselineInputs.rainfall_mm ?? 120));
      setBlasting(Math.round(baselineInputs.blasting_delay ?? 8));
      setAvailability(Math.round(baselineInputs.equipment_availability ?? 75));
    }
    setSimResult({
      currentForecast: initialForecast,
      currentRisk: initialRisk,
      newForecast: initialForecast,
      newRisk: initialRisk,
      recoveredTons: 0,
    });
  }, [baselineInputs, initialForecast, initialRisk]);

  const handleRunSimulation = async () => {
    setIsLoading(true);
    try {
      const baseline = baselineInputs || {
        equipment_downtime: 18.0,
        equipment_availability: 75.0,
        blasting_delay: 8.0,
        rainfall: 12.8,
        historical_production: 9800.0,
        production_target: 10000.0,
      };

      const modified = {
        equipment_downtime: Number(downtime),
        equipment_availability: Number(availability),
        blasting_delay: Number(blasting),
        rainfall: Number(rainfall) / 10.0,
      };

      const response = await axios.post('/api/simulate', { baseline, modified });
      const data = response.data;

      setSimResult({
        currentForecast: data.baseline.forecast_monthly,
        currentRisk: data.baseline.risk_level,
        newForecast: data.simulated.forecast_monthly,
        newRisk: data.simulated.risk_level,
        recoveredTons: data.delta.recovered_production_monthly,
      });
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-1.5 font-semibold text-sm text-gray-900">
          <Sliders class="w-4 h-4 text-blue-600" />
          <span>What-If Simulator</span>
          <Info class="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Sliders Column */}
        <div class="md:col-span-7 space-y-3">
          {/* Downtime Slider */}
          <div>
            <div class="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1">
              <span>Equipment Downtime (hours)</span>
              <span class="w-8 py-0.5 text-center bg-gray-100 border border-gray-200 rounded-md font-bold">{downtime}</span>
            </div>
            <input
              type="range" min="0" max="50" value={downtime}
              onChange={(e) => setDowntime(Number(e.target.value))}
              class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div class="flex justify-between text-[10px] text-gray-400 font-medium">
              <span>0</span>
              <span>50 hrs</span>
            </div>
          </div>

          {/* Rainfall Slider */}
          <div>
            <div class="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1">
              <span>Rainfall (mm)</span>
              <span class="w-8 py-0.5 text-center bg-gray-100 border border-gray-200 rounded-md font-bold">{rainfall}</span>
            </div>
            <input
              type="range" min="0" max="300" value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div class="flex justify-between text-[10px] text-gray-400 font-medium">
              <span>0</span>
              <span>300 mm</span>
            </div>
          </div>

          {/* Blasting Delay Slider */}
          <div>
            <div class="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1">
              <span>Blasting Delay (hours)</span>
              <span class="w-8 py-0.5 text-center bg-gray-100 border border-gray-200 rounded-md font-bold">{blasting}</span>
            </div>
            <input
              type="range" min="0" max="30" value={blasting}
              onChange={(e) => setBlasting(Number(e.target.value))}
              class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div class="flex justify-between text-[10px] text-gray-400 font-medium">
              <span>0</span>
              <span>30 hrs</span>
            </div>
          </div>

          {/* Equipment Availability Slider */}
          <div>
            <div class="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1">
              <span>Equipment Availability (%)</span>
              <span class="w-8 py-0.5 text-center bg-gray-100 border border-gray-200 rounded-md font-bold">{availability}</span>
            </div>
            <input
              type="range" min="50" max="100" value={availability}
              onChange={(e) => setAvailability(Number(e.target.value))}
              class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div class="flex justify-between text-[10px] text-gray-400 font-medium">
              <span>50</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Right Prediction Output Panel */}
        <div class="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <div class="space-y-2">
            <div class="bg-white border border-gray-200 rounded-xl p-3">
              <div class="text-[11px] font-bold text-gray-500">Current Forecast</div>
              <div class="text-xl font-extrabold text-gray-900">{simResult.currentForecast.toLocaleString()} tons</div>
              <div class="mt-1 flex items-center gap-1.5">
                <span class="text-[10px] text-gray-500">Risk:</span>
                <span class="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-600 rounded">{simResult.currentRisk}</span>
              </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-xl p-3">
              <div class="text-[11px] font-bold text-emerald-600">New Forecast (After Changes)</div>
              <div class="text-xl font-extrabold text-emerald-600">{simResult.newForecast.toLocaleString()} tons</div>
              <div class="mt-1 flex items-center gap-1.5">
                <span class="text-[10px] text-gray-500">Risk:</span>
                <span class="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-600 rounded">{simResult.newRisk}</span>
              </div>
            </div>

            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div class="text-[11px] font-bold text-emerald-700">Recovered Production</div>
              <div class="text-2xl font-black text-emerald-600">+{simResult.recoveredTons.toLocaleString()} tons</div>
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isLoading}
            class="w-full mt-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? 'Simulating...' : 'Run What-If Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { MapPin, Pickaxe, BarChart3, TrendingUp, Target, AlertTriangle } from 'lucide-react';

export default function KpiCards({ summaryData }) {
  if (!summaryData) return null;

  const {
    total_zones = 20,
    high_potential_zones = 6,
    high_potential_pct = 30,
    current_production = 9800,
    forecast_production = 9150,
    production_target = 10000,
    shortfall_risk_level = 'HIGH',
    shortfall_probability_pct = 84,
  } = summaryData;

  const targetDeltaPct = (((forecast_production - production_target) / production_target) * 100).toFixed(1);
  const isNegative = targetDeltaPct < 0;

  return (
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Mining Zones */}
      <div class="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin class="w-4 h-4" />
          </div>
          <span class="text-xs font-semibold text-gray-600">Total Mining Zones</span>
        </div>
        <div class="text-2xl font-bold text-gray-900">{total_zones}</div>
        <div class="text-[11px] text-gray-400 font-medium mt-1">Analyzed zones in region</div>
      </div>

      {/* 2. High Potential Zones */}
      <div class="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Pickaxe class="w-4 h-4" />
          </div>
          <span class="text-xs font-semibold text-gray-600">High Potential Zones</span>
        </div>
        <div class="text-2xl font-bold text-rose-600">{high_potential_zones}</div>
        <div class="text-[11px] text-gray-400 font-medium mt-1">{high_potential_pct}% of total zones</div>
      </div>

      {/* 3. Current Production */}
      <div class="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BarChart3 class="w-4 h-4" />
          </div>
          <span class="text-xs font-semibold text-gray-600">Current Production</span>
        </div>
        <div class="text-2xl font-bold text-gray-900">
          {current_production.toLocaleString()} <span class="text-xs font-semibold text-gray-500">tons</span>
        </div>
        <div class="text-[11px] text-gray-400 font-medium mt-1">Latest month</div>
      </div>

      {/* 4. Forecast Production */}
      <div class="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp class="w-4 h-4" />
          </div>
          <span class="text-xs font-semibold text-gray-600">Forecast Production</span>
        </div>
        <div class="text-2xl font-bold text-blue-600">
          {forecast_production.toLocaleString()} <span class="text-xs font-semibold text-gray-500">tons</span>
        </div>
        <div class={`text-[11px] font-semibold mt-1 ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
          {isNegative ? `▼ ${Math.abs(targetDeltaPct)}% from target` : `▲ ${targetDeltaPct}% above target`}
        </div>
      </div>

      {/* 5. Production Target */}
      <div class="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Target class="w-4 h-4" />
          </div>
          <span class="text-xs font-semibold text-gray-600">Production Target</span>
        </div>
        <div class="text-2xl font-bold text-gray-900">
          {production_target.toLocaleString()} <span class="text-xs font-semibold text-gray-500">tons</span>
        </div>
        <div class="text-[11px] text-gray-400 font-medium mt-1">Monthly target</div>
      </div>

      {/* 6. Shortfall Risk */}
      <div class="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle class="w-4 h-4" />
          </div>
          <span class="text-xs font-semibold text-gray-600">Shortfall Risk</span>
        </div>
        <div class="text-2xl font-bold text-rose-600">{shortfall_risk_level}</div>
        <div class="text-[11px] text-rose-500 font-semibold mt-1">{shortfall_probability_pct}% probability</div>
      </div>
    </div>
  );
}

import React from 'react';
import { Info } from 'lucide-react';

export default function GapAnalysis({ target = 10000, forecast = 9150, gap = 850, achievement = 91.5 }) {
  return (
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
      <div class="flex items-center gap-1.5 font-semibold text-sm text-gray-900 mb-3">
        <span>Production Gap Analysis</span>
        <Info class="w-3.5 h-3.5 text-gray-400" />
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-blue-50/80 border border-blue-100 p-3.5 rounded-xl text-center">
          <div class="text-xs font-semibold text-blue-700 mb-1">Target Production</div>
          <div class="text-xl font-extrabold text-blue-900">{target.toLocaleString()} tons</div>
        </div>

        <div class="bg-emerald-50/80 border border-emerald-100 p-3.5 rounded-xl text-center">
          <div class="text-xs font-semibold text-emerald-700 mb-1">Forecast Production</div>
          <div class="text-xl font-extrabold text-emerald-900">{forecast.toLocaleString()} tons</div>
        </div>

        <div class="bg-rose-50/80 border border-rose-100 p-3.5 rounded-xl text-center">
          <div class="text-xs font-semibold text-rose-700 mb-1">Expected Gap</div>
          <div class="text-xl font-extrabold text-rose-600">{gap.toLocaleString()} tons</div>
        </div>

        <div class="bg-purple-50/80 border border-purple-100 p-3.5 rounded-xl text-center">
          <div class="text-xs font-semibold text-purple-700 mb-1">Achievement</div>
          <div class="text-xl font-extrabold text-purple-900">{achievement}%</div>
        </div>
      </div>
    </div>
  );
}

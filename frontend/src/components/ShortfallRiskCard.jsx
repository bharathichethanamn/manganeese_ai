import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';

export default function ShortfallRiskCard({
  riskData,
  riskLevel,
  probability,
  expectedShortfall,
  expectedShortfallTons,
  topFactors,
}) {
  const probVal =
    probability ??
    riskData?.shortfall_probability_pct ??
    0;

  const levelVal =
    riskLevel ||
    riskData?.risk_level ||
    'LOW';

  const shortfallTons =
    expectedShortfall ??
    expectedShortfallTons ??
    riskData?.expected_shortfall_monthly ??
    0;

  const factorsList =
    topFactors ||
    riskData?.top_risk_factors ||
    [];

  const isHigh = String(levelVal).toUpperCase().includes('HIGH');
  const isMed = String(levelVal).toUpperCase().includes('MED');

  const textColor = isHigh
    ? 'text-rose-600'
    : isMed
    ? 'text-amber-600'
    : 'text-emerald-600';

  const bgBorderColor = isHigh
    ? 'bg-rose-50 border-rose-100'
    : isMed
    ? 'bg-amber-50 border-amber-100'
    : 'bg-emerald-50 border-emerald-100';

  const barBgColor = isHigh
    ? 'bg-rose-600'
    : isMed
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const barColors = ['bg-rose-500', 'bg-amber-500', 'bg-yellow-400', 'bg-blue-500'];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs font-sans">
      <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900 mb-3">
        <AlertTriangle className={`w-4 h-4 ${textColor}`} />
        <span>Shortfall Risk Prediction</span>
        <Info className="w-3.5 h-3.5 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Left Stats Box */}
        <div className="md:col-span-5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className={`${bgBorderColor} border rounded-xl p-3 text-center`}>
              <div className="text-[10px] font-bold text-gray-500">Shortfall Probability</div>
              <div className={`text-2xl font-extrabold ${textColor} my-1`}>{probVal}%</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className={`${barBgColor} h-full rounded-full`} style={{ width: `${Math.min(100, probVal)}%` }}></div>
              </div>
            </div>

            <div className={`${bgBorderColor} border rounded-xl p-3 text-center flex flex-col justify-center`}>
              <div className="text-[10px] font-bold text-gray-500">Risk Level</div>
              <div className={`text-2xl font-black ${textColor} mt-1`}>{levelVal}</div>
            </div>
          </div>

          <div className={`${bgBorderColor} border rounded-xl p-3 text-center`}>
            <div className="text-[10px] font-bold text-gray-500">Expected Shortfall</div>
            <div className={`text-xl font-extrabold ${textColor}`}>{shortfallTons.toLocaleString()} tons</div>
            <div className="text-[10px] text-gray-400">Based on forecast vs target</div>
          </div>
        </div>

        {/* Right Top Risk Factors Box */}
        <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="text-xs font-bold text-gray-900 mb-2">Top Risk Factors ›</div>

          <div className="space-y-2">
            {factorsList.map(([name, pct], idx) => (
              <div key={name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span className="truncate max-w-[160px]">{name}</span>
                  <span className="font-bold text-gray-900">{pct}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColors[idx % barColors.length]}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

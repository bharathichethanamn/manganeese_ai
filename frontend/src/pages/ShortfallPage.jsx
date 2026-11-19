import React, { useState } from 'react';
import ShortfallRiskCard from '../components/ShortfallRiskCard';
import AnalysisPendingBanner from '../components/AnalysisPendingBanner';
import { AlertTriangle, Lightbulb, ShieldAlert, BarChart3, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function ShortfallPage({
  zonesList,
  activeZone,
  shortfallPrediction,
  prodPrediction,
  summaryData,
  onSelectZone,
  hasRunAnalysis,
  onRunAnalysis,
  isLoading,
}) {
  const [showAllZonesAudit, setShowAllZonesAudit] = useState(false);

  const currentZoneId = activeZone?.zone_id || null;
  const riskLevel = shortfallPrediction?.risk_level || activeZone?.shortfall_risk_level || summaryData?.shortfall_risk_level || 'HIGH';
  const riskProb = shortfallPrediction?.shortfall_probability_pct ?? activeZone?.shortfall_probability_pct ?? summaryData?.shortfall_probability_pct ?? 84;
  
  const targetProd = prodPrediction?.target_production_monthly ?? activeZone?.production_target ?? 10000;
  const forecastProd = prodPrediction?.predicted_production_monthly ?? activeZone?.predicted_production_monthly ?? 9150;
  
  // Calculate expected shortfall: max(0, target production - predicted production)
  const expectedShortfall = shortfallPrediction?.expected_shortfall_monthly ?? Math.max(0, Math.round(targetProd - forecastProd));

  const topFactors = shortfallPrediction?.top_risk_factors || [
    ['Equipment Downtime', 38],
    ['Rainfall & Pit Inundation', 24],
    ['Blasting Delay', 21],
    ['Equipment Availability', 17],
  ];

  const primaryFactor = topFactors[0]?.[0] || 'Equipment Downtime';

  let recommendation = `Prioritize mobile haulage truck fleet maintenance ${currentZoneId ? `in Zone ${currentZoneId}` : 'for selected zone'} and deploy secondary standby excavators to offset downtime.`;
  if (primaryFactor.includes('Rainfall') || primaryFactor.includes('Moisture')) {
    recommendation = `Deploy high-capacity dewatering pit pumps ${currentZoneId ? `in Zone ${currentZoneId}` : 'for selected zone'} open-cast benches and reroute haulage trucks to elevated rock benches.`;
  } else if (primaryFactor.includes('Blasting')) {
    recommendation = `Optimize blasting charge distribution pattern ${currentZoneId ? `in Zone ${currentZoneId}` : 'for selected zone'} and re-coordinate evacuation safety windows to minimize shift delays.`;
  }

  // Zone risk calculation for optional all-zone comparison table
  let highRiskCount = 0;
  let medRiskCount = 0;
  let lowRiskCount = 0;

  const zoneRiskRows = (zonesList || []).map((z) => {
    const downtime = z.equipment_downtime || 0.0;
    const avail = z.equipment_availability || 0.0;
    const rain = z.rainfall_mm || 0.0;
    
    const zProb = z.zone_id === currentZoneId ? riskProb : (z.shortfall_probability_pct ?? 50.0);
    const zLevel = z.zone_id === currentZoneId ? riskLevel : (z.shortfall_risk_level || (zProb >= 65 ? 'HIGH' : zProb >= 35 ? 'MEDIUM' : 'LOW'));

    if (zLevel === 'HIGH') highRiskCount++;
    else if (zLevel === 'MEDIUM') medRiskCount++;
    else lowRiskCount++;

    return {
      zone_id: z.zone_id,
      downtime,
      avail,
      rain,
      probability: zProb,
      riskLevel: zLevel,
      isSelected: z.zone_id === currentZoneId,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Module 3 — Intelligent Shortfall Risk Engine</h2>
            <p className="text-xs text-gray-500">ML classification models predicting operational failure & production deficit probability {currentZoneId ? <>for <span className="font-extrabold text-blue-700">Zone {currentZoneId}</span></> : 'for selected mining zone'}.</p>
          </div>
        </div>
      </div>

      {!hasRunAnalysis ? (
        <AnalysisPendingBanner
          zoneId={currentZoneId}
          onRunAnalysis={() => onRunAnalysis && onRunAnalysis(activeZone)}
          isLoading={isLoading}
          moduleName="Shortfall Risk"
        />
      ) : (
        <>
          {/* Main Shortfall Risk Card for Selected Zone */}
          <ShortfallRiskCard
            riskLevel={riskLevel}
            probability={riskProb}
            expectedShortfall={expectedShortfall}
            topFactors={topFactors}
          />

          {/* AI Recommended Mitigation Action */}
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>AI Prescriptive Action Plan (Zone {currentZoneId})</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {recommendation}
            </p>
          </div>

          {/* Detailed Risk Factor Attribution */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Primary Operational Risk Factors (Zone {currentZoneId})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topFactors.map(([fName, fPct], idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>{fName}</span>
                    <span className="text-rose-600 font-extrabold">{fPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${fPct}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500">Key driver increasing target gap probability.</p>
                </div>
              ))}
            </div>
          </div>

          {/* OPTIONAL MULTI-ZONE SHORTFALL RISK AUDIT TABLE (COLLAPSIBLE) */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 shadow-2xs space-y-4">
            <button
              onClick={() => setShowAllZonesAudit(!showAllZonesAudit)}
              className="w-full flex items-center justify-between font-bold text-xs text-gray-700 hover:text-blue-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-600" />
                <span>Compare Shortfall Risk Across All Zones (Multi-Zone Audit)</span>
              </div>
              {showAllZonesAudit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAllZonesAudit && (
              <div className="pt-3 border-t border-gray-200 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Audit Summary across {zonesList?.length || 50} Zones:</span>
                  <div className="flex gap-3">
                    <span className="text-rose-600 font-bold">High: {highRiskCount}</span>
                    <span className="text-amber-600 font-bold">Medium: {medRiskCount}</span>
                    <span className="text-emerald-600 font-bold">Low: {lowRiskCount}</span>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Zone ID</th>
                        <th className="py-2.5 px-3">Equipment Downtime</th>
                        <th className="py-2.5 px-3">Availability</th>
                        <th className="py-2.5 px-3">Rainfall</th>
                        <th className="py-2.5 px-3">Failure Probability</th>
                        <th className="py-2.5 px-3 text-right">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {zoneRiskRows.map((r) => (
                        <tr key={r.zone_id} className={r.isSelected ? 'bg-blue-50/50 font-bold' : ''}>
                          <td className="py-2 px-3 flex items-center gap-1.5">
                            <span>{r.zone_id}</span>
                            {r.isSelected && <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-extrabold">Selected</span>}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{r.downtime} hrs</td>
                          <td className="py-2 px-3 text-slate-700">{r.avail}%</td>
                          <td className="py-2 px-3 text-slate-700">{r.rain} mm</td>
                          <td className="py-2 px-3 font-extrabold text-slate-900">{r.probability}%</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              r.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                              r.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {r.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

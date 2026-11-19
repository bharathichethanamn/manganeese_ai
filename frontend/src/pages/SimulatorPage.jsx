import React from 'react';
import WhatIfSimulator from '../components/WhatIfSimulator';
import AnalysisPendingBanner from '../components/AnalysisPendingBanner';
import { Sliders, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SimulatorPage({
  activeZone,
  prodPrediction,
  shortfallPrediction,
  summaryData,
  hasRunAnalysis,
  onRunAnalysis,
  isLoading,
}) {
  const zoneId = activeZone?.zone_id || null;

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Module 4 — What-If Production Sensitivity Simulator</h2>
            <p className="text-xs text-gray-500">Interactive scenario testing workspace evaluating production delta & risk mitigation against trained ML models {zoneId ? `for Zone ${zoneId}` : 'for selected mining zone'}.</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-purple-50/70 border border-purple-100 rounded-lg text-xs text-purple-900 leading-relaxed flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <span>
            <b>Simulation Mode:</b> Adjust operational downtime, blast delay, or weather parameters using the interactive sliders below and click <b>Run What-If Analysis</b> to trigger real-time ML model re-inference.
          </span>
        </div>
      </div>

      {!hasRunAnalysis ? (
        <AnalysisPendingBanner
          zoneId={zoneId}
          onRunAnalysis={() => onRunAnalysis && onRunAnalysis(activeZone)}
          isLoading={isLoading}
          moduleName="What-If Simulator"
        />
      ) : (
        <>
          {/* Main What-If Simulator Interactive Workspace */}
          <WhatIfSimulator
            baselineInputs={activeZone}
            initialForecast={prodPrediction?.predicted_production_monthly || summaryData?.forecast_production || 9150}
            initialRisk={shortfallPrediction?.risk_level || summaryData?.shortfall_risk_level || 'HIGH'}
          />

          {/* Operational Sensitivity Guidance Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Scenario Optimization Guidelines for Mine Operations</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 leading-relaxed">
              <div className="p-3 bg-slate-50 border border-gray-200 rounded-lg">
                <div className="font-bold text-gray-900 mb-1">🔧 Equipment Downtime</div>
                <p>Reducing downtime by 5 hours typically recovers up to +400 tons of monthly manganese production.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-gray-200 rounded-lg">
                <div className="font-bold text-gray-900 mb-1">⚡ Blasting Delays</div>
                <p>Synchronizing explosive loading to eliminate shift delays boosts pit excavation turnaround by 12%.</p>
              </div>
              <div className="p-3 bg-slate-50 border border-gray-200 rounded-lg">
                <div className="font-bold text-gray-900 mb-1">🌧️ Monsoon Pit Inundation</div>
                <p>Increasing dewatering pump availability prevents soil moisture saturation from stopping haul trucks.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

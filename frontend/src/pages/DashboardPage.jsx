import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCw,
  Compass,
  TrendingUp,
  AlertTriangle,
  Sliders,
  CloudSun,
  BrainCircuit,
  Lightbulb,
  FileText,
  Gem,
  BarChart2,
  Leaf,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function DashboardPage({
  summaryData,
  zonesList,
  activeZone,
  activeReservePred,
  prodPrediction,
  shortfallPrediction,
  onRunAnalysis,
  onSelectZone,
  onNavigate,
  isLoading,
}) {
  const zoneId = activeZone?.zone_id || '';

  // State to track whether AI analysis has been explicitly run for the current zone
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);
  const [analyzedZoneId, setAnalyzedZoneId] = useState(null);

  // Reset analysis state whenever the active zone changes
  useEffect(() => {
    if (activeZone?.zone_id !== analyzedZoneId) {
      setHasRunAnalysis(false);
    }
  }, [activeZone?.zone_id, analyzedZoneId]);

  const handleExecuteAnalysis = async () => {
    if (onRunAnalysis && activeZone) {
      await onRunAnalysis(activeZone);
      setHasRunAnalysis(true);
      setAnalyzedZoneId(activeZone.zone_id);
    }
  };

  // Dynamic values derived from active ML prediction pipeline
  const reserveClass = activeReservePred?.potential_class?.split(' ')[0] || 'MEDIUM';
  const reserveScore = activeReservePred?.potential_score || 55;

  const forecastTons = prodPrediction?.predicted_production_monthly || summaryData?.forecast_production || 8349;
  const targetTons = prodPrediction?.target_production_monthly || summaryData?.production_target || 10000;
  const deltaPct = (((forecastTons - targetTons) / targetTons) * 100).toFixed(1);

  const riskLevel = shortfallPrediction?.risk_level || summaryData?.shortfall_risk_level || 'HIGH';
  const riskProb = shortfallPrediction?.shortfall_probability_pct || summaryData?.shortfall_probability_pct || 99.5;

  const envScore = activeZone?.environmental_score || 62;
  const rainfall = activeZone?.rainfall_mm || 857.9;

  return (
    <div className="space-y-6">
      {/* 1. HERO SECTION — SINGLE CLEAN LAYOUT (WHITE LEFT + PRISTINE MINE IMAGE RIGHT) */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
        {/* LEFT COLUMN: Solid White Background — Zero Text/Button Overlap */}
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-white z-10 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-bold text-[11px] uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI-Powered Mining Intelligence Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              Welcome to <span className="text-blue-600">ManganeseAI</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
              AI-powered mining intelligence for better decisions, higher productivity and a sustainable future.
            </p>
          </div>

          {/* Single Clean Zone Selection + AI Analysis Control Box */}
          <div className="bg-slate-50/90 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Select a Mining Zone to get AI Insights</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <select
                  value={zoneId}
                  onChange={(e) => e.target.value && onSelectZone && onSelectZone(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-xl font-black text-xs text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="">-- Select Mining Zone --</option>
                  {zonesList?.map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>
                      {z.zone_id} - Central Region
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExecuteAnalysis}
                disabled={isLoading || !activeZone}
                className={`w-full sm:w-auto h-11 px-6 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all whitespace-nowrap cursor-pointer ${
                  !activeZone
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              Choose a zone to populate input parameters. Click <span className="font-bold text-blue-600">Run AI Analysis</span> to calculate reserve potential, production forecast, and shortfall risk.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Clear Open-Pit Mine Background Image & Feature Badges */}
        <div
          className="lg:col-span-6 relative bg-cover bg-center min-h-[260px] lg:min-h-full p-6 flex flex-col justify-between"
          style={{ backgroundImage: "url('/mine_bg.jpg')" }}
        >
          {/* Soft gradient mask on left edge */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none hidden lg:block"></div>

          {/* Top Right Small Feature Badges */}
          <div className="flex flex-wrap items-center gap-2 relative z-10 self-end justify-end">
            <button
              onClick={() => onNavigate && onNavigate('reserve')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-blue-600 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-blue-300" />
              <span>Reserve Estimation</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('production')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-emerald-600 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>Production Forecast</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('environmental')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-emerald-600 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-300" />
              <span>Environmental Intelligence</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('shortfall')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-rose-600 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
              <span>Risk Analysis</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('simulator')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-purple-600 backdrop-blur-md border border-white/30 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-300" />
              <span>Scenario Simulation</span>
            </button>
          </div>

          {/* Bottom Right Manganese Ore Badge */}
          <div className="flex items-center gap-2.5 relative z-10 self-end bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl shadow-md text-white">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
              Mn
            </div>
            <div>
              <div className="text-xs font-bold text-white">Manganese (Mn)</div>
              <div className="text-[10px] text-emerald-400 font-semibold">Key for a greener, stronger tomorrow 🌿</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AI ANALYSIS SUMMARY GRID */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">
              AI Analysis Summary — Zone {zoneId}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
            {hasRunAnalysis && (
              <>
                <span>Last Analysis: {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <button
                  onClick={handleExecuteAnalysis}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-gray-200 text-gray-700 font-bold rounded-md transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* CONDITION: ONLY DISPLAY PREDICTION RESULTS AFTER CLICKING "RUN AI ANALYSIS" */}
        {!hasRunAnalysis ? (
          <div className="bg-slate-50 border-2 border-dashed border-blue-200 rounded-2xl p-8 sm:p-12 text-center my-2 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100/80 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
              <Play className="w-6 h-6 ml-0.5 fill-blue-600" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900">
                AI Analysis Pending for Zone {zoneId}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Zone <span className="font-bold text-blue-600">{zoneId}</span> data has been loaded into parameters. Click <span className="font-bold text-blue-600">Run AI Analysis</span> to calculate live predictions for Reserve Potential, Production Forecast, and Shortfall Risk.
              </p>
            </div>

            <button
              onClick={handleExecuteAnalysis}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Computing AI Models...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run AI Analysis for Zone {zoneId}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* 4 Summary KPI Cards Displayed Only After Clicking Run AI Analysis */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 animate-fadeIn">
            {/* 1. Reserve Potential */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Gem className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-600">Reserve Potential</span>
              </div>

              <div className="mt-2">
                <div className="text-xl font-black text-amber-500">{reserveClass}</div>
                <div className="text-xs font-bold text-gray-500 mt-0.5">{reserveScore} / 100</div>
              </div>

              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${reserveScore}%` }}></div>
              </div>
            </div>

            {/* 2. Forecast Production */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-600">Forecast Production</span>
                </div>

                <div>
                  <div className="text-xl font-black text-blue-700">{forecastTons.toLocaleString()} <span className="text-xs text-gray-500 font-normal">tons</span></div>
                  <div className="text-xs font-bold text-rose-600 mt-0.5">↓ {Math.abs(deltaPct)}% from target</div>
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div className="w-16 h-10">
                <svg className="w-full h-full text-rose-500" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M0,30 Q25,10 50,25 T100,5" fill="none" />
                </svg>
              </div>
            </div>

            {/* 3. Shortfall Risk */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-600">Shortfall Risk</span>
                </div>

                <div>
                  <div className="text-xl font-black text-rose-600">{riskLevel}</div>
                  <div className="text-xs font-bold text-rose-500 mt-0.5">{riskProb}% probability</div>
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div className="w-16 h-10">
                <svg className="w-full h-full text-rose-500" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M0,35 Q30,20 60,30 T100,10" fill="none" />
                </svg>
              </div>
            </div>

            {/* 4. Environmental Score */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-600">Environmental Score</span>
                </div>

                <div>
                  <div className="text-xl font-black text-gray-900">{envScore} <span className="text-xs font-normal text-gray-500">/ 100</span></div>
                  <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded mt-0.5">
                    MODERATE
                  </span>
                  <div className="text-[10px] text-blue-600 font-semibold mt-1">Rainfall: {rainfall} mm</div>
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div className="w-16 h-10">
                <svg className="w-full h-full text-purple-500" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M0,20 Q25,35 50,15 T100,25" fill="none" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. EXPLORE DETAILED ANALYSIS (8 VISUAL MODULE CARDS) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Explore Detailed Analysis</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Dive deeper into specific aspects of mining intelligence for Zone {zoneId}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Reserve Intelligence */}
          <button
            onClick={() => onNavigate && onNavigate('reserve')}
            className="p-4 bg-slate-50 hover:bg-blue-50/70 border border-gray-200 hover:border-blue-300 rounded-xl text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div>
              <div className="p-2.5 bg-blue-100/80 text-blue-700 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div className="font-extrabold text-sm text-gray-900">Reserve Intelligence</div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Analyze geological factors and reserve potential.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-700 flex items-center gap-1">
              <span>View Reserve Map</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 2: Production Forecast */}
          <button
            onClick={() => onNavigate && onNavigate('production')}
            className="p-4 bg-slate-50 hover:bg-emerald-50/70 border border-gray-200 hover:border-emerald-300 rounded-xl text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div>
              <div className="p-2.5 bg-emerald-100/80 text-emerald-700 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="font-extrabold text-sm text-gray-900">Production Forecast</div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                View historical data and future production trends.
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span>View Forecast Trends</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 3: Shortfall Risk */}
          <button
            onClick={() => onNavigate && onNavigate('shortfall')}
            className="p-4 bg-slate-50 hover:bg-rose-50/70 border border-gray-200 hover:border-rose-300 rounded-xl text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div>
              <div className="p-2.5 bg-rose-100/80 text-rose-700 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="font-extrabold text-sm text-gray-900">Shortfall Risk</div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Identify potential production shortfalls.
              </p>
            </div>
            <div className="text-xs font-bold text-rose-700 flex items-center gap-1">
              <span>Identify Risk Factors</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 4: What-If Simulator */}
          <button
            onClick={() => onNavigate && onNavigate('simulator')}
            className="p-4 bg-slate-50 hover:bg-purple-50/70 border border-gray-200 hover:border-purple-300 rounded-xl text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div>
              <div className="p-2.5 bg-purple-100/80 text-purple-700 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="font-extrabold text-sm text-gray-900">What-If Simulator</div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Test different scenarios and operational changes.
              </p>
            </div>
            <div className="text-xs font-bold text-purple-700 flex items-center gap-1">
              <span>Test Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 5: Satellite & Weather */}
          <button
            onClick={() => onNavigate && onNavigate('environmental')}
            className="p-4 bg-slate-50 hover:bg-amber-50/70 border border-gray-200 hover:border-amber-300 rounded-xl text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div>
              <div className="p-2.5 bg-amber-100/80 text-amber-700 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                <CloudSun className="w-5 h-5" />
              </div>
              <div className="font-extrabold text-sm text-gray-900">Satellite & Weather</div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Analyze environmental and weather conditions.
              </p>
            </div>
            <div className="text-xs font-bold text-amber-700 flex items-center gap-1">
              <span>Check Weather Impact</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 6: AI Explainability */}
          <button
            onClick={() => onNavigate && onNavigate('explainability')}
            className="p-4 bg-slate-50 hover:bg-purple-50/70 border border-gray-200 hover:border-purple-300 rounded-xl text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div>
              <div className="p-2.5 bg-purple-100/80 text-purple-700 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="font-extrabold text-sm text-gray-900">AI Explainability</div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Understand why the AI made its predictions.
              </p>
            </div>
            <div className="text-xs font-bold text-purple-700 flex items-center gap-1">
              <span>View SHAP Explanations</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 7: Recommendation Engine */}
          <button
            onClick={() => onNavigate && onNavigate('recommendations')}
            className="p-4 bg-slate-50 hover:bg-amber-50/70 border border-gray-200 hover:border-amber-300 rounded-xl text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div>
              <div className="p-2.5 bg-amber-100/80 text-amber-700 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="font-extrabold text-sm text-gray-900">Recommendation Engine</div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Get AI-driven actionable recommendations.
              </p>
            </div>
            <div className="text-xs font-bold text-amber-700 flex items-center gap-1">
              <span>Get AI Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 8: Reports */}
          <button
            onClick={() => onNavigate && onNavigate('reports')}
            className="p-4 bg-slate-50 hover:bg-slate-200/70 border border-gray-200 hover:border-slate-400 rounded-xl text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div>
              <div className="p-2.5 bg-slate-200 text-slate-800 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="font-extrabold text-sm text-gray-900">Reports</div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Generate detailed analysis reports.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>Generate PDF Report</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* 4. RECENT ACTIVITY TIMELINE */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">Recent Activity Timeline</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-medium">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-emerald-950">Zone selected</div>
              <div className="text-emerald-700 text-[11px]">{zoneId} • 10:22 AM</div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-emerald-950">AI analysis status</div>
              <div className="text-emerald-700 text-[11px]">{hasRunAnalysis ? 'Completed' : 'Pending click'}</div>
            </div>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-rose-950">Risk assessment</div>
              <div className="text-rose-700 text-[11px]">{hasRunAnalysis ? `${riskLevel} risk detected` : 'Click Run AI Analysis'}</div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-blue-950">View detailed analysis</div>
              <div className="text-blue-700 text-[11px]">Explore modules</div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

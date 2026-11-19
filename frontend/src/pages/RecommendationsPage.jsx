import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lightbulb, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, Award, Sliders, ArrowRight } from 'lucide-react';
import AnalysisPendingBanner from '../components/AnalysisPendingBanner';

export default function RecommendationsPage({ activeZone, zonesList, onSelectZone, hasRunAnalysis, onRunAnalysis, isLoading }) {
  const zoneId = activeZone?.zone_id || null;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // State for Zone Prioritization Comparison Tool
  const [compareZoneBId, setCompareZoneBId] = useState('Z07');
  const [comparisonData, setComparisonData] = useState(null);
  const [compLoading, setCompLoading] = useState(false);

  useEffect(() => {
    if (!zoneId) {
      setData(null);
      setLoading(false);
      return;
    }
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/recommendations/${zoneId}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load recommendation engine data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [zoneId]);

  // Fetch Zone Prioritization Comparison
  const fetchZoneComparison = async () => {
    setCompLoading(true);
    try {
      const res = await axios.get(`/api/compare-zones?zone_a=${zoneId}&zone_b=${compareZoneBId}`);
      setComparisonData(res.data);
    } catch (err) {
      console.error('Failed to compare zones for decision support:', err);
    } finally {
      setCompLoading(false);
    }
  };

  useEffect(() => {
    if (zoneId && compareZoneBId) {
      fetchZoneComparison();
    }
  }, [zoneId, compareZoneBId]);

  if (!hasRunAnalysis) {
    return (
      <AnalysisPendingBanner
        activeZone={activeZone}
        onRunAnalysis={onRunAnalysis}
        isLoading={isLoading}
      />
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3 text-blue-600 font-bold text-sm">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Synthesizing Decision Support Engine & Recommendations for Zone {zoneId}...</span>
        </div>
      </div>
    );
  }

  const { mining_intelligence_score, recommendations, early_warnings, decision_summary } = data;
  const pillars = mining_intelligence_score?.pillar_contributions;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Module 3 — AI Recommendation & Decision Support Engine</h2>
            <p className="text-xs text-gray-500">Holistic multi-factor synthesis across Reserve, Production, Shortfall, Equipment, and Environmental Intelligence for Zone {zoneId}.</p>
          </div>
        </div>
      </div>

      {/* Feature 4: Mining Intelligence Score (0-100) Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-gray-100 pb-5">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Composite Mining Intelligence Score</span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-black text-gray-900">{mining_intelligence_score.mine_intelligence_score}</span>
              <span className="text-sm font-bold text-gray-400">/ 100</span>
              <span
                className="px-3 py-1 rounded-full text-xs font-black"
                style={{ backgroundColor: `${mining_intelligence_score.status_color}20`, color: mining_intelligence_score.status_color }}
              >
                {mining_intelligence_score.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">High-level decision-support score synthesizing 5 core mining pillars.</p>
          </div>
        </div>

        {/* 5-Pillar Score Breakdown */}
        {pillars && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase">1. Reserve (25%)</div>
              <div className="text-base font-extrabold text-blue-700 mt-1">{pillars.reserve_potential.score}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase">2. Forecast (25%)</div>
              <div className="text-base font-extrabold text-emerald-700 mt-1">{pillars.production_health.score}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase">3. Shortfall (20%)</div>
              <div className="text-base font-extrabold text-rose-700 mt-1">{pillars.shortfall_risk_health.score}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase">4. Equipment (15%)</div>
              <div className="text-base font-extrabold text-purple-700 mt-1">{pillars.equipment_health.score}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase">5. Weather (15%)</div>
              <div className="text-base font-extrabold text-amber-700 mt-1">{pillars.environmental_condition.score}</div>
            </div>
          </div>
        )}
      </div>

      {/* Feature 5: Early Warning Center */}
      {early_warnings && early_warnings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>⚠️ Early Warning Center — Active Risk Alerts for Zone {zoneId}</span>
          </div>

          <div className="space-y-2.5">
            {early_warnings.map((warn) => (
              <div key={warn.id} className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-600 text-white font-extrabold text-[10px] rounded uppercase">
                      {warn.severity}
                    </span>
                    <span className="font-bold text-xs text-rose-950">{warn.title}</span>
                  </div>
                  <p className="text-xs text-rose-900 mt-1">{warn.reason}</p>
                </div>
                <div className="px-3 py-1 bg-white border border-rose-300 rounded text-xs font-bold text-rose-800 whitespace-nowrap">
                  Action: {warn.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature 1, 2, 3, 4: Risk-to-Action Engine & Ranked Recommendations */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Prioritized Risk-to-Action Multi-Factor Recommendations</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Ranked by estimated monthly tonnage recovery impact derived from What-If ML simulation.</p>
          </div>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                    #{rec.rank}
                  </span>
                  <span className="font-bold text-sm text-gray-900">{rec.title}</span>
                </div>

                <span
                  className="px-2.5 py-1 text-xs font-extrabold rounded-md"
                  style={{ backgroundColor: `${rec.priority_color}20`, color: rec.priority_color }}
                >
                  {rec.priority} PRIORITY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Risk Factor Detected</span>
                  <span className="font-semibold text-rose-700">{rec.risk_detected}</span>
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Expected Recovery Impact</span>
                  <span className="font-extrabold text-emerald-700">{rec.expected_impact}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs">
                <span className="font-bold text-gray-800 block mb-0.5">Recommended Action Plan:</span>
                <p className="text-gray-700 leading-relaxed font-medium">{rec.recommended_action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature 5: Single-Card Executive Decision Summary */}
      {decision_summary && (
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>AI Executive Decision Summary for Zone {decision_summary.zone_id}</span>
            </h3>
            <span className="px-2.5 py-1 bg-slate-800 text-amber-400 font-bold text-xs rounded-full">
              Zone: {decision_summary.zone_id}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase">Reserve Status</span>
              <span className="font-bold text-blue-400 mt-0.5 block">{decision_summary.reserve_class}</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase">Production Status</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">{decision_summary.production_status}</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase">Shortfall Risk</span>
              <span className="font-bold text-rose-400 mt-0.5 block">{decision_summary.shortfall_risk} RISK</span>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase">Environmental Risk</span>
              <span className="font-bold text-amber-400 mt-0.5 block">{decision_summary.environmental_condition}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg space-y-1 text-xs">
            <div><span className="text-slate-400 font-bold">Main Operational Issue:</span> <span className="text-slate-200 font-semibold">{decision_summary.main_issue}</span></div>
            <div><span className="text-amber-400 font-bold">Priority Management Action:</span> <span className="text-white font-medium">{decision_summary.priority_action}</span></div>
          </div>
        </div>
      )}

      {/* Feature 6: Zone Prioritization Comparison Tool */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Zone Prioritization Comparison Tool ("Which zone should be prioritized?")</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Compare Zone A vs Zone B across all 5 pillars for operational resource allocation.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="font-bold text-gray-700">Compare {zoneId} with:</span>
            <select
              value={compareZoneBId}
              onChange={(e) => setCompareZoneBId(e.target.value)}
              className="bg-transparent font-black text-blue-700 focus:outline-none cursor-pointer"
            >
              {zonesList?.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>
                  {z.zone_id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {comparisonData && (
          <div className="space-y-4">
            {/* AI Decision Recommendation Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                  AI Prioritization Recommendation: Prioritize Zone {comparisonData.prioritized_zone}
                </span>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed mt-0.5">
                  {comparisonData.recommendation_reason}
                </p>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${comparisonData.prioritized_zone === comparisonData.zone_a.id ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500' : 'bg-slate-50 border-gray-200'}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-black text-lg text-gray-900">Zone {comparisonData.zone_a.id}</span>
                  <span className="text-xs font-bold text-blue-700">Mine Score: {comparisonData.zone_a.mine_intel_score} / 100</span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-700">
                  <div className="flex justify-between"><span>Reserve Potential Score</span><span className="font-bold">{comparisonData.zone_a.reserve_score} / 100</span></div>
                  <div className="flex justify-between"><span>Monthly Target Gap</span><span className="font-bold text-rose-600">{comparisonData.zone_a.production_gap.toLocaleString()} tons</span></div>
                  <div className="flex justify-between"><span>Shortfall Probability</span><span className="font-bold text-rose-600">{comparisonData.zone_a.shortfall_prob}%</span></div>
                  <div className="flex justify-between"><span>Environmental Score</span><span className="font-bold">{comparisonData.zone_a.environmental_score} / 100</span></div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${comparisonData.prioritized_zone === comparisonData.zone_b.id ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500' : 'bg-slate-50 border-gray-200'}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-black text-lg text-gray-900">Zone {comparisonData.zone_b.id}</span>
                  <span className="text-xs font-bold text-blue-700">Mine Score: {comparisonData.zone_b.mine_intel_score} / 100</span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-700">
                  <div className="flex justify-between"><span>Reserve Potential Score</span><span className="font-bold">{comparisonData.zone_b.reserve_score} / 100</span></div>
                  <div className="flex justify-between"><span>Monthly Target Gap</span><span className="font-bold text-rose-600">{comparisonData.zone_b.production_gap.toLocaleString()} tons</span></div>
                  <div className="flex justify-between"><span>Shortfall Probability</span><span className="font-bold text-rose-600">{comparisonData.zone_b.shortfall_prob}%</span></div>
                  <div className="flex justify-between"><span>Environmental Score</span><span className="font-bold">{comparisonData.zone_b.environmental_score} / 100</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

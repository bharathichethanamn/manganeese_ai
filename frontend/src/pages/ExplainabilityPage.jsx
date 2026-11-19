import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrainCircuit, ArrowUpRight, ArrowDownRight, Layers, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import AnalysisPendingBanner from '../components/AnalysisPendingBanner';

export default function ExplainabilityPage({ activeZone, zonesList, onSelectZone, hasRunAnalysis, onRunAnalysis, isLoading }) {
  const zoneId = activeZone?.zone_id || null;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // State for "What Changed the Prediction?" Contrast Feature
  const [compareZoneId, setCompareZoneId] = useState('Z07');
  const [contrastData, setContrastData] = useState(null);
  const [contrastLoading, setContrastLoading] = useState(false);

  useEffect(() => {
    if (!zoneId) {
      setData(null);
      setLoading(false);
      return;
    }
    const fetchExplainability = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/explainability/${zoneId}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load XAI explanation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExplainability();
  }, [zoneId]);

  // Fetch Zone Contrast ("What Changed the Prediction?")
  const handleFetchContrast = async () => {
    setContrastLoading(true);
    try {
      const res = await axios.get(`/api/explainability/compare?zone_a=${zoneId}&zone_b=${compareZoneId}`);
      setContrastData(res.data);
    } catch (err) {
      console.error('Failed to compare zone explanations:', err);
    } finally {
      setContrastLoading(false);
    }
  };

  useEffect(() => {
    if (zoneId && compareZoneId) {
      handleFetchContrast();
    }
  }, [zoneId, compareZoneId]);

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
          <span>Computing SHAP Feature Attributions for Zone {zoneId}...</span>
        </div>
      </div>
    );
  }

  const { predicted_class, confidence_pct, base_value, waterfall, positive_factors, negative_factors, global_importance, natural_language } = data;

  // Prepare SHAP Waterfall Chart Data
  const waterfallChartData = (waterfall || []).map((item) => ({
    name: item.label,
    shap: item.shap_value,
    isPositive: item.shap_value >= 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Module 2 — Explainable AI (XAI) Intelligence Center</h2>
            <p className="text-xs text-gray-500">Transparent machine learning attribution using SHAP (SHapley Additive exPlanations) for Zone {zoneId}.</p>
          </div>
        </div>
      </div>

      {/* Feature 5: Prediction Confidence & Model Reliability Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Model Prediction Output for Zone {zoneId}</div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-black text-blue-700">{predicted_class} RESERVES</span>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              Confidence: {confidence_pct}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="font-bold text-gray-800">SHAP Reliability Index: High</div>
            <div className="text-gray-500 text-[11px]">Trained Random Forest / XGBoost Model</div>
          </div>
        </div>
      </div>

      {/* Feature 4: Natural Language Explanation Box */}
      <div className="p-4 bg-purple-50/90 border border-purple-200 rounded-xl flex items-start gap-3 shadow-2xs">
        <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
            Natural Language AI Explanation:
          </span>
          <p className="text-xs font-medium text-purple-950 leading-relaxed">
            "{natural_language}"
          </p>
        </div>
      </div>

      {/* Feature 1: Positive vs Negative Factors Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Positive Influences */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-sm border-b border-gray-100 pb-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            <span>Top Positive Forces (Increasing Reserve Score)</span>
          </div>
          <div className="space-y-3">
            {positive_factors.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs">
                <div>
                  <span className="font-bold text-gray-900">{f.label}</span>
                  <span className="text-gray-500 block text-[11px]">Value: {f.value}</span>
                </div>
                <span className="font-extrabold text-emerald-700">+{(f.shap * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Negative Influences */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3 text-rose-700 font-bold text-sm border-b border-gray-100 pb-2">
            <ArrowDownRight className="w-5 h-5 text-rose-600" />
            <span>Top Negative Forces (Reducing Reserve Score)</span>
          </div>
          <div className="space-y-3">
            {negative_factors.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-rose-50/60 border border-rose-100 rounded-lg text-xs">
                <div>
                  <span className="font-bold text-gray-900">{f.label}</span>
                  <span className="text-gray-500 block text-[11px]">Value: {f.value}</span>
                </div>
                <span className="font-extrabold text-rose-700">{(f.shap * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature 2: SHAP Waterfall Plot Visualization */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">SHAP Waterfall Feature Attribution Plot</h3>
            <p className="text-xs text-gray-500">Shows how individual feature values push the model output relative to baseline.</p>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallChartData} layout="vertical" margin={{ top: 10, right: 20, left: 100, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip
                formatter={(val) => [`${val > 0 ? '+' : ''}${(val * 100).toFixed(2)}%`, 'SHAP Impact']}
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }}
              />
              <Bar dataKey="shap" radius={[0, 4, 4, 0]}>
                {waterfallChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isPositive ? '#10B981' : '#EF4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature 6: "What Changed the Prediction?" Zone Comparison Tool */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>What Changed the Prediction? (Zone Comparison Contrast)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Compare feature attributions between two selected mining zones.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="font-bold text-gray-700">Contrast {zoneId} vs:</span>
            <select
              value={compareZoneId}
              onChange={(e) => setCompareZoneId(e.target.value)}
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

        {contrastData && (
          <div className="space-y-4">
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-950">
              💡 {contrastData.contrast_summary}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-700">
                <thead className="bg-slate-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5">Feature Name</th>
                    <th className="px-4 py-2.5">{zoneId} Value</th>
                    <th className="px-4 py-2.5">{compareZoneId} Value</th>
                    <th className="px-4 py-2.5">Value Delta</th>
                    <th className="px-4 py-2.5">SHAP Attribution Impact</th>
                    <th className="px-4 py-2.5">Driver Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {contrastData.feature_comparisons.map((row) => (
                    <tr key={row.feature} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-gray-900">{row.label}</td>
                      <td className="px-4 py-2.5">{row.zone_a_val}</td>
                      <td className="px-4 py-2.5 text-purple-700 font-bold">{row.zone_b_val}</td>
                      <td className="px-4 py-2.5 font-bold">{row.delta_val > 0 ? `+${row.delta_val}` : row.delta_val}</td>
                      <td className={`px-4 py-2.5 font-extrabold ${row.delta_shap > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {row.delta_shap > 0 ? `+${(row.delta_shap * 100).toFixed(2)}%` : `${(row.delta_shap * 100).toFixed(2)}%`}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.impact_driver.includes('B') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {row.impact_driver}
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

      {/* Feature 3: Global Feature Importance */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">Global Model Feature Importance Attribution</h3>
        </div>

        <div className="space-y-3">
          {global_importance.map((item) => (
            <div key={item.feature} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>{item.label}</span>
                <span className="font-bold text-blue-700">{item.importance_pct}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${item.importance_pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

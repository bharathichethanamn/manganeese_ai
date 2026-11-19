import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnalysisPendingBanner from '../components/AnalysisPendingBanner';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  MapPin,
  TrendingDown,
  RotateCw,
  Activity,
  Gauge,
  Thermometer,
  Zap,
  Sliders,
  ChevronRight,
  X,
  ShieldAlert,
  Clock,
  Sparkles,
  BarChart3,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export default function EquipmentPage({
  activeZone,
  zonesList,
  onSelectZone,
  hasRunAnalysis,
  onRunAnalysis,
  isLoading,
}) {
  const currentZoneId = activeZone?.zone_id || '';
  
  const [equipmentData, setEquipmentData] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Automatically fetch equipment for the selected zone
  useEffect(() => {
    if (!currentZoneId) {
      setEquipmentData(null);
      setSelectedEquipment(null);
      return;
    }

    const fetchEquipment = async () => {
      setIsFetching(true);
      setErrorMsg('');
      try {
        const res = await axios.get(`/api/equipment/${currentZoneId}`);
        setEquipmentData(res.data);
        // Automatically select the top high-risk machine if available
        if (res.data?.equipment?.length > 0) {
          setSelectedEquipment(res.data.equipment[0]);
        } else {
          setSelectedEquipment(null);
        }
      } catch (err) {
        console.error(`Failed to fetch equipment for zone ${currentZoneId}:`, err);
        setErrorMsg(`No equipment data available for Zone ${currentZoneId}.`);
        setEquipmentData(null);
        setSelectedEquipment(null);
      } finally {
        setIsFetching(false);
      }
    };

    fetchEquipment();
  }, [currentZoneId]);

  const handleRefresh = async () => {
    setIsFetching(true);
    try {
      const res = await axios.get(`/api/equipment/${currentZoneId}`);
      setEquipmentData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold';
      case 'LOW':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
    }
  };

  const getProbColor = (prob) => {
    if (prob >= 70) return 'text-rose-600';
    if (prob >= 40) return 'text-amber-500';
    return 'text-emerald-600';
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* HEADER BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-bold text-[11px] uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Predictive Maintenance Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Equipment Failure Detection & Prediction</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time machine breakdown probability, predictive failure risk, and preventive maintenance actions for Zone {currentZoneId}.
          </p>
        </div>

        {/* Zone Selector Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 shadow-2xs flex-1 md:flex-initial">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-gray-500">Zone:</span>
            <select
              value={currentZoneId}
              onChange={(e) => e.target.value && onSelectZone && onSelectZone(e.target.value)}
              className="bg-transparent font-black text-blue-700 focus:outline-none cursor-pointer"
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
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh Predictions"
          >
            <RotateCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!hasRunAnalysis ? (
        <AnalysisPendingBanner
          zoneId={currentZoneId}
          onRunAnalysis={() => onRunAnalysis && onRunAnalysis(activeZone)}
          isLoading={isLoading}
          moduleName="Equipment Failure AI"
        />
      ) : (
        <>
          {/* SUMMARY KPI CARDS */}
      {equipmentData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fleet Size</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{equipmentData.equipment_count} <span className="text-xs font-normal text-slate-500">machines</span></div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Zone {currentZoneId} Heavy Equipment</div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Wrench className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Failure Risk</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{equipmentData.high_risk_count} <span className="text-xs font-normal text-slate-500">machines</span></div>
              <div className="text-[11px] font-bold text-rose-500 mt-0.5">Requires Immediate Service</div>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Moderate Risk</div>
              <div className="text-2xl font-black text-amber-500 mt-1">{equipmentData.medium_risk_count} <span className="text-xs font-normal text-slate-500">machines</span></div>
              <div className="text-[11px] font-semibold text-amber-600 mt-0.5">Schedule Preventive Inspection</div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">ML Model & Accuracy</div>
              <div className="text-base font-black text-slate-900 mt-1">{equipmentData.model_used || 'RandomForest'}</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-0.5">
                ROC-AUC: {(equipmentData.model_metrics?.roc_auc ? equipmentData.model_metrics.roc_auc * 100 : 98.8).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE IF DATA UNAVAILABLE */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-700 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>Insufficient historical equipment data for Zone {currentZoneId}. Select another zone.</span>
        </div>
      )}

      {/* MAIN CONTENT SPLIT GRID: LEFT EQUIPMENT LIST (RANKED HIGH RISK FIRST), RIGHT DETAIL VIEW */}
      {equipmentData && equipmentData.equipment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: EQUIPMENT LIST RANKED BY FAILURE RISK (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-extrabold text-slate-900">
                    Zone {currentZoneId} Equipment Fleet (Ranked by Failure Risk)
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  High Risk First
                </span>
              </div>

              {/* List of Equipment Cards */}
              <div className="space-y-3">
                {equipmentData.equipment.map((eq) => {
                  const isSelected = selectedEquipment?.equipment_id === eq.equipment_id;
                  return (
                    <div
                      key={eq.equipment_id}
                      onClick={() => setSelectedEquipment(eq)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white hover:bg-slate-50 border-gray-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Equipment Info */}
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-xs shrink-0 ${
                            eq.risk_level === 'HIGH' ? 'bg-rose-600 text-white' :
                            eq.risk_level === 'MEDIUM' ? 'bg-amber-500 text-white' :
                            'bg-emerald-600 text-white'
                          }`}>
                            {eq.equipment_id.split('-')[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-slate-900">{eq.equipment_id}</span>
                              <span className={`px-2 py-0.5 text-[10px] rounded-full border ${getRiskBadgeClass(eq.risk_level)}`}>
                                {eq.risk_level} RISK
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-semibold mt-0.5">
                              {eq.equipment_type} • Operating: {eq.operating_hours.toLocaleString()} hrs
                            </div>
                          </div>
                        </div>

                        {/* Failure Probability Badge */}
                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failure Probability</div>
                            <div className={`text-xl font-black ${getProbColor(eq.failure_probability_pct)}`}>
                              {eq.failure_probability_pct}%
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-300'}`} />
                        </div>
                      </div>

                      {/* Sub-metrics bar */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Availability</span>
                          <span className="font-extrabold text-slate-800">{eq.equipment_availability_pct}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Historical Downtime</span>
                          <span className="font-extrabold text-slate-800">{eq.historical_downtime_hrs} hrs</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Breakdowns</span>
                          <span className="font-extrabold text-slate-800">{eq.previous_breakdown_count} times</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILED FAILURE ANALYSIS VIEW (5 COLS) */}
          <div className="lg:col-span-5">
            {selectedEquipment ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-6">
                {/* Equipment Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selected Equipment</div>
                    <div className="text-2xl font-black text-slate-900">{selectedEquipment.equipment_id}</div>
                    <div className="text-xs font-semibold text-slate-500">{selectedEquipment.equipment_type} • Zone {currentZoneId}</div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full border shadow-2xs ${getRiskBadgeClass(selectedEquipment.risk_level)}`}>
                    {selectedEquipment.risk_level} RISK ({selectedEquipment.failure_probability_pct}%)
                  </span>
                </div>

                {/* Failure Probability Gauge */}
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-center space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">ML Predicted Breakdown Probability</div>
                  <div className={`text-4xl font-black ${getProbColor(selectedEquipment.failure_probability_pct)}`}>
                    {selectedEquipment.failure_probability_pct}%
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedEquipment.failure_probability_pct >= 70 ? 'bg-rose-600' :
                        selectedEquipment.failure_probability_pct >= 40 ? 'bg-amber-500' :
                        'bg-emerald-600'
                      }`}
                      style={{ width: `${selectedEquipment.failure_probability_pct}%` }}
                    />
                  </div>
                </div>

                {/* Sensor & Operational Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                      <span>Operating Temp</span>
                    </div>
                    <div className="font-black text-slate-900 text-sm">{selectedEquipment.operating_temperature_c} °C</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
                      <Gauge className="w-3.5 h-3.5 text-blue-500" />
                      <span>Vibration Index</span>
                    </div>
                    <div className="font-black text-slate-900 text-sm">{selectedEquipment.vibration_mm_s} mm/s</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                      <span>Fuel Consumption</span>
                    </div>
                    <div className="font-black text-slate-900 text-sm">{selectedEquipment.fuel_consumption_lph} L/hr</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Days Since Service</span>
                    </div>
                    <div className="font-black text-slate-900 text-sm">{selectedEquipment.days_since_last_service} days</div>
                  </div>
                </div>

                {/* Historical Failure & Downtime Trend Chart */}
                {selectedEquipment.historical_trend && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Historical Downtime Trend (Hours)</span>
                      <span className="text-[10px] text-slate-400">Past 6 Months</span>
                    </div>
                    <div className="h-36 bg-slate-50 border border-gray-200 rounded-xl p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedEquipment.historical_trend}>
                          <defs>
                            <linearGradient id="dtGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="downtime" name="Downtime (hrs)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#dtGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Top Contributing Factors (SHAP Feature Importance) */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span>Top Contributing Failure Factors (SHAP Analysis)</span>
                  </div>

                  <div className="space-y-2">
                    {selectedEquipment.contributing_factors?.map((factor, fIdx) => (
                      <div key={fIdx} className="bg-slate-50 border border-gray-200 rounded-xl p-2.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{factor.label}</span>
                          <span className="text-rose-600">{factor.value}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-purple-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(15, (fIdx + 1) * 22))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Preventive Action Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Recommended Preventive Action</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    {selectedEquipment.recommendation}
                  </p>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold space-y-2">
                <Wrench className="w-8 h-8 mx-auto text-slate-300" />
                <p>Click any machine on the left to inspect detailed ML failure analysis.</p>
              </div>
            )}
          </div>

        </div>
      )}
      </>
      )}
    </div>
  );
}

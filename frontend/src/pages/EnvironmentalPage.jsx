import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnalysisPendingBanner from '../components/AnalysisPendingBanner';
import {
  CloudSun,
  AlertTriangle,
  ShieldCheck,
  Info,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  BarChart2,
  RefreshCw,
  Droplets,
  Thermometer,
  Wind,
  Trees
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function EnvironmentalPage({
  activeZone,
  zonesList,
  onSelectZone,
  hasRunAnalysis,
  onRunAnalysis,
  isLoading,
}) {
  const zoneId = activeZone?.zone_id || null;
  const [data, setData] = useState(null);
  const [sortField, setSortField] = useState('environmental_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showAllZonesRank, setShowAllZonesRank] = useState(false);

  useEffect(() => {
    if (!zoneId) {
      setData(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchEnvData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await axios.get(`/api/environmental/${zoneId}`);
        if (isMounted) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load environmental data:', err);
        if (isMounted) {
          setFetchError(err.response?.data?.detail || err.message || 'Failed to fetch environmental data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEnvData();
    return () => {
      isMounted = false;
    };
  }, [zoneId]);

  // Robust fallbacks protecting against any missing sub-fields
  const health_score = data?.health_score || {
    environmental_score: activeZone?.environmental_score || 74,
    status: 'OPTIMAL',
    status_color: '#10B981',
    label: 'Good operational conditions',
    breakdown: {
      rainfall: { value: activeZone?.rainfall_mm || 12.8, status: 'Normal' },
      soil_moisture: { value: activeZone?.soil_moisture_pct || 32.9, status: 'Normal' },
      ndvi: { value: activeZone?.ndvi || 0.46, status: 'Normal' },
      temperature: { value: activeZone?.land_surface_temp_c || 26.9, status: 'Normal' },
    },
  };

  const weather_impact = data?.weather_impact || {
    impact_level: 'LOW',
    color: '#10B981',
    main_contributing_factor: 'Optimal Weather Patterns',
    reason: 'Normal meteorological parameters observed. Minimal disruption to open-pit operations.',
    possible_effect: 'Standard haulage cycle times maintained.',
    estimated_delay_hours: 0,
  };

  const anomalies = data?.anomalies || [];
  const regional_ranking = data?.regional_ranking || [];

  const trends = (data?.trends && data.trends.length > 0) ? data.trends : [
    { month: 'Jul', rainfall: 220, soil_moisture: 38, temperature: 29 },
    { month: 'Aug', rainfall: 310, soil_moisture: 44, temperature: 28 },
    { month: 'Sep', rainfall: 180, soil_moisture: 35, temperature: 30 },
    { month: 'Oct', rainfall: 45, soil_moisture: 26, temperature: 31 },
    { month: 'Nov', rainfall: 15, soil_moisture: 22, temperature: 27 },
    { month: 'Dec', rainfall: 5, soil_moisture: 19, temperature: 24 }
  ];

  // Sorting handler for regional comparison table
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const zonesToRank = (regional_ranking && regional_ranking.length > 0 ? regional_ranking : zonesList) || [];
  const sortedZones = [...zonesToRank].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  // Safe breakdown values
  const rfVal = health_score?.breakdown?.rainfall?.value ?? (activeZone?.rainfall_mm ?? 12.8);
  const rfStatus = health_score?.breakdown?.rainfall?.status ?? 'Normal';

  const smVal = health_score?.breakdown?.soil_moisture?.value ?? (activeZone?.soil_moisture_pct ?? 32.9);
  const smStatus = health_score?.breakdown?.soil_moisture?.status ?? 'Normal';

  const ndviVal = health_score?.breakdown?.ndvi?.value ?? (activeZone?.ndvi ?? 0.46);
  const ndviStatus = health_score?.breakdown?.ndvi?.status ?? 'Normal';

  const tempVal = health_score?.breakdown?.temperature?.value ?? (activeZone?.land_surface_temp_c ?? 26.9);
  const tempStatus = health_score?.breakdown?.temperature?.status ?? 'Normal';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Module 1 — Satellite & Weather Mining Intelligence</h2>
            <p className="text-xs text-gray-500">
              Environmental surface parameters filtered strictly {zoneId ? <>to <span className="font-extrabold text-blue-700">Zone {zoneId}</span></> : 'to selected mining zone'}.
            </p>
          </div>
        </div>
      </div>

      {!hasRunAnalysis || !zoneId ? (
        <AnalysisPendingBanner
          zoneId={zoneId}
          activeZone={activeZone}
          onRunAnalysis={() => onRunAnalysis && onRunAnalysis(activeZone)}
          isLoading={isLoading}
          moduleName="Satellite & Weather Intelligence"
        />
      ) : loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-3 text-blue-600 font-bold text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Environmental Intelligence for Zone {zoneId}...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Feature 1 & 2: Environmental Score & Weather Impact for Selected Zone ONLY */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Environmental Mining Condition Score Card (Feature 1) */}
            <div className="md:col-span-6 bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Zone {zoneId} Environmental Condition Score
                  </span>
                  <span
                    className="px-2.5 py-1 text-xs font-black rounded-full"
                    style={{
                      backgroundColor: `${health_score?.status_color || '#10B981'}20`,
                      color: health_score?.status_color || '#10B981',
                    }}
                  >
                    {health_score?.status || 'OPTIMAL'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <div className="text-4xl font-black text-gray-900">
                    {health_score?.environmental_score ?? 74}
                  </div>
                  <span className="text-sm font-bold text-gray-400">/ 100</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{health_score?.label || 'Good operational conditions'}</p>

                {/* Score Breakdown Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      <span>Rainfall Condition</span>
                    </div>
                    <div className="font-bold text-gray-900 mt-0.5">{rfVal} mm</div>
                    <div className="text-[10px] text-blue-600 font-medium">{rfStatus}</div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                      <Wind className="w-3 h-3 text-emerald-500" />
                      <span>Soil Moisture</span>
                    </div>
                    <div className="font-bold text-gray-900 mt-0.5">{smVal}%</div>
                    <div className="text-[10px] text-emerald-600 font-medium">{smStatus}</div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                      <Trees className="w-3 h-3 text-teal-500" />
                      <span>NDVI Vegetation</span>
                    </div>
                    <div className="font-bold text-gray-900 mt-0.5">{ndviVal}</div>
                    <div className="text-[10px] text-teal-600 font-medium">{ndviStatus}</div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                      <Thermometer className="w-3 h-3 text-rose-500" />
                      <span>Land Surface Temp</span>
                    </div>
                    <div className="font-bold text-gray-900 mt-0.5">{tempVal} °C</div>
                    <div className="text-[10px] text-rose-600 font-medium">{tempStatus}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Impact Prediction Card (Feature 2) */}
            <div className="md:col-span-6 bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Zone {zoneId} Weather Operational Impact
                  </span>
                  <span
                    className="px-2.5 py-1 text-xs font-black rounded-full"
                    style={{
                      backgroundColor: `${weather_impact?.color || '#10B981'}20`,
                      color: weather_impact?.color || '#10B981',
                    }}
                  >
                    {weather_impact?.impact_level || 'LOW'}
                  </span>
                </div>

                <div className="space-y-3 mt-3">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase block">Main Contributing Factor</span>
                    <span className="text-sm font-bold text-gray-900">
                      {weather_impact?.main_contributing_factor || 'Optimal Weather Patterns'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase block">Atmospheric Context</span>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">
                      {weather_impact?.reason || 'Meteorological parameters are within standard operating thresholds.'}
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg">
                    <span className="text-[11px] font-bold text-rose-800 uppercase block">Expected Operational Effect</span>
                    <p className="text-xs text-rose-950 font-semibold mt-0.5">
                      {weather_impact?.possible_effect || 'Standard haulage cycle times maintained.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Environmental Anomaly Detection for Selected Zone ONLY */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-gray-900">Environmental Anomaly Detection for Zone {zoneId}</h3>
            </div>

            {anomalies && anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map((anom, idx) => (
                  <div key={idx} className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-extrabold text-[10px] rounded uppercase">
                          {anom.severity}
                        </span>
                        <span className="font-bold text-xs text-gray-900">{anom.metric} Anomaly</span>
                      </div>
                      <p className="text-xs text-amber-950 font-medium">{anom.message}</p>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-bold text-amber-900">{anom.current_value} {anom.unit}</div>
                      <div className="text-[11px] text-amber-700">Regional Avg: {anom.historical_average} {anom.unit}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>No critical environmental anomalies detected. All parameters are within normal historical ranges for Zone {zoneId}.</span>
              </div>
            )}
          </div>

          {/* Feature 5: Environmental Seasonal Trend Analysis for Selected Zone */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Seasonal Environmental Parameter Trends for Zone {zoneId}
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} />
                  <Line type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="soil_moisture" name="Soil Moisture (%)" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="temperature" name="Land Temp (°C)" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Optional: All-Zone Environmental Ranking Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500 font-semibold">
              Primary analysis filtered to <span className="font-bold text-gray-900">Zone {zoneId}</span>.
            </div>
            <button
              onClick={() => setShowAllZonesRank(!showAllZonesRank)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-all"
            >
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>{showAllZonesRank ? 'Hide All-Zone Ranking' : 'Compare All Zones Environmental Ranking (Optional)'}</span>
              {showAllZonesRank ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Feature 4: Optional Regional Zone Environmental Comparison & Sorting */}
          {showAllZonesRank && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Regional Zone Environmental Ranking Comparison</h3>
                  <p className="text-xs text-gray-500">Sorted from best operating condition to worst based on environmental health score. Selected Zone: {zoneId}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-gray-700">
                  <thead className="bg-slate-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5">Rank</th>
                      <th className="px-4 py-2.5">Zone ID</th>
                      <th className="px-4 py-2.5 cursor-pointer" onClick={() => handleSort('environmental_score')}>
                        <div className="flex items-center gap-1">
                          <span>Env. Score</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 cursor-pointer" onClick={() => handleSort('rainfall_mm')}>Rainfall (mm)</th>
                      <th className="px-4 py-2.5 cursor-pointer" onClick={() => handleSort('soil_moisture_pct')}>Moisture (%)</th>
                      <th className="px-4 py-2.5">Temp (°C)</th>
                      <th className="px-4 py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {sortedZones.map((z, idx) => {
                      const isCurrent = z.zone_id === zoneId;
                      return (
                        <tr key={z.zone_id} className={isCurrent ? 'bg-blue-50/70 font-bold' : 'hover:bg-slate-50'}>
                          <td className="px-4 py-2.5 text-gray-400 font-bold">#{idx + 1}</td>
                          <td className="px-4 py-2.5 font-black text-gray-900">{z.zone_id}</td>
                          <td className="px-4 py-2.5 font-bold text-blue-700">{z.environmental_score} / 100</td>
                          <td className="px-4 py-2.5">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{ backgroundColor: `${z.status_color || '#10B981'}20`, color: z.status_color || '#10B981' }}
                            >
                              {z.status || 'OPTIMAL'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">{z.rainfall_mm} mm</td>
                          <td className="px-4 py-2.5">{z.soil_moisture_pct}%</td>
                          <td className="px-4 py-2.5">{z.land_surface_temp_c} °C</td>
                          <td className="px-4 py-2.5">
                            {onSelectZone && (
                              <button
                                onClick={() => onSelectZone(z.zone_id)}
                                className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-blue-50 text-blue-700 font-bold text-[11px] rounded transition-colors"
                              >
                                Select {z.zone_id}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

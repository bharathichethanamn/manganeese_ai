import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';

import DashboardPage from './pages/DashboardPage';
import ReservePage from './pages/ReservePage';
import ProductionPage from './pages/ProductionPage';
import ShortfallPage from './pages/ShortfallPage';
import EquipmentPage from './pages/EquipmentPage';
import SimulatorPage from './pages/SimulatorPage';
import EnvironmentalPage from './pages/EnvironmentalPage';
import ExplainabilityPage from './pages/ExplainabilityPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ReportsPage from './pages/ReportsPage';
import UploadPage from './pages/UploadPage';
import { UploadCloud, Undo2 } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('mg_authenticated') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('mg_user') || localStorage.getItem('mg_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [summaryData, setSummaryData] = useState(null);
  const [zonesList, setZonesList] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [activeUploadInfo, setActiveUploadInfo] = useState(null);

  const [activeReservePred, setActiveReservePred] = useState(null);
  const [prodPrediction, setProdPrediction] = useState(null);
  const [shortfallPrediction, setShortfallPrediction] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [analyzedZoneId, setAnalyzedZoneId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const hasRunAnalysis = Boolean(activeZone && analyzedZoneId === activeZone.zone_id);

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogin = (user) => {
    sessionStorage.setItem('mg_authenticated', 'true');
    sessionStorage.setItem('mg_user', JSON.stringify(user));
    localStorage.setItem('mg_authenticated', 'true');
    localStorage.setItem('mg_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('mg_authenticated');
    localStorage.removeItem('mg_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Fetch zone full data and predictions from backend
  const loadZoneDetails = async (zoneId) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/zones/${zoneId}`);
      const data = res.data;

      setActiveZone(data.zone_data);
      setActiveReservePred(data.reserve_prediction);
      setProdPrediction(data.production_prediction);
      setShortfallPrediction(data.shortfall_prediction);

      // Update Summary KPI card states dynamically for the selected zone
      setSummaryData((prev) => ({
        ...prev,
        current_production: data.zone_data.historical_production || 9800.0,
        forecast_production: data.production_prediction.predicted_production_monthly,
        production_target: data.production_prediction.target_production_monthly,
        production_gap: data.production_prediction.production_gap_monthly,
        achievement_pct: data.production_prediction.achievement_pct,
        shortfall_risk_level: data.shortfall_prediction.risk_level,
        shortfall_probability_pct: data.shortfall_prediction.shortfall_probability_pct,
        expected_shortfall_tons: data.shortfall_prediction.expected_shortfall_monthly,
      }));
    } catch (err) {
      console.error(`Failed to load details for zone ${zoneId}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial summary & zones list on load, leave activeZone empty until selected by user
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sumRes, zonesRes, uploadStatusRes] = await Promise.all([
          axios.get('/api/summary'),
          axios.get('/api/zones'),
          axios.get('/api/active-upload-status').catch(() => ({ data: { is_uploaded: false } })),
        ]);

        setSummaryData(sumRes.data);
        const zList = zonesRes.data.zones || [];
        setZonesList(zList);
        if (uploadStatusRes.data?.is_uploaded) {
          setActiveUploadInfo(uploadStatusRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch initial backend API data:', err);
      }
    };

    fetchInitialData();
  }, []);

  const handleUploadedDataActivated = async (data) => {
    setActiveUploadInfo(data);
    try {
      const [sumRes, zonesRes] = await Promise.all([
        axios.get('/api/summary'),
        axios.get('/api/zones'),
      ]);
      setSummaryData(sumRes.data);
      const newZones = zonesRes.data.zones || [];
      setZonesList(newZones);
      if (newZones.length > 0) {
        await loadZoneDetails(newZones[0].zone_id);
      }
    } catch (err) {
      console.error('Failed to sync active uploaded data:', err);
    }
  };

  const handleSwitchBackToBuiltIn = async () => {
    try {
      await axios.post('/api/reset-uploaded');
      setActiveUploadInfo(null);
      const [sumRes, zonesRes] = await Promise.all([
        axios.get('/api/summary'),
        axios.get('/api/zones'),
      ]);
      setSummaryData(sumRes.data);
      const builtInZones = zonesRes.data.zones || [];
      setZonesList(builtInZones);
      if (builtInZones.length > 0) {
        await loadZoneDetails(builtInZones[0].zone_id);
      }
    } catch (err) {
      console.error('Failed to switch back to built-in data:', err);
    }
  };

  // Zone selection handler (dropdown change or map click)
  const handleSelectZone = async (zoneId) => {
    await loadZoneDetails(zoneId);
  };

  // Run AI Analysis Button Handler
  const handleRunAnalysis = async (zoneOrFormData) => {
    setIsLoading(true);

    const targetZoneId = typeof zoneOrFormData === 'string'
      ? zoneOrFormData
      : zoneOrFormData?.zone_id || activeZone?.zone_id || 'Z01';

    // Find the complete zone object from zonesList or activeZone
    const foundZone =
      zonesList.find((z) => z.zone_id === targetZoneId) ||
      (activeZone?.zone_id === targetZoneId ? activeZone : null) ||
      zonesList[0] ||
      {};

    const inputSource = typeof zoneOrFormData === 'object' ? { ...foundZone, ...zoneOrFormData } : foundZone;

    const formData = {
      zone_id: targetZoneId,
      latitude: inputSource.latitude || 21.3747,
      longitude: inputSource.longitude || 80.0318,
      elevation_m: inputSource.elevation_m || 286.3,
      geological_indicator: inputSource.geological_indicator || (inputSource.geol_grade_pct ? inputSource.geol_grade_pct / 48.0 : 0.83),
      ore_thickness_m: inputSource.ore_thickness_m || 4.5,
      drill_depth_m: inputSource.drill_depth_m || 128.1,
      rainfall_mm: inputSource.rainfall_mm || 1394,
      soil_moisture_pct: inputSource.soil_moisture_pct || 32.9,
      ndvi: inputSource.ndvi || 0.62,
      land_surface_temp_c: inputSource.land_surface_temp_c || 29.8,
      historical_production: inputSource.historical_production || 9800.0,
      equipment_availability: inputSource.equipment_availability ?? 75.0,
      equipment_downtime: inputSource.equipment_downtime ?? 12.0,
      maintenance_hours: inputSource.maintenance_hours ?? 3.0,
      blasting_delay: inputSource.blasting_delay ?? 0.0,
      production_target: inputSource.production_target || 10000.0,
    };

    try {
      const [resPred, prodPred, shortPred] = await Promise.all([
        axios.post('/api/predict/reserve', {
          zone_id: formData.zone_id,
          latitude: formData.latitude,
          longitude: formData.longitude,
          elevation_m: formData.elevation_m,
          geol_grade_pct: (formData.geological_indicator || 0.83) * 48.0,
          lithology_score: 7.5,
          fault_proximity_km: 3.0,
          ore_thickness_m: formData.ore_thickness_m,
          drill_depth_m: formData.drill_depth_m,
          mineralization_density: 3.2,
          rainfall_mm: formData.rainfall_mm,
          soil_moisture_pct: formData.soil_moisture_pct,
          ndvi: formData.ndvi,
          land_surface_temp_c: formData.land_surface_temp_c,
        }),

        axios.post('/api/predict/production', {
          historical_production: formData.historical_production,
          previous_production: formData.historical_production,
          production_trend: 0.0,
          equipment_availability: formData.equipment_availability,
          equipment_downtime: formData.equipment_downtime,
          maintenance_hours: formData.maintenance_hours,
          rainfall: formData.rainfall_mm / 10.0,
          soil_moisture: formData.soil_moisture_pct,
          temperature: formData.land_surface_temp_c,
          blasting_delay: formData.blasting_delay,
          production_target: formData.production_target,
        }),

        axios.post('/api/predict/shortfall', {
          equipment_downtime: formData.equipment_downtime,
          equipment_availability: formData.equipment_availability,
          maintenance_hours: formData.maintenance_hours,
          rainfall: formData.rainfall_mm / 10.0,
          blasting_delay: formData.blasting_delay,
          historical_production: formData.historical_production,
          production_trend: 0.0,
          temperature: formData.land_surface_temp_c,
          soil_moisture: formData.soil_moisture_pct,
          production_target: formData.production_target,
        }),
      ]);

      setActiveReservePred(resPred.data);
      setProdPrediction(prodPred.data);
      setShortfallPrediction(shortPred.data);
      setAnalyzedZoneId(targetZoneId);

      setSummaryData((prev) => ({
        ...prev,
        current_production: formData.historical_production,
        forecast_production: prodPred.data.predicted_production_monthly,
        production_target: prodPred.data.target_production_monthly,
        production_gap: prodPred.data.production_gap_monthly,
        achievement_pct: prodPred.data.achievement_pct,
        shortfall_risk_level: shortPred.data.risk_level,
        shortfall_probability_pct: shortPred.data.shortfall_probability_pct,
        expected_shortfall_tons: shortPred.data.expected_shortfall_monthly,
      }));

      // Fetch equipment data for target zone to check machine failure risks
      let equipResData = null;
      try {
        const eqRes = await axios.get(`/api/equipment/${targetZoneId}`);
        equipResData = eqRes.data;
      } catch (e) {
        console.warn('Could not fetch equipment data for notification engine:', e);
      }

      // Build real ML notifications for this run
      const newAlerts = [];

      // 1. Equipment Failure AI check
      if (equipResData && equipResData.equipment) {
        const highRiskEq = equipResData.equipment.filter(
          (eq) => eq.risk_level === 'HIGH' || eq.failure_probability >= 60
        );
        highRiskEq.forEach((eq) => {
          newAlerts.push({
            id: `notif-equip-${targetZoneId}-${eq.equipment_id}`,
            zone_id: targetZoneId,
            title: `${eq.equipment_id} — High Failure Risk`,
            badge_emoji: '🔴',
            severity: 'high',
            result_text: `Failure probability: ${eq.failure_probability}%`,
            recommendation: eq.recommendation || `Schedule preventive maintenance for machine ${eq.equipment_id}`,
            target_tab: 'equipment',
            button_label: 'View Equipment',
            read: false,
            timestamp: 'Just now',
          });
        });
      }

      // 2. Production Shortfall Risk AI check
      if (shortPred.data && (shortPred.data.risk_level === 'HIGH' || shortPred.data.shortfall_probability_pct >= 50)) {
        newAlerts.push({
          id: `notif-shortfall-${targetZoneId}`,
          zone_id: targetZoneId,
          title: `Zone ${targetZoneId} — Production Shortfall Risk`,
          badge_emoji: shortPred.data.risk_level === 'HIGH' ? '🔴' : '🟠',
          severity: shortPred.data.risk_level === 'HIGH' ? 'high' : 'medium',
          result_text: `Shortfall probability: ${shortPred.data.shortfall_probability_pct}%`,
          recommendation: `Expected monthly shortfall: ${(shortPred.data.expected_shortfall_monthly || 0).toLocaleString()} tons`,
          target_tab: 'shortfall',
          button_label: 'View Shortfall',
          read: false,
          timestamp: 'Just now',
        });
      }

      // 3. Satellite & Environmental Warning check
      const envScore = formData.environmental_score || (activeZone?.environmental_score || 58);
      const soilMoisture = formData.soil_moisture_pct || (activeZone?.soil_moisture_pct || 32.9);
      const rainfall = formData.rainfall_mm || (activeZone?.rainfall_mm || 1394);

      if (envScore < 65 || soilMoisture > 30 || rainfall > 1200) {
        newAlerts.push({
          id: `notif-env-${targetZoneId}`,
          zone_id: targetZoneId,
          title: `Zone ${targetZoneId} — Environmental Warning`,
          badge_emoji: '🟡',
          severity: 'warning',
          result_text: `Soil moisture: ${soilMoisture}%, Rainfall: ${rainfall}mm`,
          recommendation: `Environmental condition requires attention. Deploy bench dewatering pumps.`,
          target_tab: 'environmental',
          button_label: 'View Environment',
          read: false,
          timestamp: 'Just now',
        });
      }

      // 4. Reserve Intelligence Low Potential check
      if (resPred.data && (resPred.data.potential_score < 60 || (resPred.data.potential_class && resPred.data.potential_class.includes('LOW')))) {
        newAlerts.push({
          id: `notif-reserve-${targetZoneId}`,
          zone_id: targetZoneId,
          title: `Zone ${targetZoneId} — Reserve Potential Warning`,
          badge_emoji: '🟡',
          severity: 'warning',
          result_text: `Reserve potential score: ${resPred.data.potential_score}/100`,
          recommendation: `Borehole log depth indicates low ore seam bed continuity.`,
          target_tab: 'reserve',
          button_label: 'View Reserve',
          read: false,
          timestamp: 'Just now',
        });
      }

      // Update state: replace previous alerts for targetZoneId with newAlerts to prevent duplicate alerts
      setNotifications((prev) => {
        const otherZoneAlerts = prev.filter((n) => n.zone_id !== targetZoneId);
        return [...newAlerts, ...otherZoneAlerts];
      });

    } catch (err) {
      console.error('Error running AI predictions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-6 overflow-y-auto">
        <Header
          zonesList={zonesList}
          activeZone={activeZone}
          onSelectZone={handleSelectZone}
          currentUser={currentUser}
          onLogout={handleLogout}
          onRunAnalysis={handleRunAnalysis}
          isLoading={isLoading}
          hasRunAnalysis={hasRunAnalysis}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNavigate={setActiveTab}
        />

        {/* Active Uploaded Dataset Alert Banner */}
        {activeUploadInfo?.is_uploaded && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-300">Active Dataset:</span>
                  <span className="text-sm font-extrabold text-white">{activeUploadInfo.filename}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeUploadInfo.confidence_score} / 100 Quality
                  </span>
                  <span className="text-[11px] text-blue-200">
                    ({zonesList.length} Zones Loaded)
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  ML models running in isolated session. Trained on Central Indian ground truth; predictions on unseen mines should be verified with field assays.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab('upload')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all"
              >
                Upload Config
              </button>
              <button
                onClick={handleSwitchBackToBuiltIn}
                className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Switch Back to Built-in Data</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <UploadPage
            activeUploadInfo={activeUploadInfo}
            onAnalysisComplete={handleUploadedDataActivated}
            onSwitchBack={handleSwitchBackToBuiltIn}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            summaryData={summaryData}
            zonesList={zonesList}
            activeZone={activeZone}
            activeReservePred={activeReservePred}
            prodPrediction={prodPrediction}
            shortfallPrediction={shortfallPrediction}
            onRunAnalysis={handleRunAnalysis}
            onSelectZone={handleSelectZone}
            onNavigate={setActiveTab}
            isLoading={isLoading}
            hasRunAnalysis={hasRunAnalysis}
          />
        )}

        {activeTab === 'reserve' && (
          <ReservePage
            zonesList={zonesList}
            activeZone={activeZone}
            activeReservePred={activeReservePred}
            prodPrediction={prodPrediction}
            shortfallPrediction={shortfallPrediction}
            onSelectZone={handleSelectZone}
            hasRunAnalysis={hasRunAnalysis}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'production' && (
          <ProductionPage
            activeZone={activeZone}
            prodPrediction={prodPrediction}
            summaryData={summaryData}
            hasRunAnalysis={hasRunAnalysis}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'shortfall' && (
          <ShortfallPage
            zonesList={zonesList}
            activeZone={activeZone}
            shortfallPrediction={shortfallPrediction}
            prodPrediction={prodPrediction}
            summaryData={summaryData}
            onSelectZone={handleSelectZone}
            hasRunAnalysis={hasRunAnalysis}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'equipment' && (
          <EquipmentPage
            activeZone={activeZone}
            zonesList={zonesList}
            onSelectZone={handleSelectZone}
            hasRunAnalysis={hasRunAnalysis}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorPage
            activeZone={activeZone}
            prodPrediction={prodPrediction}
            shortfallPrediction={shortfallPrediction}
            summaryData={summaryData}
            hasRunAnalysis={hasRunAnalysis}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'environmental' && (
          <EnvironmentalPage
            activeZone={activeZone}
            zonesList={zonesList}
            onSelectZone={handleSelectZone}
            hasRunAnalysis={hasRunAnalysis}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'explainability' && (
          <ExplainabilityPage
            activeZone={activeZone}
            zonesList={zonesList}
            onSelectZone={handleSelectZone}
            hasRunAnalysis={hasRunAnalysis}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsPage
            activeZone={activeZone}
            zonesList={zonesList}
            onSelectZone={handleSelectZone}
            hasRunAnalysis={hasRunAnalysis}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsPage
            activeZone={activeZone}
            activeReservePred={activeReservePred}
            prodPrediction={prodPrediction}
            shortfallPrediction={shortfallPrediction}
            summaryData={summaryData}
            hasRunAnalysis={hasRunAnalysis}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}

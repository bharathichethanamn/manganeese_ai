import React, { useState, useEffect } from 'react';
import { Play, Sparkles, AlertCircle, MapPin, Edit3 } from 'lucide-react';

export default function InputPanel({ activeZone, zonesList, onSelectZone, onRunAnalysis, isLoading }) {
  const [mode, setMode] = useState('select'); // 'select' or 'custom'
  const [formData, setFormData] = useState({
    zone_id: 'Z01',
    latitude: 21.3747,
    longitude: 80.0318,
    elevation_m: 286.3,
    geological_indicator: 0.94,
    drill_depth_m: 128.1,
    ore_thickness_m: 4.5,
    rainfall_mm: 1394.0,
    soil_moisture_pct: 32.9,
    ndvi: 0.461,
    land_surface_temp_c: 26.9,
    equipment_downtime: 13.3,
    equipment_availability: 73.4,
    maintenance_hours: 3.0,
    blasting_delay: 0.0,
    historical_production: 9885.0,
    production_target: 10000.0,
  });

  const [errors, setErrors] = useState([]);

  // Auto-sync form inputs whenever activeZone changes
  useEffect(() => {
    if (activeZone) {
      setFormData({
        zone_id: activeZone.zone_id || 'Z01',
        latitude: activeZone.latitude || 21.3747,
        longitude: activeZone.longitude || 80.0318,
        elevation_m: activeZone.elevation_m || 286.3,
        geological_indicator: activeZone.geological_indicator ?? Number((activeZone.geol_grade_pct / 48.0).toFixed(3)),
        drill_depth_m: activeZone.drill_depth_m || 128.1,
        ore_thickness_m: activeZone.ore_thickness_m || 4.5,
        rainfall_mm: activeZone.rainfall_mm || 1394.0,
        soil_moisture_pct: activeZone.soil_moisture_pct || 32.9,
        ndvi: activeZone.ndvi ?? 0.461,
        land_surface_temp_c: activeZone.land_surface_temp_c || 26.9,
        equipment_downtime: activeZone.equipment_downtime ?? 13.3,
        equipment_availability: activeZone.equipment_availability ?? 73.4,
        maintenance_hours: activeZone.maintenance_hours ?? 3.0,
        blasting_delay: activeZone.blasting_delay ?? 0.0,
        historical_production: activeZone.historical_production ?? 9885.0,
        production_target: activeZone.production_target ?? 10000.0,
      });
    }
  }, [activeZone]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleZoneSelectChange = (zoneId) => {
    if (typeof onSelectZone === 'function') {
      onSelectZone(zoneId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = [];
    if (formData.drill_depth_m < 0) newErrors.push('Drill depth cannot be negative.');
    if (formData.ndvi < -1.0 || formData.ndvi > 1.0) newErrors.push('NDVI must be between -1.0 and 1.0.');
    if (formData.rainfall_mm < 0 || formData.rainfall_mm > 2000) newErrors.push('Rainfall must be between 0 and 2000 mm.');
    if (formData.equipment_availability < 0 || formData.equipment_availability > 100) newErrors.push('Equipment availability must be between 0 and 100%.');
    if (formData.production_target <= 0) newErrors.push('Production target must be greater than 0.');

    setErrors(newErrors);
    if (newErrors.length === 0) {
      onRunAnalysis(formData);
    }
  };

  return (
    <div class="bg-white border border-gray-200 rounded-xl mb-6 shadow-2xs overflow-hidden">
      {/* Header Bar with Mode Toggle & Zone Dropdown */}
      <div class="px-5 py-3.5 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <Sparkles class="w-4 h-4 text-blue-600" />
            <span>Select Mining Zone & AI Control</span>
          </div>

          <div class="flex bg-gray-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setMode('select')}
              class={`px-3 py-1 rounded-md transition-all ${
                mode === 'select' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span class="flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5" />
                Select Existing Zone
              </span>
            </button>
            <button
              onClick={() => setMode('custom')}
              class={`px-3 py-1 rounded-md transition-all ${
                mode === 'custom' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span class="flex items-center gap-1.5">
                <Edit3 class="w-3.5 h-3.5" />
                Analyze Custom / New Zone
              </span>
            </button>
          </div>
        </div>

        {/* Existing Zone Selection Dropdown */}
        {mode === 'select' && (
          <div class="flex items-center gap-2 bg-white border border-gray-300 px-3 py-1.5 rounded-lg shadow-2xs">
            <span class="text-xs font-bold text-gray-700">Select Mining Zone:</span>
            <select
              value={formData.zone_id}
              onChange={(e) => handleZoneSelectChange(e.target.value)}
              class="bg-transparent text-xs font-black text-blue-700 focus:outline-none cursor-pointer"
            >
              {zonesList?.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>
                  {z.zone_id}
                </option>
              )) || <option value="Z01">Z01</option>}
            </select>
          </div>
        )}
      </div>

      {/* Auto-Loaded Parameters Review & Manual Edit Form */}
      <form onSubmit={handleSubmit} class="p-5">
        {errors.length > 0 && (
          <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs space-y-1">
            {errors.map((err, i) => (
              <div key={i} class="flex items-center gap-1.5 font-medium">
                <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Zone Info */}
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">📍 Zone Info</h4>
            <div>
              <label class="text-[11px] font-semibold text-gray-500">Zone ID</label>
              <input
                type="text"
                readOnly={mode === 'select'}
                value={formData.zone_id}
                onChange={(e) => handleChange('zone_id', e.target.value)}
                class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg font-bold ${
                  mode === 'select' ? 'bg-gray-100 border-gray-200 text-gray-700' : 'bg-white border-gray-300 text-blue-700'
                }`}
              />
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <div>
                <label class="text-[11px] font-semibold text-gray-500">Lat</label>
                <input
                  type="number" step="0.0001" value={formData.latitude}
                  readOnly={mode === 'select'}
                  onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                  class={`w-full mt-0.5 px-2 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label class="text-[11px] font-semibold text-gray-500">Lon</label>
                <input
                  type="number" step="0.0001" value={formData.longitude}
                  readOnly={mode === 'select'}
                  onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                  class={`w-full mt-0.5 px-2 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
            <div>
              <label class="text-[11px] font-semibold text-gray-500">Elevation (m)</label>
              <input
                type="number" step="0.1" value={formData.elevation_m}
                readOnly={mode === 'select'}
                onChange={(e) => handleChange('elevation_m', parseFloat(e.target.value))}
                class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>

          {/* Geology & Drilling */}
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">⚒️ Geology & Drilling</h4>
            <div>
              <label class="text-[11px] font-semibold text-gray-500">Geological Indicator (0-1)</label>
              <input
                type="number" step="0.001" min="0" max="1" value={formData.geological_indicator}
                readOnly={mode === 'select'}
                onChange={(e) => handleChange('geological_indicator', parseFloat(e.target.value))}
                class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-gray-500">Drill Depth (m)</label>
              <input
                type="number" step="0.1" value={formData.drill_depth_m}
                readOnly={mode === 'select'}
                onChange={(e) => handleChange('drill_depth_m', parseFloat(e.target.value))}
                class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-gray-500">Ore Thickness (m)</label>
              <input
                type="number" step="0.1" value={formData.ore_thickness_m}
                readOnly={mode === 'select'}
                onChange={(e) => handleChange('ore_thickness_m', parseFloat(e.target.value))}
                class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>

          {/* Environmental */}
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">🛰️ Environmental</h4>
            <div>
              <label class="text-[11px] font-semibold text-gray-500">Rainfall (mm)</label>
              <input
                type="number" step="0.1" value={formData.rainfall_mm}
                readOnly={mode === 'select'}
                onChange={(e) => handleChange('rainfall_mm', parseFloat(e.target.value))}
                class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-gray-500">Soil Moisture (%)</label>
              <input
                type="number" step="0.1" value={formData.soil_moisture_pct}
                readOnly={mode === 'select'}
                onChange={(e) => handleChange('soil_moisture_pct', parseFloat(e.target.value))}
                class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <div>
                <label class="text-[11px] font-semibold text-gray-500">NDVI</label>
                <input
                  type="number" step="0.001" min="-1" max="1" value={formData.ndvi}
                  readOnly={mode === 'select'}
                  onChange={(e) => handleChange('ndvi', parseFloat(e.target.value))}
                  class={`w-full mt-0.5 px-2 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label class="text-[11px] font-semibold text-gray-500">Temp (°C)</label>
                <input
                  type="number" step="0.1" value={formData.land_surface_temp_c}
                  readOnly={mode === 'select'}
                  onChange={(e) => handleChange('land_surface_temp_c', parseFloat(e.target.value))}
                  class={`w-full mt-0.5 px-2 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          {/* Operational */}
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">🚜 Operational</h4>
            <div>
              <label class="text-[11px] font-semibold text-gray-500">Equipment Downtime (hrs)</label>
              <input
                type="number" step="0.1" value={formData.equipment_downtime}
                readOnly={mode === 'select'}
                onChange={(e) => handleChange('equipment_downtime', parseFloat(e.target.value))}
                class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-gray-500">Equipment Availability (%)</label>
              <input
                type="number" step="0.1" value={formData.equipment_availability}
                readOnly={mode === 'select'}
                onChange={(e) => handleChange('equipment_availability', parseFloat(e.target.value))}
                class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <div>
                <label class="text-[11px] font-semibold text-gray-500">Maint (hrs)</label>
                <input
                  type="number" step="0.1" value={formData.maintenance_hours}
                  readOnly={mode === 'select'}
                  onChange={(e) => handleChange('maintenance_hours', parseFloat(e.target.value))}
                  class={`w-full mt-0.5 px-2 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label class="text-[11px] font-semibold text-gray-500">Blast Delay</label>
                <input
                  type="number" step="0.1" value={formData.blasting_delay}
                  readOnly={mode === 'select'}
                  onChange={(e) => handleChange('blasting_delay', parseFloat(e.target.value))}
                  class={`w-full mt-0.5 px-2 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          {/* Targets & Action Button */}
          <div class="space-y-2 flex flex-col justify-between">
            <div>
              <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1">🎯 Targets</h4>
              <div class="mt-2">
                <label class="text-[11px] font-semibold text-gray-500">Historical Prod (tons)</label>
                <input
                  type="number" step="1" value={formData.historical_production}
                  readOnly={mode === 'select'}
                  onChange={(e) => handleChange('historical_production', parseFloat(e.target.value))}
                  class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div class="mt-2">
                <label class="text-[11px] font-semibold text-gray-500">Production Target (tons)</label>
                <input
                  type="number" step="1" value={formData.production_target}
                  readOnly={mode === 'select'}
                  onChange={(e) => handleChange('production_target', parseFloat(e.target.value))}
                  class={`w-full mt-0.5 px-2.5 py-1 text-xs border rounded-lg font-bold ${mode === 'select' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              class="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isLoading ? (
                <span class="flex items-center gap-2">
                  <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing Zone {formData.zone_id}...
                </span>
              ) : (
                <>
                  <Play class="w-4 h-4 fill-white" />
                  <span>RUN AI ANALYSIS ({formData.zone_id})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

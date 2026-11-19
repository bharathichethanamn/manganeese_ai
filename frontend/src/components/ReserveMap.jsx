import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle } from 'lucide-react';

// Helper component to smoothly center and zoom map when selected zone changes
function RecenterMap({ center, zoom = 11 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true, duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

// Generate realistic boundary polygon vertices centered around latitude & longitude
const getZonePolygonCoordinates = (lat, lng, zoneIdStr) => {
  const num = parseInt((zoneIdStr || '1').replace(/\D/g, ''), 10) || 1;
  const factor = 1 + (num % 5) * 0.08;
  const deltaLat = 0.018;
  const deltaLng = 0.024;

  return [
    [lat + deltaLat * factor * 1.1, lng - deltaLng * factor * 0.4],
    [lat + deltaLat * factor * 0.8, lng + deltaLng * factor * 0.9],
    [lat + deltaLat * factor * 0.2, lng + deltaLng * factor * 1.3],
    [lat - deltaLat * factor * 0.7, lng + deltaLng * factor * 1.1],
    [lat - deltaLat * factor * 1.2, lng + deltaLng * factor * 0.2],
    [lat - deltaLat * factor * 1.0, lng - deltaLng * factor * 0.8],
    [lat - deltaLat * factor * 0.3, lng - deltaLng * factor * 1.2],
    [lat + deltaLat * factor * 0.6, lng - deltaLng * factor * 1.0],
  ];
};

// Create custom pin icon with pill badge matching reference design
const createCustomPinIcon = (label, color) => {
  return L.divIcon({
    className: 'custom-zone-marker-wrapper',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
        <div style="background-color: ${color}; color: white; font-weight: 800; font-size: 12px; font-family: system-ui, -apple-system, sans-serif; padding: 3px 12px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 1.5px solid white; white-space: nowrap; margin-bottom: 2px;">
          ${label}
        </div>
        <div style="width: 22px; height: 22px; background-color: ${color}; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 7px; height: 7px; background-color: white; border-radius: 50%; margin-top: 5px; margin-left: 5px;"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export default function ReserveMap({
  zones,
  zonesList,
  activeZone,
  activeReservePred,
  prodPrediction,
  shortfallPrediction,
  onSelectZone,
}) {
  // Resolve zones list from props
  const allZones = zonesList || zones || [];

  // Determine currently selected zone (only ONE zone displayed)
  const targetZone = activeZone || (allZones.length > 0 ? allZones[0] : null);

  if (!targetZone) {
    return (
      <div className="h-full w-full bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-amber-500" />
        <div className="font-bold text-slate-800 text-sm">Zone Data Missing</div>
        <p className="text-xs text-slate-500 max-w-xs">
          Select a valid mining zone from the dropdown menu to display spatial map data.
        </p>
      </div>
    );
  }

  const zoneId = targetZone.zone_id || 'Z05';
  const lat = targetZone.latitude || 21.45;
  const lng = targetZone.longitude || 79.75;
  const centerCoords = [lat, lng];

  // Format zone display name: Z05 -> Zone 5, Z07 -> Zone 7, Z15 -> Zone 15
  const cleanZoneNum = zoneId.replace(/\D/g, '');
  const cleanZoneName = cleanZoneNum ? `Zone ${parseInt(cleanZoneNum, 10)}` : `Zone ${zoneId}`;

  // 1. Reserve Potential (Geological) ML Classification & Color Mapping
  const potentialClass =
    activeReservePred?.potential_class ||
    targetZone.potential_class ||
    targetZone.predicted_class ||
    'HIGH POTENTIAL';

  const potUpper = potentialClass.toUpperCase();

  let styleInfo = {
    fillColor: '#ef4444', // Red for Low
    borderStrokeColor: '#dc2626',
    textStyleColor: '#dc2626',
    label: 'Low',
  };

  if (potUpper.includes('HIGH')) {
    styleInfo = {
      fillColor: '#22c55e', // Green for High
      borderStrokeColor: '#16a34a',
      textStyleColor: '#16a34a',
      label: 'High',
    };
  } else if (potUpper.includes('MED')) {
    styleInfo = {
      fillColor: '#f59e0b', // Yellow / Orange for Medium
      borderStrokeColor: '#d97706',
      textStyleColor: '#d97706',
      label: 'Medium',
    };
  }

  // 2. Production Shortfall Risk ML Prediction (Reuses exact backend ML model output or thresholds)
  const rawRiskLevel =
    shortfallPrediction?.risk_level ||
    targetZone.shortfall_risk_level ||
    targetZone.risk_level;

  const rawProb =
    shortfallPrediction?.shortfall_probability_pct ??
    targetZone.shortfall_probability_pct;

  let shortfallRiskClean = 'Low';
  let shortfallStyleColor = '#16a34a'; // Green

  if (rawRiskLevel) {
    const rUpper = String(rawRiskLevel).toUpperCase();
    if (rUpper.includes('HIGH')) {
      shortfallRiskClean = 'HIGH';
      shortfallStyleColor = '#dc2626'; // Red
    } else if (rUpper.includes('MED')) {
      shortfallRiskClean = 'MEDIUM';
      shortfallStyleColor = '#d97706'; // Yellow/Orange
    } else {
      shortfallRiskClean = 'LOW';
      shortfallStyleColor = '#16a34a'; // Green
    }
  } else if (typeof rawProb === 'number') {
    if (rawProb >= 60) {
      shortfallRiskClean = 'HIGH';
      shortfallStyleColor = '#dc2626';
    } else if (rawProb >= 30) {
      shortfallRiskClean = 'MEDIUM';
      shortfallStyleColor = '#d97706';
    } else {
      shortfallRiskClean = 'LOW';
      shortfallStyleColor = '#16a34a';
    }
  } else {
    // Operational fallback using exact physical parameter threshold rules
    const downtime = targetZone.equipment_downtime || 0;
    const avail = targetZone.equipment_availability || 100;
    const blast = targetZone.blasting_delay || 0;
    if (downtime > 14 || avail < 70 || blast > 5) {
      shortfallRiskClean = 'HIGH';
      shortfallStyleColor = '#dc2626';
    } else if (downtime > 9 || avail < 82 || blast > 2) {
      shortfallRiskClean = 'MEDIUM';
      shortfallStyleColor = '#d97706';
    }
  }

  // Display formatted probability string e.g. "HIGH (84%)" or "HIGH"
  const probDisplayStr = typeof rawProb === 'number' ? `${shortfallRiskClean} (${rawProb}%)` : shortfallRiskClean;

  // 3. Expected Shortfall Calculation: max(0, Target Production - Forecast Production)
  const targetProdTons = prodPrediction?.target_production_monthly ?? targetZone.production_target ?? 10000;
  const forecastProdTons = prodPrediction?.predicted_production_monthly ?? targetZone.predicted_production_monthly ?? 9150;
  const calculatedShortfallTons = shortfallPrediction?.expected_shortfall_monthly ?? Math.max(0, Math.round(targetProdTons - forecastProdTons));

  // Format Estimated Ore Reserve in Mn Tonnes
  const potScore = activeReservePred?.potential_score || targetZone.potential_score || targetZone.predicted_score || 55;
  const mnTonnesVal = (potScore * 0.0072 + 0.1).toFixed(1);
  const formattedReserveVolume = `${mnTonnesVal} Mn Tonnes`;

  // Model Insight Recommendation text
  let recommendationText = 'Low risk of production shortfall based on current model predictions.';
  if (shortfallRiskClean === 'HIGH') {
    recommendationText = 'High risk of production shortfall based on current model predictions. Operational mitigation recommended.';
  } else if (shortfallRiskClean === 'MEDIUM') {
    recommendationText = 'Moderate risk of production shortfall with balanced operational indicators.';
  }

  // Generate boundary polygon coordinates for target zone ONLY
  const polygonCoords = useMemo(
    () => getZonePolygonCoordinates(lat, lng, zoneId),
    [lat, lng, zoneId]
  );

  // Generate custom marker icon for target zone ONLY
  const customIcon = useMemo(
    () => createCustomPinIcon(cleanZoneName, styleInfo.fillColor),
    [cleanZoneName, styleInfo.fillColor]
  );

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden font-sans">
      {/* Embedded style tweaks for crisp Leaflet popup popovers */}
      <style>{`
        .custom-zone-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          padding: 4px !important;
          border: 1px solid #E2E8F0 !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
          line-height: 1.4 !important;
        }
      `}</style>

      {/* Top Right Legend overlay matching reference design */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-xl p-3 shadow-lg text-xs font-medium space-y-1.5 pointer-events-auto">
        <div className="font-extrabold text-slate-900 text-[11px] tracking-tight mb-1">
          Manganese Reserve Potential
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block shrink-0 shadow-2xs"></span>
          <span>High Potential</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600 inline-block shrink-0 shadow-2xs"></span>
          <span>Medium Potential</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 inline-block shrink-0 shadow-2xs"></span>
          <span>Low Potential</span>
        </div>
      </div>

      {/* Main Leaflet Map */}
      <MapContainer
        center={centerCoords}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Recenter & zoom automatically whenever selected zone changes */}
        <RecenterMap center={centerCoords} zoom={11} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Display ONLY the currently selected zone (no other zones are rendered) */}
        {targetZone && (
          <>
            {/* Colored Polygon for Selected Zone Boundary */}
            <Polygon
              positions={polygonCoords}
              pathOptions={{
                color: styleInfo.borderStrokeColor,
                fillColor: styleInfo.fillColor,
                fillOpacity: 0.32,
                weight: 2.5,
              }}
            />

            {/* Marker Pin & Label for Selected Zone ONLY */}
            <Marker position={centerCoords} icon={customIcon}>
              <Popup autoPan={true} closeButton={true}>
                <div className="p-0.5 min-w-[240px] max-w-[280px] font-sans">
                  <div className="font-extrabold text-sm text-slate-900 mb-2 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span>{cleanZoneName}</span>
                  </div>

                  <div className="space-y-1.5 my-2.5 text-xs text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Reserve Potential (Geological):</span>
                      <span className="font-extrabold" style={{ color: styleInfo.textStyleColor }}>
                        {styleInfo.label}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Estimated Reserve:</span>
                      <span className="font-extrabold text-slate-900">{formattedReserveVolume}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Production Shortfall Risk:</span>
                      <span className="font-extrabold" style={{ color: shortfallStyleColor }}>
                        {probDisplayStr}
                      </span>
                    </div>

                    {calculatedShortfallTons > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Expected Deficit:</span>
                        <span className="font-extrabold text-rose-600">
                          {calculatedShortfallTons.toLocaleString()} Tons/mo
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-2 mt-2 text-[11px] text-slate-600 leading-relaxed font-normal">
                    {recommendationText}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

import React from 'react';
import { Play, MapPin } from 'lucide-react';

export default function AnalysisPendingBanner({
  zoneId,
  activeZone,
  onRunAnalysis,
  isLoading,
  moduleName = 'AI Analysis',
}) {
  const currentZone = activeZone?.zone_id || zoneId;

  return (
    <div className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-8 sm:p-14 text-center my-4 shadow-sm space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-100/80 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
        {currentZone ? (
          <Play className="w-7 h-7 ml-0.5 fill-blue-600" />
        ) : (
          <MapPin className="w-7 h-7 text-blue-600" />
        )}
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-xl font-extrabold text-slate-900">
          {currentZone
            ? `${moduleName} Pending for Zone ${currentZone}`
            : `Select a Mining Zone to Begin ${moduleName}`}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {currentZone ? (
            <>
              Zone <span className="font-bold text-blue-600">{currentZone}</span> parameters have been loaded. Click <span className="font-bold text-blue-600">Run AI Analysis</span> to calculate live AI predictions and unlock detailed insights for this module.
            </>
          ) : (
            <>
              Please select a mining zone from the dropdown menu to populate historical data and run AI analysis.
            </>
          )}
        </p>
      </div>

      {currentZone ? (
        <button
          onClick={onRunAnalysis}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Executing ML Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run AI Analysis for Zone {currentZone}</span>
            </>
          )}
        </button>
      ) : (
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl">
          <MapPin className="w-4 h-4" />
          <span>Select a Mining Zone Above</span>
        </div>
      )}
    </div>
  );
}

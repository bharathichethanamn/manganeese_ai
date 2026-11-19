import React from 'react';
import {
  LayoutDashboard,
  Compass,
  TrendingUp,
  AlertTriangle,
  Sliders,
  CloudSun,
  BrainCircuit,
  Lightbulb,
  FileText,
  Pickaxe,
  Leaf,
  Wrench,
  UploadCloud,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Data Upload', icon: UploadCloud },
    { id: 'reserve', label: 'Reserve Intelligence', icon: Compass },
    { id: 'production', label: 'Production Forecast', icon: TrendingUp },
    { id: 'shortfall', label: 'Shortfall Risk', icon: AlertTriangle },
    { id: 'equipment', label: 'Equipment Failure AI', icon: Wrench },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'environmental', label: 'Satellite & Weather', icon: CloudSun },
    { id: 'explainability', label: 'AI Explainability', icon: BrainCircuit },
    { id: 'recommendations', label: 'Recommendation Engine', icon: Lightbulb },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center gap-2.5 px-3 py-4 mb-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
            <Pickaxe className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-lg text-blue-700 leading-none">ManganeseAI</div>
            <div className="text-[10px] text-gray-400 font-medium mt-1">Mining Intelligence</div>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                    : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Visual Card matching Reference UI */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white relative overflow-hidden shadow-sm border border-slate-800 space-y-2">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
          <Leaf className="w-3.5 h-3.5" />
          <span>Eco-Mining Platform</span>
        </div>
        <h4 className="font-bold text-xs leading-snug text-slate-100">
          Smarter Insights for a Sustainable Mining Future
        </h4>
        <p className="text-[10px] text-slate-400 leading-tight">
          AI-driven operational optimization reducing carbon footprint.
        </p>
      </div>
    </aside>
  );
}

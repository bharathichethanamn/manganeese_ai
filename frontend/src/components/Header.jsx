import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Bell, User, Pickaxe, Play, ArrowRight } from 'lucide-react';

export default function Header({
  zonesList,
  activeZone,
  onSelectZone,
  currentUser,
  onLogout,
  onRunAnalysis,
  isLoading,
  hasRunAnalysis,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
}) {
  const currentZoneId = activeZone?.zone_id || '';
  const roleName = currentUser?.role || 'Mining Analyst';
  const userName = currentUser?.name || 'Alex Morgan';

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications ? notifications.filter((n) => !n.read).length : 0;

  const handleNotificationClick = (notif) => {
    if (onMarkAsRead) onMarkAsRead(notif.id);
    if (onNavigate && notif.target_tab) onNavigate(notif.target_tab);
    setIsNotificationOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs mb-6 rounded-xl">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
          <Pickaxe className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-blue-700 tracking-tight">ManganeseAI</h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">Mining Intelligence & Decision Support</p>
        </div>
      </div>

      {/* Header Selectors & User Info */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Zone Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="text-gray-500">Select Mining Zone:</span>
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

        {/* Run AI Analysis Button in Header */}
        {onRunAnalysis && (
          <button
            onClick={() => activeZone && onRunAnalysis(activeZone)}
            disabled={isLoading || !activeZone}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
              !activeZone
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : hasRunAnalysis
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
            }`}
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className={`w-3.5 h-3.5 ${hasRunAnalysis ? 'fill-emerald-600 text-emerald-600' : 'fill-white'}`} />
            )}
            <span>{hasRunAnalysis ? 'AI Analyzed' : 'Run AI Analysis'}</span>
          </button>
        )}

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select className="bg-transparent focus:outline-none cursor-pointer font-bold text-gray-800">
            <option>Jan 2025 - Dec 2025</option>
            <option>Jan 2024 - Dec 2024</option>
          </select>
        </div>

        {/* Notification Bell & Dropdown Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            className="relative p-2 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-lg text-gray-600 cursor-pointer transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shadow-xs border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Clean Notification Dropdown Popover Panel */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden text-slate-900">
              {/* Header */}
              <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400 fill-blue-400" />
                  <span className="font-extrabold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {notifications && notifications.length > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-[11px] font-bold text-blue-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {!notifications || notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No active notifications</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Run AI Analysis for a mining zone to calculate real ML risk alerts.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 transition-colors flex flex-col gap-2 ${
                        !notif.read ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{notif.badge_emoji}</span>
                          <span className="font-extrabold text-xs text-slate-900 leading-tight">
                            {notif.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                          {notif.timestamp}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md">
                        {notif.result_text}
                      </div>

                      {notif.recommendation && (
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                          {notif.recommendation}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Zone {notif.zone_id}
                        </span>
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>{notif.button_label || 'View Module'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2.5 bg-blue-50/80 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-900">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="leading-tight font-extrabold text-slate-800">{userName}</span>
            <span className="text-[10px] text-blue-600 font-semibold">{roleName}</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="ml-2 px-2 py-1 text-[11px] bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-700 font-semibold rounded transition-colors"
              title="Sign Out"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { Users, Clock, MapPin, Calendar, BarChart3, Settings } from 'lucide-react';
import { AppTab } from '../types';
import { useContacts } from '../context/ContactsContext';

interface BottomNavProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { duplicates } = useContacts();

  const navItems: Array<{ tab: AppTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> = [
    { tab: 'contacts', label: 'Contactos', icon: Users },
    { tab: 'timeline', label: 'Timeline', icon: Clock },
    { tab: 'map', label: 'Mapa', icon: MapPin },
    { tab: 'calendar', label: 'Calendario', icon: Calendar },
    { tab: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { tab: 'settings', label: 'Ajustes', icon: Settings, badge: duplicates.length > 0 ? duplicates.length : undefined },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-lg mx-auto px-2 py-1.5 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => setCurrentTab(item.tab)}
              className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

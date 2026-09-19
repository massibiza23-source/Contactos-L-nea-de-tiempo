import React from 'react';
import { Search, RefreshCw, UserPlus, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { AppTab } from '../types';

interface HeaderProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  onOpenSearch: () => void;
  onOpenAddContact: () => void;
  onOpenAiAssistant: () => void;
  onOpenImportExport?: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSearch,
  onOpenAddContact,
  onOpenAiAssistant,
  onOpenImportExport,
  onOpenInstallModal,
}) => {
  const { contacts, settings, isSyncing, syncDeviceContacts } = useContacts();

  const formattedCount = new Intl.NumberFormat('es-ES').format(contacts.length);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Title and Dynamic Subtitle */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Mis Contactos
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                <ShieldCheck className="w-3 h-3" />
                Local
              </span>
            </div>
            <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formattedCount}</span> contactos
              <span className="hidden sm:inline"> · Sincronizado: {settings.lastSyncDate || 'hoy'}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Search */}
            <button
              onClick={onOpenSearch}
              className="p-1.5 sm:px-3 sm:py-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 text-xs sm:text-sm font-medium"
              title="Buscar contactos"
              aria-label="Buscar contactos"
            >
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Buscar</span>
            </button>

            {/* AI Assistant */}
            <button
              onClick={onOpenAiAssistant}
              className="p-1.5 sm:px-3 sm:py-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all flex items-center gap-1.5 text-xs sm:text-sm font-medium"
              title="Asistente de IA"
              aria-label="Asistente de IA"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">IA</span>
            </button>

            {/* Import Button */}
            {onOpenImportExport && (
              <button
                onClick={onOpenImportExport}
                className="p-1.5 sm:px-3 sm:py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 text-xs sm:text-sm font-medium"
                title="Importar contactos y números"
                aria-label="Importar contactos"
              >
                <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Importar</span>
              </button>
            )}

            {/* Sync */}
            <button
              onClick={syncDeviceContacts}
              disabled={isSyncing}
              className="p-1.5 sm:px-3 sm:py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 text-xs sm:text-sm font-medium"
              title="Sincronizar contactos"
              aria-label="Sincronizar contactos"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 dark:text-slate-400 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden md:inline">Sincronizar</span>
            </button>

            {/* Add Contact Primary */}
            <button
              onClick={onOpenAddContact}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-sm shadow-indigo-500/20 font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all"
              title="Añadir contacto"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Añadir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

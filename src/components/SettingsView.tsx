import React, { useState } from 'react';
import {
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
  ArrowUpDown,
  Lock,
  Database,
  Sparkles,
  Info,
  ChevronRight,
  Trash2,
  Download,
  KeyRound,
  Check,
  Smartphone,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { SortOption } from '../types';

interface SettingsViewProps {
  onOpenPrivacyModal: () => void;
  onOpenImportExport: () => void;
  onOpenInstallModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenPrivacyModal,
  onOpenImportExport,
  onOpenInstallModal,
}) => {
  const {
    settings,
    updateSettings,
    contacts,
    wipeAllData,
    deleteSampleContacts,
    loadSampleContacts,
    hasSampleContacts,
  } = useContacts();

  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSavedFeedback, setPinSavedFeedback] = useState(false);
  const [sampleDeletedFeedback, setSampleDeletedFeedback] = useState(false);

  const handleSavePin = () => {
    if (pinInput.length === 4) {
      updateSettings({ pinLockEnabled: true, pinCode: pinInput });
      setShowPinSetup(false);
      setPinSavedFeedback(true);
      setTimeout(() => setPinSavedFeedback(false), 2000);
    }
  };

  const handleDisablePin = () => {
    updateSettings({ pinLockEnabled: false, pinCode: '' });
    setPinInput('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Configuración
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Preferencias de visualización, seguridad local y privacidad
        </p>
      </div>

      {/* 1. Apariencia */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sun className="w-4 h-4 text-indigo-500" /> Apariencia
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => updateSettings({ theme: 'light' })}
            className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              settings.theme === 'light'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Claro</span>
          </button>

          <button
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              settings.theme === 'dark'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Oscuro</span>
          </button>

          <button
            onClick={() => updateSettings({ theme: 'system' })}
            className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              settings.theme === 'system'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span>Sistema</span>
          </button>
        </div>
      </div>

      {/* 2. Pantalla de Inicio y Acceso Directo Android */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="Icono Android"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-md flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pantalla de Inicio / Acceso Directo
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                  Android HD
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Iconos PNG oficiales (192×192, 512×512, adaptativo y accesos directos)
              </p>
            </div>
          </div>

          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/20"
            >
              <Smartphone className="w-4 h-4" />
              <span>Instalar / Iconos</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Orden Predeterminado */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-indigo-500" /> Orden Predeterminado
        </h3>

        <select
          value={settings.sortBy}
          onChange={(e) => updateSettings({ sortBy: e.target.value as SortOption })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white outline-none"
        >
          <option value="created_desc">Más recientes primero (Cronológico inverso)</option>
          <option value="created_asc">Más antiguos primero</option>
          <option value="name_asc">Nombre alfabético A-Z</option>
          <option value="name_desc">Nombre alfabético Z-A</option>
          <option value="updated_desc">Última modificación</option>
        </select>
      </div>

      {/* 3. Seguridad & Bloqueo con PIN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bloqueo con PIN Local
              </h3>
              <p className="text-xs text-slate-500">
                Protege el acceso a tu lista de contactos en este navegador
              </p>
            </div>
          </div>

          {settings.pinLockEnabled ? (
            <button
              onClick={handleDisablePin}
              className="text-xs font-semibold text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-50"
            >
              Desactivar PIN
            </button>
          ) : (
            <button
              onClick={() => setShowPinSetup(true)}
              className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700"
            >
              Activar PIN
            </button>
          )}
        </div>

        {showPinSetup && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200/80 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Introduce un código de 4 dígitos:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-mono text-base tracking-widest outline-none"
              />
              <button
                onClick={handleSavePin}
                disabled={pinInput.length !== 4}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
              >
                Guardar PIN
              </button>
              <button
                onClick={() => setShowPinSetup(false)}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {pinSavedFeedback && (
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> PIN configurado con éxito.
          </p>
        )}
      </div>

      {/* 4. Inteligencia Artificial Gemini */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Funciones de IA (Gemini)
              </h3>
              <p className="text-xs text-slate-500">
                Opcional con consentimiento explícito según Regla 21
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowAiFeatures}
              onChange={(e) => updateSettings({ allowAiFeatures: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
          </label>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {settings.allowAiFeatures
            ? 'La IA está habilitada para análisis semántico opcional de duplicados y categorizaciones cuando tú lo solicites.'
            : 'La IA está completamente deshabilitada. Tus contactos no se envían a ningún modelo externo.'}
        </p>
      </div>

      {/* 5. Datos & Copia de Seguridad */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" /> Gestión de Datos
        </h3>

        <div className="space-y-2">
          {hasSampleContacts ? (
            <button
              onClick={() => {
                deleteSampleContacts();
                setSampleDeletedFeedback(true);
                setTimeout(() => setSampleDeletedFeedback(false), 2500);
              }}
              className="w-full p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-between text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300 transition-colors border border-rose-200 dark:border-rose-900/60"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Eliminar todos los contactos de ejemplo</span>
              </div>
              <span className="text-[11px] bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full font-bold">
                Borrar ejemplos
              </span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <Check className="w-4 h-4" />
                Sin contactos de ejemplo (agenda limpia)
              </span>
              <button
                onClick={loadSampleContacts}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 underline font-semibold hover:text-indigo-700"
              >
                Cargar demo
              </button>
            </div>
          )}

          {sampleDeletedFeedback && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 px-1">
              <Check className="w-3.5 h-3.5" /> Contactos de ejemplo eliminados con éxito.
            </p>
          )}

          <button
            onClick={onOpenImportExport}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors"
          >
            <span>Importar o exportar archivos (VCF, CSV, JSON)</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={onOpenPrivacyModal}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors"
          >
            <span>Políticas de privacidad y eliminación de datos</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center py-4 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-600 dark:text-slate-300">
          Contacts Timeline AI · v1.0.0
        </p>
        <p>100% Offline-First · Diseñado para máxima privacidad y orden cronológico</p>
      </div>
    </div>
  );
};

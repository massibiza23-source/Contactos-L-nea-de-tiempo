import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  EyeOff,
  Trash2,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ServerOff,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  const { wipeAllData, contacts } = useContacts();
  const [confirmWipe, setConfirmWipe] = useState(false);

  if (!isOpen) return null;

  const handleWipe = () => {
    wipeAllData();
    setConfirmWipe(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Privacidad & Compromiso Local
              </h2>
              <span className="text-xs text-slate-500">Tus contactos te pertenecen a ti</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          {/* Key Principles Grid */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3">
              <ServerOff className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300">
                  Arquitectura 100% Offline-First
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                  Tus contactos se almacenan y procesan en la memoria local de tu dispositivo. No tenemos servidores centrales que almacenen tus libretas de direcciones.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Sin Venta de Datos ni Publicidad
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  No hay rastreadores publicitarios, analíticas invasivas ni venta de perfiles comerciales a terceros.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Sin Entrenamiento de Modelos de IA
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tus nombres, teléfonos y correos nunca se utilizan para alimentar o entrenar modelos de Inteligencia Artificial.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Cumplimiento Estricto RGPD / UE
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Derecho pleno de acceso, exportación y borrado inmediato en un solo clic.
                </p>
              </div>
            </div>
          </div>

          {/* Delete All Data Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                <Trash2 className="w-4 h-4" />
                <span>Zona de eliminación de datos</span>
              </div>
              <p className="text-xs text-rose-800/80 dark:text-rose-300/80">
                Puedes purgar todos los {contacts.length} contactos de la base de datos local de la aplicación en cualquier momento.
              </p>

              {confirmWipe ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold text-rose-600">
                    ¿Estás completamente seguro? Esta acción borrará la base de datos local de la app.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmWipe(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 bg-white dark:bg-slate-800 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleWipe}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                    >
                      Sí, eliminar todo definitivamente
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmWipe(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Eliminar todos los datos de la app
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

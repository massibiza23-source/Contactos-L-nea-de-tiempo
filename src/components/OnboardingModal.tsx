import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { contacts, updateSettings } = useContacts();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);

  if (!isOpen) return null;

  const handleGrantPermission = () => {
    setStep(3);
    // Simulate smart local analysis animation
    let prog = 0;
    const timer = setInterval(() => {
      prog += 20;
      setAnalyzingProgress(prog);
      if (prog >= 100) {
        clearInterval(timer);
        setTimeout(() => setStep(4), 400);
      }
    }, 250);
  };

  const handleFinish = () => {
    updateSettings({ onboardingCompleted: true, permissionsGranted: true });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-hidden text-center relative">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Organiza todos tus contactos en un solo lugar
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Contacts Timeline AI convierte tu libreta desordenada en una línea temporal inteligente, ordenada cronológicamente por la fecha exacta en que los conociste.
            </p>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <span>Comenzar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Permissions & Privacy */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Privacidad absoluta garantizada
            </h2>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-left space-y-2 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Procesamiento 100% local en tu dispositivo</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                • Los contactos nunca salen de tu navegador ni se suben a la nube.
                <br />
                • Sin venta de datos, sin anuncios, sin rastreadores.
                <br />
                • No se inventan fechas: mostramos la fecha real del SO o indicamos claramente su ausencia.
              </p>
            </div>

            <button
              onClick={handleGrantPermission}
              className="w-full mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <span>Autorizar sincronización local</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: Analyzing */}
        {step === 3 && (
          <div className="space-y-5 py-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Analizando contactos...
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Extrayendo metadatos cronológicos y normalizando números internacionales
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${analyzingProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-400 font-semibold">{analyzingProgress}%</span>
          </div>
        )}

        {/* STEP 4: Success & Dashboard ready */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              ¡Contactos organizados por fecha!
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Hemos organizado tus <strong className="text-slate-900 dark:text-white">{contacts.length} contactos</strong> en la línea temporal. Ya puedes explorar, filtrar y gestionar duplicados.
            </p>

            <button
              onClick={handleFinish}
              className="w-full mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <span>Ver mi agenda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

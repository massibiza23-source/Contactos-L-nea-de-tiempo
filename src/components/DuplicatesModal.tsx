import React, { useState } from 'react';
import {
  X,
  Copy,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Phone,
  Mail,
  Building,
  Tag as TagIcon,
  ShieldCheck,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { formatPhoneDisplay } from '../utils/phoneUtils';
import { formatDate } from '../utils/dateUtils';
import { DuplicateCandidate } from '../types';

interface DuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DuplicatesModal: React.FC<DuplicatesModalProps> = ({ isOpen, onClose }) => {
  const { duplicates, mergeDuplicates, ignoreDuplicate, contacts, settings } = useContacts();
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPair: DuplicateCandidate | undefined = duplicates[selectedPairIndex];

  const handleMerge = () => {
    if (!currentPair) return;
    mergeDuplicates(currentPair.contactA.id, currentPair.contactB.id);
    if (selectedPairIndex >= duplicates.length - 1) {
      setSelectedPairIndex(Math.max(0, duplicates.length - 2));
    }
  };

  const handleIgnore = () => {
    if (!currentPair) return;
    const pairKey = [currentPair.contactA.id, currentPair.contactB.id].sort().join('___');
    ignoreDuplicate(pairKey);
    if (selectedPairIndex >= duplicates.length - 1) {
      setSelectedPairIndex(Math.max(0, duplicates.length - 2));
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!currentPair) return;
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);

    try {
      const res = await fetch('/api/ai/analyze-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactA: currentPair.contactA,
          contactB: currentPair.contactB,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al conectar con el servicio de IA');
      }

      const data = await res.json();
      setAiAnalysisResult(data.explanation || data.reason || 'Análisis completado');
    } catch (err: any) {
      setAiAnalysisResult(`Aviso de IA: ${err.message || 'No se pudo realizar el análisis'}`);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Gestión de duplicados
              </h2>
              <p className="text-xs text-slate-500">
                {duplicates.length} {duplicates.length === 1 ? 'posible duplicado detectado' : 'posibles duplicados detectados'}
              </p>
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
        {duplicates.length === 0 ? (
          <div className="p-8 sm:p-12 text-center my-auto">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              ¡Tu agenda está completamente limpia!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              No se han encontrado contactos duplicados por número de teléfono, email ni coincidencia exacta de nombres.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Volver a contactos
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Candidate Selector Tabs */}
            {duplicates.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {duplicates.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPairIndex(idx);
                      setAiAnalysisResult(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      selectedPairIndex === idx
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Caso {idx + 1}: {item.contactA.name} ({Math.round(item.confidence * 100)}%)
                  </button>
                ))}
              </div>
            )}

            {currentPair && (
              <div className="space-y-4">
                {/* Confidence Bar & Match Reasons */}
                <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Coincidencia del {Math.round(currentPair.confidence * 100)}%
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Caso {selectedPairIndex + 1} de {duplicates.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 font-medium border border-rose-200 dark:border-rose-900/60">
                      {currentPair.description}
                    </span>
                  </div>
                </div>

                {/* Side-by-side comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Contacto A */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: currentPair.contactA.color || '#6366f1' }}
                      >
                        {currentPair.contactA.name[0]}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Contacto A
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {currentPair.contactA.name} {currentPair.contactA.lastName || ''}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      {currentPair.contactA.phones.map((p, i) => (
                        <div key={i} className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{formatPhoneDisplay(p.number)}</span>
                        </div>
                      ))}

                      {currentPair.contactA.emails.map((e, i) => (
                        <div key={i} className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{e.email}</span>
                        </div>
                      ))}

                      {currentPair.contactA.company && (
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{currentPair.contactA.company}</span>
                        </div>
                      )}

                      <div className="pt-2 text-[11px] text-slate-400">
                        Guardado: {currentPair.contactA.createdAt ? formatDate(currentPair.contactA.createdAt) : 'Sin fecha'}
                      </div>
                    </div>
                  </div>

                  {/* Contacto B */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: currentPair.contactB.color || '#3b82f6' }}
                      >
                        {currentPair.contactB.name[0]}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Contacto B
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {currentPair.contactB.name} {currentPair.contactB.lastName || ''}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      {currentPair.contactB.phones.map((p, i) => (
                        <div key={i} className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{formatPhoneDisplay(p.number)}</span>
                        </div>
                      ))}

                      {currentPair.contactB.emails.map((e, i) => (
                        <div key={i} className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{e.email}</span>
                        </div>
                      ))}

                      {currentPair.contactB.company && (
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{currentPair.contactB.company}</span>
                        </div>
                      )}

                      <div className="pt-2 text-[11px] text-slate-400">
                        Guardado: {currentPair.contactB.createdAt ? formatDate(currentPair.contactB.createdAt) : 'Sin fecha'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Gemini AI Deep Analysis */}
                <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Análisis inteligente con Gemini (Opcional)
                      </span>
                    </div>

                    <button
                      onClick={handleRunAiAnalysis}
                      disabled={isAiAnalyzing}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isAiAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                    </button>
                  </div>

                  {aiAnalysisResult && (
                    <div className="mt-2.5 pt-2 border-t border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                      {aiAnalysisResult}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Footer */}
        {duplicates.length > 0 && currentPair && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-2">
            <button
              onClick={handleIgnore}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Mantener separados
            </button>

            <button
              onClick={handleMerge}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Fusionar contactos</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

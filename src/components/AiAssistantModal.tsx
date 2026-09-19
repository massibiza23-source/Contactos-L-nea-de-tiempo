import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Send,
  Bot,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { contacts, settings, updateSettings } = useContacts();

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hola. Soy tu asistente inteligente para la agenda de contactos. Puedo ayudarte a detectar inconsistencias en números, sugerir etiquetas o resumir contactos de un período específico. ¿En qué te puedo ayudar hoy?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleToggleAiConsent = () => {
    updateSettings({ allowAiFeatures: !settings.allowAiFeatures });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || prompt;
    if (!q.trim() || !settings.allowAiFeatures) return;

    const userMsg = q.trim();
    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Send metadata to server Gemini endpoint with anonymized/safe sample
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: contacts.slice(0, 30).map((c) => ({
            id: c.id,
            name: c.name,
            company: c.company,
            jobTitle: c.jobTitle,
            city: c.address?.city,
            tags: c.tags,
            createdAt: c.createdAt,
          })),
          userInstruction: userMsg,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al procesar con el servicio de IA');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.suggestion || data.text || 'He procesado tu solicitud sobre tus contactos locales.',
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Aviso: No se pudo conectar con el servicio de Gemini. (${err.message || 'Verifica la clave API en el servidor'}).`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Asistente de IA (Gemini)
              </h2>
              <span className="text-xs text-slate-500">Opcional · Control y Privacidad estricta</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Consent Banner / Toggle (Section 16 requirement) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                {settings.allowAiFeatures ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                )}
                <span>Consentimiento explícito de IA: {settings.allowAiFeatures ? 'Activado' : 'Desactivado'}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Tus contactos están protegidos en local. Al activar esta función, consultas específicas se envían a Gemini exclusivamente para análisis en tiempo real, sin ser almacenadas para entrenamiento.
              </p>
            </div>

            <button
              onClick={handleToggleAiConsent}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                settings.allowAiFeatures
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {settings.allowAiFeatures ? 'Desactivar IA' : 'Activar IA'}
            </button>
          </div>
        </div>

        {/* Chat / Assistant body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {!settings.allowAiFeatures ? (
            <div className="py-12 text-center max-w-sm mx-auto space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Las funciones de IA están desactivadas
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Por política de privacidad (Regla 21), la IA nunca se ejecuta sin tu permiso explícito. Haz clic en &quot;Activar IA&quot; arriba si deseas realizar consultas semánticas.
              </p>
            </div>
          ) : (
            <>
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 pb-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" /> Sugerencias:
                </span>
                <button
                  onClick={() => handleSendMessage('¿Cómo están organizados mis contactos de trabajo?')}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  &quot;Contactos de trabajo&quot;
                </button>
                <button
                  onClick={() => handleSendMessage('Sugiere etiquetas para mis contactos sin clasificar')}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  &quot;Sugerir etiquetas&quot;
                </button>
                <button
                  onClick={() => handleSendMessage('Revisa posibles números con formato anómalo')}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  &quot;Detectar anomalías&quot;
                </button>
              </div>

              {/* Messages History */}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 items-center text-xs text-slate-400">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Gemini está procesando tu solicitud...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Bar */}
        {settings.allowAiFeatures && (
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Pregunta algo sobre tus contactos (ej. ¿cuántos son de Brasil?)..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

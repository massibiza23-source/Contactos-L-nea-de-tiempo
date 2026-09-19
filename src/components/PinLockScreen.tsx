import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck } from 'lucide-react';
import { useContacts } from '../context/ContactsContext';

export const PinLockScreen: React.FC = () => {
  const { settings, setIsPinLocked } = useContacts();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(false);

      if (next.length === 4) {
        if (next === settings.pinCode) {
          setIsPinLocked(false);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900 text-white">
      <div className="w-full max-w-xs text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold">Contacts Timeline AI</h2>
          <p className="text-xs text-slate-400 mt-1">Introduce tu PIN de 4 dígitos para desbloquear</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? error
                    ? 'bg-rose-500 border-rose-500'
                    : 'bg-indigo-500 border-indigo-500 scale-110'
                  : 'border-slate-600'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-semibold animate-shake">
            PIN incorrecto. Inténtalo de nuevo.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xl font-bold flex items-center justify-center transition-colors active:scale-95 mx-auto"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xl font-bold flex items-center justify-center transition-colors active:scale-95 mx-auto"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors active:scale-95 mx-auto"
            aria-label="Borrar dígito"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <div className="pt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Protección local activa</span>
        </div>
      </div>
    </div>
  );
};

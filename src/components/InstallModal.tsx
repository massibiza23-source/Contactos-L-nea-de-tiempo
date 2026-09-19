import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Share2,
  PlusCircle,
  Clock,
  MapPin,
  Check
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const iconAssets = [
    {
      name: 'Android Launcher (192x192)',
      filename: 'pwa-192x192.png',
      size: '192 × 192 px',
      type: 'PNG estándar para pantalla de inicio Android',
      src: '/pwa-192x192.png'
    },
    {
      name: 'Android HD Splash (512x512)',
      filename: 'pwa-512x512.png',
      size: '512 × 512 px',
      type: 'PNG alta resolución para launcher y splash screen',
      src: '/pwa-512x512.png'
    },
    {
      name: 'Android Adaptativo Maskable (512x512)',
      filename: 'pwa-maskable-512x512.png',
      size: '512 × 512 px',
      type: 'PNG con zona segura 15% para iconos circulares/cuadrados',
      src: '/pwa-maskable-512x512.png'
    },
    {
      name: 'Apple Touch Icon (180x180)',
      filename: 'apple-touch-icon.png',
      size: '180 × 180 px',
      type: 'PNG para dispositivos iOS / iPadOS',
      src: '/apple-touch-icon.png'
    },
    {
      name: 'Acceso Directo (96x96)',
      filename: 'shortcut-icon-96x96.png',
      size: '96 × 96 px',
      type: 'Icono PNG para menú rápido de accesos directos',
      src: '/shortcut-icon-96x96.png'
    }
  ];

  const handleDownload = (filename: string, src: string) => {
    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white dark:from-slate-800/40 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Instalar en Android / Acceso Directo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Iconos PNG optimizados y acceso a pantalla de inicio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Main App Icon Preview & Install Action */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-shrink-0">
              <img
                src="/pwa-192x192.png"
                alt="Icono de la aplicación"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl shadow-xl border-2 border-white/20 object-cover"
              />
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
                HD PNG
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-extrabold text-base leading-tight">
                Contacts Timeline AI
              </h4>
              <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                Icono oficial diseñado para la pantalla de inicio de tu Android con soporte para temas oscuros y adaptables.
              </p>

              {isInstalled ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 text-xs font-semibold mt-3 text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Aplicación ya instalada en tu dispositivo</span>
                </div>
              ) : isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  className="mt-3 px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar ahora en pantalla de inicio</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-xs font-medium mt-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Listo para agregar como acceso directo</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts configured in Manifest */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Accesos Directos Rápidos de Android (App Shortcuts)</span>
            </div>
            <p className="text-xs text-slate-500">
              Al mantener presionado el icono de la app en la pantalla de inicio de Android, aparecerán estos accesos directos:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Nuevo Contacto</p>
                  <p className="text-[10px] text-slate-400">Acceso inmediato</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Línea de Tiempo</p>
                  <p className="text-[10px] text-slate-400">Vista cronológica</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Mapa</p>
                  <p className="text-[10px] text-slate-400">Ver ubicaciones</p>
                </div>
              </div>
            </div>
          </div>

          {/* Android Installation Instructions Guide */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              <span>Cómo añadir a la Pantalla de Inicio en Android (Chrome / Brave / Samsung)</span>
            </h4>

            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Abre el menú de opciones del navegador tocando los <strong>tres puntos (⋮)</strong> en la esquina superior derecha.
              </li>
              <li>
                Toca en <strong>«Añadir a la pantalla de inicio»</strong> o <strong>«Instalar aplicación»</strong>.
              </li>
              <li>
                Confirma el nombre <strong>Contacts</strong> y pulsa <strong>«Añadir»</strong> o <strong>«Instalar»</strong>.
              </li>
              <li>
                El icono PNG en alta definición aparecerá directamente en tu pantalla de inicio junto a tus demás aplicaciones nativas.
              </li>
            </ol>
          </div>

          {/* Downloadable PNG Icons List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Archivos PNG Generados para Descargar
              </span>
              <span className="text-[11px] text-slate-400">Formato PNG 100% optimizado</span>
            </div>

            <div className="space-y-2">
              {iconAssets.map((asset) => (
                <div
                  key={asset.filename}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={asset.src}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl bg-slate-900 object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {asset.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {asset.size} · {asset.type}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(asset.filename, asset.src)}
                    className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
                    title={`Descargar ${asset.filename}`}
                  >
                    {downloadSuccess === asset.filename ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500 text-[11px]">Descargado</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline text-[11px]">Descargar</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Compatible con Android 8.0+ y launchers modernos
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 font-semibold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  Smartphone,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Globe,
  ClipboardPaste,
  Loader2,
  Sparkles,
  Mail,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { parseVCF, exportToVCF } from '../utils/vcfUtils';
import { parseCSV, exportToCSV } from '../utils/csvUtils';
import { pickDeviceContacts, isContactPickerSupported } from '../utils/deviceContacts';
import { fetchGoogleContacts } from '../utils/googleContacts';
import { parsePastedNumbers } from '../utils/textParser';
import { Contact } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const {
    contacts,
    filteredContacts,
    importContacts,
    exportBackupJSON,
    restoreBackupJSON,
    settings,
  } = useContacts();

  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'backup'>('import');
  const [importPreview, setImportPreview] = useState<Partial<Contact>[] | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');
  const [pastedEmail, setPastedEmail] = useState<string>('');
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Google Contacts Sync via OAuth
  const handleImportGoogleContacts = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    setProcessingStatus('Iniciando autenticación segura con Google...');
    try {
      const res = await fetchGoogleContacts((count, msg) => {
        setProcessingStatus(msg);
      });

      if (res.contacts.length > 0) {
        setImportPreview(res.contacts);
        setStatusMessage({
          type: 'success',
          text: `Se han cargado ${res.contacts.length} contactos reales de tu cuenta de Google.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'No se encontraron contactos en la cuenta de Google vinculada.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al importar de Google: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Handle Pasted Numbers Parsing
  const handleParsePastedNumbers = () => {
    if (!pastedText.trim()) return;
    const parsed = parsePastedNumbers(pastedText, pastedEmail);
    if (parsed.length > 0) {
      setImportPreview(parsed);
      setShowPasteBox(false);
      setPastedText('');
      setPastedEmail('');
      setStatusMessage({
        type: 'success',
        text: `Se extrajeron ${parsed.length} contactos a partir del texto ingresado.`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'No se detectaron teléfonos o nombres válidos en el texto.',
      });
    }
  };

  // Handle Device Contact Picker
  const handlePickFromDevice = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const pickedResult = await pickDeviceContacts();
      if (pickedResult.contacts && pickedResult.contacts.length > 0) {
        setImportPreview(pickedResult.contacts);
      } else {
        setStatusMessage({ type: 'error', text: pickedResult.message || 'No se seleccionó ningún contacto del dispositivo.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Error al leer contactos: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle File Upload (VCF / CSV)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        let parsed: Partial<Contact>[] = [];
        if (file.name.toLowerCase().endsWith('.vcf')) {
          parsed = parseVCF(content);
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          parsed = parseCSV(content);
        } else {
          // Attempt VCF then CSV
          parsed = content.includes('BEGIN:VCARD') ? parseVCF(content) : parseCSV(content);
        }

        if (parsed.length > 0) {
          setImportPreview(parsed);
        } else {
          setStatusMessage({ type: 'error', text: 'No se pudieron extraer contactos válidos del archivo.' });
        }
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: `Error al analizar archivo: ${err.message}` });
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!importPreview) return;
    const count = importContacts(importPreview, importMode);
    setStatusMessage({
      type: 'success',
      text: `¡Se han importado ${count} contactos con éxito!`,
    });
    setImportPreview(null);
  };

  // Export handlers
  const handleExportVCF = (onlyFiltered: boolean) => {
    const target = onlyFiltered ? filteredContacts : contacts;
    const vcf = exportToVCF(target);
    downloadFile(vcf, `contactos_${onlyFiltered ? 'filtrados' : 'todos'}.vcf`, 'text/vcard');
  };

  const handleExportCSV = (onlyFiltered: boolean) => {
    const target = onlyFiltered ? filteredContacts : contacts;
    const csv = exportToCSV(target);
    downloadFile(csv, `contactos_${onlyFiltered ? 'filtrados' : 'todos'}.csv`, 'text/csv');
  };

  const handleDownloadBackup = () => {
    const json = exportBackupJSON();
    downloadFile(json, `backup_contacts_timeline_${new Date().toISOString().substring(0, 10)}.json`, 'application/json');
    setStatusMessage({ type: 'success', text: 'Copia de seguridad descargada correctamente.' });
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreBackupJSON(content);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `¡Copia de seguridad restaurada! ${res.count} contactos cargados.` });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Error al restaurar.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Importación & Exportación</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              setActiveTab('import');
              setStatusMessage(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" /> Importar
          </button>
          <button
            onClick={() => {
              setActiveTab('export');
              setStatusMessage(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={() => {
              setActiveTab('backup');
              setStatusMessage(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" /> Copia de Seguridad
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {!importPreview ? (
                <>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Importa contactos desde tu teléfono o archivos estándar. Todo el procesamiento se realiza localmente en tu navegador.
                  </p>

                  <div className="space-y-3 pt-1">
                    {/* Google Contacts Featured Option */}
                    <div className="p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              Google Contacts (En línea)
                            </h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Autorizado
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Descarga directa de tus números reales desde <strong className="text-slate-700 dark:text-slate-300">massidibiza@gmail.com</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleImportGoogleContacts}
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all flex-shrink-0 disabled:opacity-50"
                      >
                        {isProcessing && processingStatus ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            <span>Sincronizar mis números</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isProcessing && processingStatus && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span>{processingStatus}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Device Picker */}
                      <button
                        onClick={handlePickFromDevice}
                        disabled={isProcessing}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-2xl text-left transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">Móvil</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Contactos del dispositivo
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isContactPickerSupported() ? 'Selector oficial del sistema operativo' : 'Selector nativo para Android y Chrome'}
                          </p>
                        </div>
                      </button>

                      {/* VCF File */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 rounded-2xl text-left transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">vCard</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Importar archivo VCF (.vcf)
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Exportado desde iPhone, Android o WhatsApp
                          </p>
                        </div>
                      </button>

                      {/* CSV File */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 hover:border-amber-400 rounded-2xl text-left transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">CSV / Excel</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Importar archivo CSV
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Formato Google Contacts, Outlook o Excel
                          </p>
                        </div>
                      </button>

                      {/* Paste Numbers Text Box Toggle */}
                      <button
                        onClick={() => setShowPasteBox(!showPasteBox)}
                        disabled={isProcessing}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 border border-slate-200 dark:border-slate-700 hover:border-violet-400 rounded-2xl text-left transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center">
                            <ClipboardPaste className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase text-slate-400">Rápido</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Pegar lista de teléfonos
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Pega nombres y teléfonos en texto plano
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Paste Box Area */}
                    {showPasteBox && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 animate-in fade-in">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Pega aquí tus números o contactos (un contacto por línea):
                          </label>
                          <textarea
                            rows={4}
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder={"Ejemplo:\nJuan Pérez: +34 612 345 678\nMaría López, maria@gmail.com, +34 654 987 321\n+34 600 111 222"}
                            className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                          />
                        </div>

                        {/* Campo Email para importar números */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <Mail className="w-3.5 h-3.5 text-violet-500" />
                            <span>Correo electrónico (opcional):</span>
                          </label>
                          <input
                            type="email"
                            value={pastedEmail}
                            onChange={(e) => setPastedEmail(e.target.value)}
                            placeholder="ejemplo@correo.com (se asignará a los números sin email)"
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                          />
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            Se asociará automáticamente a los números o contactos que importes que no tengan email en la lista.
                          </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              setShowPasteBox(false);
                              setPastedEmail('');
                            }}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            Cerrar
                          </button>
                          <button
                            onClick={handleParsePastedNumbers}
                            disabled={!pastedText.trim()}
                            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                          >
                            Extraer contactos y números
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vcf,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              ) : (
                /* Import Preview Step (Section 12 requirement) */
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl">
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      Encontrados {importPreview.length} contactos
                    </h4>
                    <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-1">
                      Revisa y elige si deseas añadir a tu agenda actual o reemplazar los contactos existentes.
                    </p>
                  </div>

                  {/* Mode selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Método de importación:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setImportMode('append')}
                        className={`p-3 rounded-xl border text-left text-xs ${
                          importMode === 'append'
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        Añadir a los existentes
                      </button>
                      <button
                        onClick={() => setImportMode('replace')}
                        className={`p-3 rounded-xl border text-left text-xs ${
                          importMode === 'replace'
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        Reemplazar agenda completa
                      </button>
                    </div>
                  </div>

                  {/* Preview Sample list */}
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-2 space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/40">
                    {importPreview.slice(0, 10).map((c, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-between gap-2 border border-slate-100 dark:border-slate-700/50">
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                            {c.name} {c.lastName || ''}
                          </span>
                          {c.emails && c.emails.length > 0 && (
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{c.emails[0].email}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex-shrink-0 bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded-lg">
                          {c.phones?.[0]?.number || 'Sin teléfono'}
                        </span>
                      </div>
                    ))}
                    {importPreview.length > 10 && (
                      <div className="text-center text-[11px] text-slate-400 py-1">
                        ... y {importPreview.length - 10} contactos más
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setImportPreview(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm"
                    >
                      Importar todos ({importPreview.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Exporta tus contactos para sincronizarlos con otros dispositivos o abrirlos en hojas de cálculo como Microsoft Excel o Google Sheets.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Exportar a vCard (.VCF)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Compatible con iPhone, Android, Google y Apple Contacts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExportVCF(false)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white rounded-xl text-xs font-medium"
                    >
                      Todos ({contacts.length})
                    </button>
                    {filteredContacts.length !== contacts.length && (
                      <button
                        onClick={() => handleExportVCF(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium"
                      >
                        Filtrados ({filteredContacts.length})
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Exportar a CSV (.CSV)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Formato tabular compatible con Microsoft Excel
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExportCSV(false)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white rounded-xl text-xs font-medium"
                    >
                      Todos ({contacts.length})
                    </button>
                    {filteredContacts.length !== contacts.length && (
                      <button
                        onClick={() => handleExportCSV(true)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium"
                      >
                        Filtrados ({filteredContacts.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Copia de seguridad local completa
                    </h4>
                    <p className="text-xs text-slate-500">
                      Incluye todos tus contactos, etiquetas personalizadas y metadatos cronológicos.
                    </p>
                  </div>
                </div>

                {settings.lastBackupDate && (
                  <p className="text-xs text-slate-400">
                    Última copia realizada: {new Date(settings.lastBackupDate).toLocaleString('es-ES')}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleDownloadBackup}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Crear y descargar copia (.json)
                  </button>

                  <button
                    onClick={() => backupInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> Restaurar copia
                  </button>
                  <input
                    ref={backupInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleRestoreBackup}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>
                  Privacidad total: Las copias de seguridad son guardadas exclusivamente en tu dispositivo, sin servidores intermedios.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

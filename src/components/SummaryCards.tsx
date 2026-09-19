import React from 'react';
import { Users, UserPlus, PhoneOff, MailX, Copy, Clock, Upload, Trash2 } from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { formatRelativeTime } from '../utils/dateUtils';
import { AppTab } from '../types';

interface SummaryCardsProps {
  onOpenDuplicates: () => void;
  setCurrentTab: (tab: AppTab) => void;
  onOpenImportExport?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  onOpenDuplicates,
  setCurrentTab,
  onOpenImportExport,
}) => {
  const {
    contacts,
    duplicates,
    setFilters,
    setSelectedContact,
    hasSampleContacts,
    deleteSampleContacts,
  } = useContacts();

  // Metrics calculation
  const total = contacts.length;

  const now = new Date('2026-09-18T13:37:18.000Z');
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const newThisMonth = contacts.filter((c) => {
    const dStr = c.createdAt || c.importedAt;
    if (!dStr) return false;
    const d = new Date(dStr);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  const withoutPhone = contacts.filter((c) => !c.phones || c.phones.length === 0).length;
  const withoutEmail = contacts.filter((c) => !c.emails || c.emails.length === 0).length;

  // Last added contact
  const sortedByCreated = [...contacts].sort((a, b) => {
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tB - tA;
  });
  const lastContact = sortedByCreated[0];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 my-4">
      {/* Total Contactos */}
      <button
        onClick={() => {
          setFilters((prev) => ({ ...prev, dateRange: 'all', hasPhone: 'all', hasEmail: 'all', onlyDuplicates: false, searchQuery: '' }));
          setCurrentTab('contacts');
        }}
        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Total</span>
          <Users className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {total}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">En agenda local</span>
      </button>

      {/* Nuevos este mes */}
      <button
        onClick={() => {
          setFilters((prev) => ({ ...prev, dateRange: '30days', onlyDuplicates: false }));
          setCurrentTab('timeline');
        }}
        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Nuevos este mes</span>
          <UserPlus className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          +{newThisMonth}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Septiembre 2026</span>
      </button>

      {/* Sin Teléfono */}
      <button
        onClick={() => {
          setFilters((prev) => ({ ...prev, hasPhone: 'no', onlyDuplicates: false }));
          setCurrentTab('contacts');
        }}
        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-amber-400 dark:hover:border-amber-600 transition-all group"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Sin teléfono</span>
          <PhoneOff className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
          {withoutPhone}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Incompletos</span>
      </button>

      {/* Sin Email */}
      <button
        onClick={() => {
          setFilters((prev) => ({ ...prev, hasEmail: 'no', onlyDuplicates: false }));
          setCurrentTab('contacts');
        }}
        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-slate-400 dark:hover:border-slate-600 transition-all group"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Sin email</span>
          <MailX className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300">
          {withoutEmail}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Solo teléfono</span>
      </button>

      {/* Contactos Duplicados */}
      <button
        onClick={onOpenDuplicates}
        className={`p-3 border rounded-2xl text-left transition-all group ${
          duplicates.length > 0
            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Duplicados</span>
          <Copy className={`w-4 h-4 ${duplicates.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
        </div>
        <div className={`text-xl sm:text-2xl font-bold ${duplicates.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
          {duplicates.length}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {duplicates.length > 0 ? 'Revisar y fusionar' : 'Sin duplicados'}
        </span>
      </button>

      {/* Último Contacto Añadido */}
      <button
        onClick={() => {
          if (lastContact) setSelectedContact(lastContact);
        }}
        disabled={!lastContact}
        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-xs font-medium truncate">Último añadido</span>
          <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
          {lastContact ? `${lastContact.name} ${lastContact.lastName || ''}`.trim() : 'Ninguno'}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
          {lastContact?.createdAt ? formatRelativeTime(lastContact.createdAt, '') : 'Reciente'}
        </span>
      </button>

      {/* Sample Contacts Alert & Direct Purge */}
      {hasSampleContacts && (
        <div className="col-span-2 sm:col-span-3 lg:col-span-6 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
            <Trash2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Hay contactos de ejemplo de prueba en la lista. ¿Deseas eliminarlos para dejar tu agenda limpia?</span>
          </div>
          <button
            onClick={deleteSampleContacts}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar contactos de ejemplo</span>
          </button>
        </div>
      )}

      {/* Quick Import Banner */}
      {onOpenImportExport && (
        <div className="col-span-2 sm:col-span-3 lg:col-span-6 p-3 sm:p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>¿Deseas importar tus contactos y números de teléfono reales?</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                  Google Contacts Activo
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Sincroniza directamente con massidibiza@gmail.com, el selector nativo del teléfono o un archivo VCF/CSV.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenImportExport}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Sincronizar mis números</span>
          </button>
        </div>
      )}
    </div>
  );
};

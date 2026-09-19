import React from 'react';
import {
  BarChart3,
  Globe2,
  Tag as TagIcon,
  Phone,
  Mail,
  Copy,
  Calendar,
  Users,
  PieChart,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { detectCountry } from '../utils/phoneUtils';

export const StatsView: React.FC = () => {
  const { contacts, duplicates, tags } = useContacts();

  const total = contacts.length;

  // 1. Phone & Email Completeness
  const withPhone = contacts.filter((c) => c.phones && c.phones.length > 0).length;
  const withoutPhone = total - withPhone;
  const withPhonePct = total > 0 ? Math.round((withPhone / total) * 100) : 0;

  const withEmail = contacts.filter((c) => c.emails && c.emails.length > 0).length;
  const withoutEmail = total - withEmail;
  const withEmailPct = total > 0 ? Math.round((withEmail / total) * 100) : 0;

  // 2. Contacts by Country
  const countryCounts: Record<string, { name: string; flag: string; count: number }> = {};
  contacts.forEach((c) => {
    if (c.phones && c.phones.length > 0) {
      const info = detectCountry(c.phones[0].number);
      if (info) {
        if (!countryCounts[info.code]) {
          countryCounts[info.code] = { name: info.name, flag: info.flag, count: 0 };
        }
        countryCounts[info.code].count += 1;
      }
    }
  });

  const sortedCountries = Object.values(countryCounts).sort((a, b) => b.count - a.count);

  // 3. Contacts by Tag
  const tagCounts: Record<string, number> = {};
  tags.forEach((t) => (tagCounts[t.name] = 0));
  contacts.forEach((c) => {
    c.tags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  // 4. Contacts added by Year
  const yearCounts: Record<string, number> = {};
  contacts.forEach((c) => {
    const dStr = c.createdAt || c.importedAt;
    if (dStr) {
      const y = new Date(dStr).getFullYear();
      if (!isNaN(y)) {
        yearCounts[y] = (yearCounts[y] || 0) + 1;
      }
    }
  });
  const sortedYears = Object.entries(yearCounts).sort((a, b) => Number(b[0]) - Number(a[0]));
  const maxYearCount = Math.max(...Object.values(yearCounts), 1);

  // 5. Contacts added in 2026 by Month
  const months2026 = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthCounts2026 = new Array(12).fill(0);
  contacts.forEach((c) => {
    const dStr = c.createdAt || c.importedAt;
    if (dStr) {
      const d = new Date(dStr);
      if (d.getFullYear() === 2026) {
        monthCounts2026[d.getMonth()] += 1;
      }
    }
  });
  const maxMonthCount = Math.max(...monthCounts2026, 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Overview */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-indigo-500/20">
        <div className="flex items-center gap-2 mb-2 text-indigo-400">
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Métricas & Estadísticas</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold">
          {new Intl.NumberFormat('es-ES').format(total)} Contactos analizados
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Visualiza la evolución temporal de tus relaciones, distribución geográfica y salud de datos locales.
        </p>

        {/* Quick summary badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-300 block">Con teléfono</span>
            <span className="text-xl font-bold text-white">{withPhonePct}%</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-300 block">Con email</span>
            <span className="text-xl font-bold text-white">{withEmailPct}%</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-300 block">Países</span>
            <span className="text-xl font-bold text-white">{sortedCountries.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-300 block">Duplicados</span>
            <span className="text-xl font-bold text-rose-400">{duplicates.length}</span>
          </div>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Evolution by Month 2026 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Altas en 2026 por mes
            </h3>
            <span className="text-xs text-slate-400">Año en curso</span>
          </div>

          <div className="grid grid-cols-12 gap-1 items-end h-40 pt-4">
            {months2026.map((m, idx) => {
              const count = monthCounts2026[idx];
              const heightPct = Math.round((count / maxMonthCount) * 100);
              const isCurrent = idx === 8; // September

              return (
                <div key={m} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 dark:bg-indigo-500'
                        : count > 0
                        ? 'bg-slate-200 dark:bg-slate-700 hover:bg-indigo-300'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                    style={{ height: `${Math.max(8, heightPct)}%` }}
                    title={`${m}: ${count} contactos`}
                  />
                  <span className={`text-[10px] ${isCurrent ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                    {m}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution by Country */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-indigo-500" />
              Contactos por país
            </h3>
            <span className="text-xs text-slate-400">Prefijos detectados</span>
          </div>

          <div className="space-y-3">
            {sortedCountries.slice(0, 5).map((country) => {
              const pct = total > 0 ? Math.round((country.count / total) * 100) : 0;
              return (
                <div key={country.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="text-base">{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                    <span className="text-slate-500 font-mono">
                      {country.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contacts by Tag */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-indigo-500" />
              Contactos por etiqueta
            </h3>
            <span className="text-xs text-slate-400">Segmentación</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {sortedTags.map(([tagName, count]) => (
              <div
                key={tagName}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-center justify-between gap-3 min-w-[120px]"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">{tagName}</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-[11px]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Completeness (Health) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" />
              Salud y completitud de datos
            </h3>
            <span className="text-xs text-slate-400">Auditoría</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Con teléfono registrado</span>
                  <span className="text-slate-400 text-[11px]">{withPhone} de {total} contactos</span>
                </div>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">{withPhonePct}%</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Con email registrado</span>
                  <span className="text-slate-400 text-[11px]">{withEmail} de {total} contactos</span>
                </div>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">{withEmailPct}%</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Contactos duplicados</span>
                  <span className="text-slate-400 text-[11px]">{duplicates.length} parejas candidatas</span>
                </div>
              </div>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
                {duplicates.length > 0 ? 'Acción recomendada' : 'Limpio'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

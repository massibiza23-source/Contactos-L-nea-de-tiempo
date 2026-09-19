import React, { useState } from 'react';
import {
  Search,
  X,
  Calendar,
  Phone,
  Mail,
  Tag as TagIcon,
  Sparkles,
  MapPin,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { DateFilterPreset, SortOption } from '../types';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({ isOpen, onClose }) => {
  const { filters, setFilters, tags, contacts } = useContacts();

  const [queryInput, setQueryInput] = useState(filters.searchQuery);

  if (!isOpen) return null;

  // Extract unique cities from contacts for quick autocomplete
  const cities = Array.from(
    new Set(contacts.map((c) => c.address?.city).filter(Boolean) as string[])
  );

  const handleApply = (newQuery?: string) => {
    const q = newQuery !== undefined ? newQuery : queryInput;
    setFilters((prev) => ({ ...prev, searchQuery: q }));
    onClose();
  };

  const handleReset = () => {
    setQueryInput('');
    setFilters({
      searchQuery: '',
      dateRange: 'all',
      hasPhone: 'all',
      hasEmail: 'all',
      selectedTags: [],
      onlyDuplicates: false,
      onlyFavorites: false,
      onlyRecentlyModified: false,
      sortBy: 'created_desc',
    });
  };

  const setPresetQuery = (prompt: string) => {
    setQueryInput(prompt);
    handleApply(prompt);
  };

  const toggleTag = (tagName: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagName)
        ? prev.selectedTags.filter((t) => t !== tagName)
        : [...prev.selectedTags, tagName],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApply();
                }}
                placeholder="Buscar por nombre, teléfono, email, Ibiza, notas..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-sm sm:text-base text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {queryInput && (
                <button
                  type="button"
                  onClick={() => setQueryInput('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Smart NLP Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Búsqueda inteligente:
            </span>
            <button
              onClick={() => setPresetQuery('personas de Ibiza')}
              className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800/50 transition-colors"
            >
              &quot;personas de Ibiza&quot;
            </button>
            <button
              onClick={() => setPresetQuery('contactos añadidos este mes')}
              className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/50 transition-colors"
            >
              &quot;contactos añadidos este mes&quot;
            </button>
            <button
              onClick={() => setPresetQuery('sin teléfono')}
              className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/50 transition-colors"
            >
              &quot;sin teléfono&quot;
            </button>
          </div>
        </div>

        {/* Advanced Filters Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs sm:text-sm">
          {/* Date Range Filter */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-500" /> Período de creación / guardado
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'today', label: 'Hoy' },
                  { id: '7days', label: '7 días' },
                  { id: '30days', label: '30 días' },
                  { id: 'this_year', label: 'Este año' },
                  { id: 'custom', label: 'Personalizado' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setFilters((prev) => ({ ...prev, dateRange: preset.id }))}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                    filters.dateRange === preset.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs if 'custom' */}
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Desde:</span>
                  <input
                    type="date"
                    value={filters.customStartDate || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, customStartDate: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Hasta:</span>
                  <input
                    type="date"
                    value={filters.customEndDate || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, customEndDate: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Completeness Filters (Teléfono / Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-500" /> Teléfono
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['all', 'yes', 'no'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilters((prev) => ({ ...prev, hasPhone: opt }))}
                    className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                      filters.hasPhone === opt
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt === 'all' ? 'Cualquiera' : opt === 'yes' ? 'Con teléfono' : 'Sin teléfono'}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" /> Correo Electrónico
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['all', 'yes', 'no'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilters((prev) => ({ ...prev, hasEmail: opt }))}
                    className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                      filters.hasEmail === opt
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt === 'all' ? 'Cualquiera' : opt === 'yes' ? 'Con email' : 'Sin email'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-indigo-500" /> Filtrar por etiquetas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const isSelected = filters.selectedTags.includes(t.name);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.name)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* City / Location filter */}
          {cities.length > 0 && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Ciudad / Ubicación común
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, city: undefined }))}
                  className={`text-xs px-2.5 py-1 rounded-lg border ${
                    !filters.city
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Todas las ciudades
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        city: prev.city === city ? undefined : city,
                      }))
                    }
                    className={`text-xs px-2.5 py-1 rounded-lg border ${
                      filters.city === city
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sorting in filter */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Ordenar resultados por:
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as SortOption }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white outline-none"
            >
              <option value="created_desc">Fecha de creación: más recientes → más antiguos</option>
              <option value="created_asc">Fecha de creación: más antiguos → más recientes</option>
              <option value="name_asc">Nombre A-Z</option>
              <option value="name_desc">Nombre Z-A</option>
              <option value="updated_desc">Última modificación</option>
              <option value="last_contact_desc">Último contacto / interacción</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            onClick={() => handleApply()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  );
};

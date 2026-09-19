import React from 'react';
import { Phone, Mail, Building, Tag as TagIcon, Clock, AlertCircle, CheckCircle2, ChevronRight, Star, Upload, MapPin } from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { groupContactsForTimeline, formatDayBadge, formatRelativeTime, getDateSourceDescription } from '../utils/dateUtils';
import { formatPhoneDisplay, detectCountry } from '../utils/phoneUtils';
import { Contact } from '../types';

interface TimelineViewProps {
  onSelectContact: (contact: Contact) => void;
  onOpenAddContact: () => void;
  onOpenImportExport?: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  onSelectContact,
  onOpenAddContact,
  onOpenImportExport,
}) => {
  const { filteredContacts, toggleFavorite } = useContacts();

  const timelineGroups = groupContactsForTimeline(filteredContacts);

  if (filteredContacts.length === 0) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          No hay contactos que coincidan con la búsqueda
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Intenta ajustar los filtros de fecha o búsqueda, o importa tus contactos reales de Google o tu dispositivo.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {onOpenImportExport && (
            <button
              onClick={onOpenImportExport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Importar números reales
            </button>
          )}
          <button
            onClick={onOpenAddContact}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-all"
          >
            Añadir manualmente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {timelineGroups.map((group) => (
        <div key={group.key} className="space-y-4">
          {/* Month/Year Group Header */}
          <div className="sticky top-14 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm py-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/60 inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {group.title}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {group.contacts.length} {group.contacts.length === 1 ? 'contacto' : 'contactos'}
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>

          {/* Timeline Cards Container */}
          <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {group.contacts.map((contact) => {
              const dayBadge = formatDayBadge(contact.createdAt || contact.updatedAt || contact.importedAt);
              const mainPhone = contact.phones[0];
              const country = mainPhone ? detectCountry(mainPhone.number) : null;
              const mainEmail = contact.emails[0];
              const dateMeta = getDateSourceDescription(contact.dateSource, contact.createdAtReliable);

              return (
                <div
                  key={contact.id}
                  className="relative group transition-all"
                >
                  {/* Timeline Dot Indicator */}
                  <div
                    className="absolute -left-6 sm:-left-8 top-5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm transition-transform group-hover:scale-125"
                    style={{ backgroundColor: contact.color || '#6366f1' }}
                  />

                  {/* Card Content */}
                  <div
                    onClick={() => onSelectContact(contact)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Date Badge + Avatar + Names */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Day Badge */}
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold border border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
                          <span className="text-base sm:text-lg leading-none">{dayBadge.day}</span>
                          <span className="text-[10px] tracking-wider text-slate-500 dark:text-slate-400 font-semibold">{dayBadge.month}</span>
                        </div>

                        {/* Avatar & Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Color Dot + Full Name */}
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: contact.color || '#6366f1' }}
                            />
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                              {contact.name} {contact.lastName || ''}
                            </h3>

                            {/* Reliability Badge (Rule 20) */}
                            {contact.createdAtReliable ? (
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${dateMeta.badgeColor}`}
                                title={dateMeta.explanation}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {dateMeta.label}
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                title="La fecha de creación original no está disponible para este contacto en el sistema operativo."
                              >
                                <AlertCircle className="w-3 h-3" />
                                Sin fecha original
                              </span>
                            )}

                            {/* Saved Location Badge */}
                            {contact.savedLocation && (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium"
                                title={`Guardado en: ${contact.savedLocation.formattedAddress || contact.savedLocation.placeName || contact.savedLocation.city}`}
                              >
                                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>{contact.savedLocation.placeName || contact.savedLocation.city || 'Ubicación'}</span>
                              </span>
                            )}
                          </div>

                          {/* Company / Job */}
                          {(contact.company || contact.jobTitle) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                              <Building className="w-3 h-3 flex-shrink-0" />
                              <span>{[contact.jobTitle, contact.company].filter(Boolean).join(' · ')}</span>
                            </p>
                          )}

                          {/* Dónde y Cuándo se guardó */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                              {contact.createdAt ? (
                                formatRelativeTime(contact.createdAt)
                              ) : contact.updatedAt ? (
                                <span className="italic text-slate-400">
                                  {formatRelativeTime(contact.updatedAt, 'Modificado ')} (fecha creación no disp.)
                                </span>
                              ) : (
                                <span className="italic text-slate-400">La fecha de creación original no está disponible</span>
                              )}
                            </div>

                            {contact.savedLocation && (
                              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                <span className="truncate max-w-[220px]">
                                  {contact.savedLocation.placeName
                                    ? `${contact.savedLocation.placeName}${contact.savedLocation.city ? ` · ${contact.savedLocation.city}` : ''}`
                                    : contact.savedLocation.city || contact.savedLocation.country || 'Ubicación guardada'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Phone & Email line */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-2 text-xs">
                            {mainPhone ? (
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono">
                                <span>{country?.flag || '📱'}</span>
                                <span>{formatPhoneDisplay(mainPhone.number)}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Sin teléfono</span>
                            )}

                            {mainEmail && (
                              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{mainEmail.email}</span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {contact.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1"
                                >
                                  <TagIcon className="w-2.5 h-2.5 text-slate-400" />
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Favorite star + Chevron */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavorite(contact.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            contact.favorite
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                          }`}
                          title={contact.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                          aria-label={contact.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                        >
                          <Star className={`w-4 h-4 ${contact.favorite ? 'fill-amber-500' : ''}`} />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                      </div>
                    </div>

                    {/* Rule 20 disclaimer banner if creation date is missing */}
                    {!contact.createdAtReliable && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>
                          La fecha de creación original no está disponible para este contacto en el SO. Mostrando fecha de sincronización local.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

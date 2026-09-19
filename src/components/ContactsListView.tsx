import React from 'react';
import { Phone, MessageCircle, Mail, Star, Building, MapPin, Tag as TagIcon, ArrowUpDown, Upload } from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { formatPhoneDisplay, detectCountry } from '../utils/phoneUtils';
import { formatDate } from '../utils/dateUtils';
import { Contact, SortOption } from '../types';

interface ContactsListViewProps {
  onSelectContact: (contact: Contact) => void;
  onOpenAddContact: () => void;
  onOpenImportExport?: () => void;
}

export const ContactsListView: React.FC<ContactsListViewProps> = ({
  onSelectContact,
  onOpenAddContact,
  onOpenImportExport,
}) => {
  const { filteredContacts, filters, setFilters, toggleFavorite } = useContacts();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, sortBy: e.target.value as SortOption }));
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Sort & Quick Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, onlyFavorites: false }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !filters.onlyFavorites
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Todos ({filteredContacts.length})
          </button>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              filters.onlyFavorites
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            Favoritos
          </button>
          {onOpenImportExport && (
            <button
              onClick={onOpenImportExport}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900/60 flex items-center gap-1.5"
            >
              <Upload className="w-3 h-3" />
              <span>Importar números</span>
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <select
            value={filters.sortBy}
            onChange={handleSortChange}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="created_desc">Más recientes primero</option>
            <option value="created_asc">Más antiguos primero</option>
            <option value="name_asc">Nombre A-Z</option>
            <option value="name_desc">Nombre Z-A</option>
            <option value="updated_desc">Última modificación</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredContacts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            No se encontraron contactos
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prueba a modificar la búsqueda o filtros seleccionados.
          </p>
          <button
            onClick={onOpenAddContact}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-all"
          >
            Crear contacto nuevo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredContacts.map((contact) => {
            const mainPhone = contact.phones[0];
            const country = mainPhone ? detectCountry(mainPhone.number) : null;
            const mainEmail = contact.emails[0];
            const initials = `${contact.name[0] || ''}${contact.lastName ? contact.lastName[0] : ''}`.toUpperCase() || '?';

            // WhatsApp link
            const waNumber = mainPhone ? mainPhone.number.replace(/\D/g, '') : '';
            const waUrl = waNumber ? `https://wa.me/${waNumber}` : '';

            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                        style={{ backgroundColor: contact.color || '#6366f1' }}
                      >
                        {initials}
                      </div>

                      {/* Name & Job */}
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {contact.name} {contact.lastName || ''}
                        </h3>
                        {(contact.company || contact.jobTitle) && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                            <Building className="w-3 h-3 flex-shrink-0" />
                            <span>{[contact.jobTitle, contact.company].filter(Boolean).join(' · ')}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Star Favorite */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(contact.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        contact.favorite
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                      }`}
                      aria-label={contact.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    >
                      <Star className={`w-4 h-4 ${contact.favorite ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Phone & Email */}
                  <div className="mt-3 space-y-1 text-xs">
                    {mainPhone ? (
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono">
                        <span>{country?.flag || '📱'}</span>
                        <span>{formatPhoneDisplay(mainPhone.number)}</span>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">Sin número de teléfono</p>
                    )}

                    {mainEmail && (
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{mainEmail.email}</span>
                      </div>
                    )}

                    {contact.savedLocation ? (
                      <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                        <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="truncate">
                          📍 Guardado en {contact.savedLocation.placeName || contact.savedLocation.city || contact.savedLocation.formattedAddress}
                        </span>
                      </div>
                    ) : contact.address?.city ? (
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{contact.address.city}{contact.address.country ? `, ${contact.address.country}` : ''}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Tags */}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {contact.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Action buttons & creation date */}
                <div
                  className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-slate-400">
                    {contact.createdAtReliable && contact.createdAt
                      ? `Guardado: ${formatDate(contact.createdAt)}`
                      : 'Fecha OS no disp.'}
                  </span>

                  {/* Direct Contact Buttons */}
                  <div className="flex items-center gap-1.5">
                    {mainPhone && (
                      <a
                        href={`tel:${mainPhone.number}`}
                        className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Llamar"
                        aria-label="Llamar"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-100 rounded-lg transition-colors"
                        title="WhatsApp"
                        aria-label="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {mainEmail && (
                      <a
                        href={`mailto:${mainEmail.email}`}
                        className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Enviar correo"
                        aria-label="Enviar correo"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Star,
  Building,
  Briefcase,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Tag as TagIcon,
  ExternalLink,
  Navigation,
  Compass,
  Loader2,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { Contact } from '../types';
import { formatPhoneDisplay, detectCountry } from '../utils/phoneUtils';
import { formatDate, formatDateTime, getDateSourceDescription } from '../utils/dateUtils';
import {
  formatCoordinates,
  getGoogleMapsUrl,
  getOpenStreetMapEmbedUrl,
  getCurrentGeoLocation,
} from '../utils/geoUtils';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  onClose,
  onEdit,
}) => {
  const { deleteContact, toggleFavorite, updateContact } = useContacts();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  if (!contact) return null;

  const initials = `${contact.name[0] || ''}${contact.lastName ? contact.lastName[0] : ''}`.toUpperCase() || '?';
  const mainPhone = contact.phones[0];
  const country = mainPhone ? detectCountry(mainPhone.number) : null;
  const dateMeta = getDateSourceDescription(contact.dateSource, contact.createdAtReliable);

  // WhatsApp url
  const waNumber = mainPhone ? mainPhone.number.replace(/\D/g, '') : '';
  const waUrl = waNumber ? `https://wa.me/${waNumber}` : '';

  // Maps URL (prioritize exact savedLocation, fallback to address)
  const addressQuery = [
    contact.address?.street,
    contact.address?.city,
    contact.address?.region,
    contact.address?.country,
  ]
    .filter(Boolean)
    .join(', ');

  const mapsUrl = contact.savedLocation
    ? getGoogleMapsUrl(contact.savedLocation)
    : addressQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
    : '';

  const handleCaptureCurrentLocation = async () => {
    setIsCapturingLocation(true);
    setLocationError(null);
    try {
      const geo = await getCurrentGeoLocation();
      updateContact({
        ...contact,
        savedLocation: geo,
      });
    } catch (err: any) {
      setLocationError(err.message || 'No se pudo obtener la ubicación GPS.');
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const handleDelete = () => {
    deleteContact(contact.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ficha de contacto
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleFavorite(contact.id)}
              className={`p-2 rounded-xl transition-colors ${
                contact.favorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={contact.favorite ? 'Favorito' : 'Marcar favorito'}
            >
              <Star className={`w-4 h-4 ${contact.favorite ? 'fill-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {/* Profile Hero */}
          <div className="flex flex-col items-center text-center">
            {/* Large Avatar */}
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/10 mb-3.5"
              style={{ backgroundColor: contact.color || '#6366f1' }}
            >
              {initials}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {contact.name} {contact.lastName || ''}
            </h2>

            {(contact.jobTitle || contact.company) && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <span>{contact.jobTitle}</span>
                {contact.jobTitle && contact.company && <span>en</span>}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{contact.company}</span>
              </p>
            )}

            {/* Tags */}
            {contact.tags && contact.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {contact.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1"
                  >
                    <TagIcon className="w-2.5 h-2.5 text-slate-400" />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Grid (Llamar, WhatsApp, Email, Ubicación) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 py-2 border-y border-slate-100 dark:border-slate-800">
            {/* Llamar */}
            {mainPhone ? (
              <a
                href={`tel:${mainPhone.number}`}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all group"
              >
                <Phone className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold">Llamar</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed">
                <Phone className="w-5 h-5 mb-1" />
                <span className="text-[11px]">Llamar</span>
              </div>
            )}

            {/* WhatsApp */}
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60 transition-all group"
              >
                <MessageCircle className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold">WhatsApp</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed">
                <MessageCircle className="w-5 h-5 mb-1" />
                <span className="text-[11px]">WhatsApp</span>
              </div>
            )}

            {/* Email */}
            {contact.emails[0] ? (
              <a
                href={`mailto:${contact.emails[0].email}`}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all group"
              >
                <Mail className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold">Email</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed">
                <Mail className="w-5 h-5 mb-1" />
                <span className="text-[11px]">Email</span>
              </div>
            )}

            {/* Ubicación */}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all group"
              >
                <MapPin className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold">Ubicación</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed">
                <MapPin className="w-5 h-5 mb-1" />
                <span className="text-[11px]">Ubicación</span>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            {/* Phones */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Teléfono
              </span>
              {contact.phones.length > 0 ? (
                contact.phones.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{country?.flag || '📱'}</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {formatPhoneDisplay(p.number)}
                      </span>
                      {country && (
                        <span className="text-[10px] text-slate-400">({country.name})</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 capitalize">{p.type}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No hay teléfonos registrados</p>
              )}
            </div>

            {/* Emails */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico
              </span>
              {contact.emails.length > 0 ? (
                contact.emails.map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {e.email}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{e.type}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No hay correos registrados</p>
              )}
            </div>

            {/* Address */}
            {(contact.address?.city || contact.address?.street || contact.address?.country) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-1.5 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Dirección
                </span>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {[contact.address.street, contact.address.city, contact.address.region, contact.address.country].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-1.5 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Notas
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {contact.notes}
                </p>
              </div>
            )}

            {/* Dónde y Cuándo se guardó el contacto */}
            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  ¿Dónde y cuándo se guardó este contacto?
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium">
                  {contact.savedLocation ? 'Geolocalizado' : 'Solo fecha'}
                </span>
              </div>

              {/* 1. Cuándo se guardó */}
              <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-indigo-500" /> Momento de Registro
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Guardado original:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {contact.createdAt ? formatDateTime(contact.createdAt) : 'No disponible'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Última modificación:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {contact.updatedAt ? formatDateTime(contact.updatedAt) : 'No disponible'}
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {contact.createdAtReliable ? (
                    <p className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Fecha certificada auténtica del sistema operativo.</span>
                    </p>
                  ) : (
                    <p className="text-amber-700 dark:text-amber-400 flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>La fecha de creación original no está disponible en el SO.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Dónde se guardó */}
              <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3 h-3 text-indigo-500" /> Lugar Geográfico
                  </span>
                  {contact.savedLocation && (
                    <a
                      href={getGoogleMapsUrl(contact.savedLocation)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Abrir en Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {contact.savedLocation ? (
                  <div className="space-y-2.5">
                    {/* Lugar / Dirección */}
                    <div>
                      {contact.savedLocation.placeName && (
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          📍 {contact.savedLocation.placeName}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {contact.savedLocation.formattedAddress ||
                          `${contact.savedLocation.city || ''}, ${contact.savedLocation.country || ''}`}
                      </p>
                    </div>

                    {/* Coordenadas & Precisión */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {formatCoordinates(contact.savedLocation.latitude, contact.savedLocation.longitude)}
                      </span>
                      {contact.savedLocation.accuracy && (
                        <span className="text-[10px] text-slate-400">
                          (Precisión ±{contact.savedLocation.accuracy}m)
                        </span>
                      )}
                    </div>

                    {/* Vista previa de mapa embebido OpenStreetMap */}
                    <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                      <iframe
                        title="Mapa del contacto"
                        src={getOpenStreetMapEmbedUrl(contact.savedLocation.latitude, contact.savedLocation.longitude, 14)}
                        className="w-full h-full border-0 pointer-events-none"
                        loading="lazy"
                      />
                      <a
                        href={getGoogleMapsUrl(contact.savedLocation)}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1 hover:bg-white"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        Ver mapa interactivo
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No se registró geolocalización al guardar este contacto.
                    </p>
                    <button
                      type="button"
                      onClick={handleCaptureCurrentLocation}
                      disabled={isCapturingLocation}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-200/80 dark:border-indigo-800"
                    >
                      {isCapturingLocation ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Compass className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isCapturingLocation
                          ? 'Detectando GPS...'
                          : 'Añadir mi ubicación actual (GPS)'}
                      </span>
                    </button>
                    {locationError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">{locationError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar (Editar, Eliminar) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          {showDeleteConfirm ? (
            <div className="w-full flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                ¿Eliminar este contacto de la aplicación?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>

              <button
                onClick={() => {
                  onEdit(contact);
                  onClose();
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar contacto</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

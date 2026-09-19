import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  ExternalLink,
  ChevronRight,
  Search,
  Plus,
  Compass,
  Building,
  Phone,
  Calendar,
  Layers,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { Contact, GeoLocation } from '../types';
import {
  formatCoordinates,
  getGoogleMapsUrl,
  getOpenStreetMapEmbedUrl,
} from '../utils/geoUtils';
import { formatDate, formatRelativeTime } from '../utils/dateUtils';
import { formatPhoneDisplay } from '../utils/phoneUtils';

interface MapViewProps {
  onSelectContact: (contact: Contact) => void;
  onOpenAddContact: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  onSelectContact,
  onOpenAddContact,
}) => {
  const { contacts } = useContacts();
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

  // Contacts that have a savedLocation
  const geoContacts = useMemo(() => {
    return contacts.filter((c) => !!c.savedLocation);
  }, [contacts]);

  // Cities count list
  const cityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    geoContacts.forEach((c) => {
      const city = c.savedLocation?.city || c.address?.city || 'Sin ciudad';
      stats[city] = (stats[city] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [geoContacts]);

  // Filtered contacts based on search and city
  const filteredList = useMemo(() => {
    return geoContacts.filter((c) => {
      const city = c.savedLocation?.city || c.address?.city || 'Sin ciudad';
      const matchesCity = selectedCity === 'all' || city.toLowerCase() === selectedCity.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.lastName && c.lastName.toLowerCase().includes(q)) ||
        (c.savedLocation?.placeName && c.savedLocation.placeName.toLowerCase().includes(q)) ||
        (c.savedLocation?.city && c.savedLocation.city.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q));

      return matchesCity && matchesSearch;
    });
  }, [geoContacts, selectedCity, searchQuery]);

  // Determine active contact for the featured map view
  const currentActiveContact = useMemo(() => {
    if (activeContactId) {
      const found = geoContacts.find((c) => c.id === activeContactId);
      if (found) return found;
    }
    return filteredList[0] || geoContacts[0] || null;
  }, [activeContactId, filteredList, geoContacts]);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Geolocalización de Contactos</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            ¿Dónde y cuándo guardaste cada contacto?
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 leading-relaxed">
            Localización GPS y registro temporal exacto capturado en el momento de crear o sincronizar cada persona.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-medium">
            <div className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-200" />
              <span>{geoContacts.length} contactos geolocalizados</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-200" />
              <span>{cityStats.length} ciudades registradas</span>
            </div>
            <button
              onClick={onOpenAddContact}
              className="px-3.5 py-1.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold transition-all shadow-sm flex items-center gap-1.5 ml-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar aquí</span>
            </button>
          </div>
        </div>
      </div>

      {geoContacts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Aún no tienes contactos con geolocalización
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Al añadir un nuevo contacto, pulsa en &quot;Capturar mi ubicación actual (GPS)&quot; para registrar las coordenadas y el lugar exacto.
          </p>
          <button
            onClick={onOpenAddContact}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primer contacto con ubicación</span>
          </button>
        </div>
      ) : (
        <>
          {/* Controls: Search & City Filters */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por lugar, ciudad, persona o empresa..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* City Tabs Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCity('all')}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCity === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span>Todas las ciudades</span>
                <span className="text-[10px] opacity-80">({geoContacts.length})</span>
              </button>
              {cityStats.map(([city, count]) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCity.toLowerCase() === city.toLowerCase()
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <MapPin className="w-3 h-3 opacity-70" />
                  <span>{city}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Grid: Interactive Map + Contact Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Featured Map View */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentActiveContact
                        ? `${currentActiveContact.name} ${currentActiveContact.lastName || ''}`
                        : 'Mapa General'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {currentActiveContact?.savedLocation?.placeName ||
                        currentActiveContact?.savedLocation?.formattedAddress ||
                        'Selecciona un contacto para centrar el mapa'}
                    </p>
                  </div>
                </div>

                {currentActiveContact?.savedLocation && (
                  <a
                    href={getGoogleMapsUrl(currentActiveContact.savedLocation)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Embedded Map */}
              <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-800">
                {currentActiveContact?.savedLocation ? (
                  <iframe
                    title="Mapa interactivo del contacto"
                    src={getOpenStreetMapEmbedUrl(
                      currentActiveContact.savedLocation.latitude,
                      currentActiveContact.savedLocation.longitude,
                      15
                    )}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                    <MapPin className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">Selecciona un contacto de la lista</span>
                  </div>
                )}
              </div>

              {/* Map Footer Info */}
              {currentActiveContact?.savedLocation && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-slate-500 dark:text-slate-400">Guardado el:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {currentActiveContact.createdAt
                        ? formatDate(currentActiveContact.createdAt)
                        : 'Fecha no disp.'}
                    </span>
                  </div>
                  <div className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                    {formatCoordinates(
                      currentActiveContact.savedLocation.latitude,
                      currentActiveContact.savedLocation.longitude
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Contact Cards List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Contactos ({filteredList.length})
                </span>
                <span className="text-[11px] text-slate-400">Toca para centrar en el mapa</span>
              </div>

              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {filteredList.map((c) => {
                  const isCurrent = currentActiveContact?.id === c.id;
                  const loc = c.savedLocation!;
                  const mainPhone = c.phones[0];

                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveContactId(c.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: c.color || '#6366f1' }}
                          >
                            {c.name[0]}
                            {c.lastName ? c.lastName[0] : ''}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {c.name} {c.lastName || ''}
                            </h4>
                            {c.company && (
                              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                                <Building className="w-2.5 h-2.5" />
                                {c.company}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectContact(c);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Ver ficha completa"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Location & Time info */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span className="truncate">
                            {loc.placeName || loc.city || loc.formattedAddress}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span>
                              {c.createdAt ? formatRelativeTime(c.createdAt) : 'Sin fecha'}
                            </span>
                          </div>
                          {mainPhone && (
                            <span className="font-mono text-slate-500 dark:text-slate-400">
                              {formatPhoneDisplay(mainPhone.number)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

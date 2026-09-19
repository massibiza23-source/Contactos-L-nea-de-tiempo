import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tag as TagIcon,
  Check,
  Calendar,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Navigation,
  Compass,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useContacts } from '../context/ContactsContext';
import { Contact, PhoneNumber, EmailAddress, GeoLocation } from '../types';
import { getCurrentGeoLocation, formatCoordinates, getQuickLocationPresets } from '../utils/geoUtils';

interface ContactFormModalProps {
  contactToEdit: Contact | null;
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  contactToEdit,
  isOpen,
  onClose,
}) => {
  const { addContact, updateContact, tags, addCustomTag } = useContacts();

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phones, setPhones] = useState<PhoneNumber[]>([{ number: '', type: 'mobile' }]);
  const [emails, setEmails] = useState<EmailAddress[]>([{ email: '', type: 'personal' }]);
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('España');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [favorite, setFavorite] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [createdAtReliable, setCreatedAtReliable] = useState(true);

  // Geolocation state: dónde y cuándo
  const [savedLocation, setSavedLocation] = useState<GeoLocation | undefined>(undefined);
  const [placeName, setPlaceName] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (contactToEdit) {
      setName(contactToEdit.name || '');
      setLastName(contactToEdit.lastName || '');
      setPhones(contactToEdit.phones.length > 0 ? contactToEdit.phones : [{ number: '', type: 'mobile' }]);
      setEmails(contactToEdit.emails.length > 0 ? contactToEdit.emails : [{ email: '', type: 'personal' }]);
      setCompany(contactToEdit.company || '');
      setJobTitle(contactToEdit.jobTitle || '');
      setCity(contactToEdit.address?.city || '');
      setCountry(contactToEdit.address?.country || 'España');
      setNotes(contactToEdit.notes || '');
      setSelectedTags(contactToEdit.tags || []);
      setColor(contactToEdit.color || AVATAR_COLORS[0]);
      setFavorite(!!contactToEdit.favorite);
      setCreatedAt(contactToEdit.createdAt ? contactToEdit.createdAt.substring(0, 10) : '');
      setCreatedAtReliable(contactToEdit.createdAtReliable ?? true);
      setSavedLocation(contactToEdit.savedLocation);
      setPlaceName(contactToEdit.savedLocation?.placeName || '');
      setLocationStatus(null);
    } else {
      setName('');
      setLastName('');
      setPhones([{ number: '', type: 'mobile' }]);
      setEmails([{ email: '', type: 'personal' }]);
      setCompany('');
      setJobTitle('');
      setCity('');
      setCountry('España');
      setNotes('');
      setSelectedTags(['Amigos']);
      setColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
      setFavorite(false);
      setCreatedAt(new Date().toISOString().substring(0, 10));
      setCreatedAtReliable(true);
      setSavedLocation(undefined);
      setPlaceName('');
      setLocationStatus(null);
    }
  }, [contactToEdit, isOpen]);

  const handleCaptureGPS = async () => {
    setIsLocating(true);
    setLocationStatus({ text: 'Obteniendo señal GPS del dispositivo...', type: 'info' });
    try {
      const geo = await getCurrentGeoLocation();
      setSavedLocation(geo);
      if (geo.city && !city) setCity(geo.city);
      if (geo.country && (!country || country === 'España')) setCountry(geo.country);
      setLocationStatus({
        text: `📍 Ubicación fijada: ${geo.city || 'Coordenadas GPS'} (±${geo.accuracy}m)`,
        type: 'success',
      });
    } catch (err: any) {
      setLocationStatus({ text: err.message || 'No se pudo obtener la ubicación GPS.', type: 'error' });
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectPreset = (preset: { name: string; region: string; country: string; lat: number; lon: number }) => {
    const nowIso = new Date().toISOString();
    setSavedLocation({
      latitude: preset.lat,
      longitude: preset.lon,
      city: preset.name,
      region: preset.region,
      country: preset.country,
      countryCode: preset.country === 'España' ? 'ES' : undefined,
      formattedAddress: `${preset.name}, ${preset.region}, ${preset.country}`,
      timestamp: nowIso,
      placeName: preset.name,
      accuracy: 20,
    });
    setPlaceName(preset.name);
    if (!city) setCity(preset.name);
    if (!country) setCountry(preset.country);
    setLocationStatus({ text: `📍 Establecido en: ${preset.name}, ${preset.country}`, type: 'success' });
  };

  if (!isOpen) return null;

  const handleAddPhone = () => {
    setPhones((prev) => [...prev, { number: '', type: 'mobile' }]);
  };

  const handleRemovePhone = (index: number) => {
    setPhones((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (index: number, val: string) => {
    setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, number: val } : p)));
  };

  const handlePhoneTypeChange = (index: number, type: PhoneNumber['type']) => {
    setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, type } : p)));
  };

  const handleAddEmail = () => {
    setEmails((prev) => [...prev, { email: '', type: 'personal' }]);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, val: string) => {
    setEmails((prev) => prev.map((e, i) => (i === index ? { ...e, email: val } : e)));
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleAddNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTagInput.trim()) return;
    const newTag = addCustomTag(customTagInput.trim());
    setSelectedTags((prev) => [...prev, newTag.name]);
    setCustomTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validPhones = phones.filter((p) => p.number.trim() !== '');
    const validEmails = emails.filter((e) => e.email.trim() !== '');

    const effectiveLocation: GeoLocation | undefined = savedLocation
      ? {
          ...savedLocation,
          placeName: placeName.trim() || savedLocation.placeName,
          city: savedLocation.city || city.trim() || undefined,
          country: savedLocation.country || country.trim() || undefined,
          timestamp: savedLocation.timestamp || (createdAt ? new Date(createdAt).toISOString() : new Date().toISOString()),
        }
      : undefined;

    const contactData: Partial<Contact> = {
      name: name.trim(),
      lastName: lastName.trim(),
      phones: validPhones,
      emails: validEmails,
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      address: { city: city.trim(), country: country.trim() },
      notes: notes.trim(),
      tags: selectedTags,
      color,
      favorite,
      createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
      createdAtReliable: createdAt ? createdAtReliable : false,
      dateSource: createdAt ? (createdAtReliable ? 'user_specified' : 'unavailable') : 'unavailable',
      savedLocation: effectiveLocation,
    };

    if (contactToEdit) {
      updateContact({
        ...contactToEdit,
        ...contactData,
      } as Contact);
    } else {
      addContact(contactData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {contactToEdit ? 'Editar contacto' : 'Nuevo contacto'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Avatar Color Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
              Color identificador
            </label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {AVATAR_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Apellidos
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. García"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Phones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Teléfonos
              </label>
              <button
                type="button"
                onClick={handleAddPhone}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir teléfono
              </button>
            </div>

            {phones.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="tel"
                  value={p.number}
                  onChange={(e) => handlePhoneChange(idx, e.target.value)}
                  placeholder="+34 600 000 000"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={p.type}
                  onChange={(e) => handlePhoneTypeChange(idx, e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="mobile">Móvil</option>
                  <option value="work">Trabajo</option>
                  <option value="home">Casa</option>
                  <option value="other">Otro</option>
                </select>
                {phones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Emails */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Correos electrónicos
              </label>
              <button
                type="button"
                onClick={handleAddEmail}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir email
              </button>
            </div>

            {emails.map((e, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="email"
                  value={e.email}
                  onChange={(e) => handleEmailChange(idx, e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={e.type}
                  onChange={(ev) =>
                    setEmails((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, type: ev.target.value as any } : item))
                    )
                  }
                  className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="personal">Personal</option>
                  <option value="work">Trabajo</option>
                  <option value="other">Otro</option>
                </select>
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Company & Job */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Empresa
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej. Tech Solutions"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Cargo / Puesto
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ej. Consultora"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* City & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Ciudad / Ubicación
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Ibiza"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                País
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ej. España"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Sección: Dónde y Cuándo se guardó el contacto */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-blue-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                ¿Dónde y cuándo se guardó el contacto?
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium">
                Geolocalización
              </span>
            </div>

            {/* 1. Cuándo se guardó */}
            <div className="space-y-1.5 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Fecha y momento en que se guardó
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createdAtReliable}
                    onChange={(e) => setCreatedAtReliable(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Fecha certificada fiable</span>
                </label>
              </div>
              {!createdAtReliable && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  Se indicará que la fecha de creación original no está disponible en el SO.
                </p>
              )}
            </div>

            {/* 2. Dónde se guardó */}
            <div className="space-y-2 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                  Ubicación geográfica de guardado
                </label>
                {savedLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      setSavedLocation(undefined);
                      setPlaceName('');
                      setLocationStatus(null);
                    }}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Quitar ubicación
                  </button>
                )}
              </div>

              {/* Botón GPS Principal */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={isLocating}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-500/10"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Compass className="w-3.5 h-3.5" />
                  )}
                  <span>{isLocating ? 'Detectando GPS...' : 'Capturar mi ubicación actual (GPS)'}</span>
                </button>
              </div>

              {/* Presets Rápidos de Ciudad */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-1">O selecciona una ciudad habitual:</span>
                <div className="flex flex-wrap gap-1.5">
                  {getQuickLocationPresets().slice(0, 6).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        savedLocation?.city === p.name
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      📍 {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado / Mensaje de feedback */}
              {locationStatus && (
                <div
                  className={`text-xs p-2 rounded-xl flex items-center gap-2 ${
                    locationStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : locationStatus.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <span>{locationStatus.text}</span>
                </div>
              )}

              {/* Ficha de ubicación activa */}
              {savedLocation && (
                <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-indigo-700 dark:text-indigo-300 font-medium">
                      {formatCoordinates(savedLocation.latitude, savedLocation.longitude)}
                    </span>
                    {savedLocation.accuracy && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Precisión: ±{savedLocation.accuracy}m
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {savedLocation.formattedAddress || `${savedLocation.city || ''}, ${savedLocation.country || ''}`}
                  </p>

                  <div>
                    <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                      Nombre o apunte del lugar (opcional):
                    </label>
                    <input
                      type="text"
                      value={placeName}
                      onChange={(e) => setPlaceName(e.target.value)}
                      placeholder="Ej. Playa d’en Bossa, Restaurante, Café, Evento..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const isSelected = selectedTags.includes(t.name);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => toggleTag(t.name)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <TagIcon className="w-3 h-3 opacity-70" />
                    {t.name}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Crear nueva etiqueta..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddNewTag}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Añadir
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Notas
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas importantes sobre el contacto..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="fav-check"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="fav-check" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Marcar como contacto favorito
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-500/20 transition-all"
            >
              {contactToEdit ? 'Guardar cambios' : 'Crear contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Contact,
  FilterOptions,
  AppSettings,
  Tag,
  DuplicateCandidate,
  SortOption,
  DateFilterPreset,
} from '../types';
import { getInitialSampleContacts, isSampleContactId, getSampleDemoContacts } from '../utils/deviceContacts';
import { findDuplicates, mergeTwoContacts } from '../utils/duplicateDetector';
import { normalizePhone } from '../utils/phoneUtils';

export const DEFAULT_TAGS: Tag[] = [
  { id: 't-familia', name: 'Familia', color: '#ef4444', isDefault: true },
  { id: 't-amigos', name: 'Amigos', color: '#3b82f6', isDefault: true },
  { id: 't-trabajo', name: 'Trabajo', color: '#10b981', isDefault: true },
  { id: 't-clientes', name: 'Clientes', color: '#8b5cf6', isDefault: true },
  { id: 't-proveedores', name: 'Proveedores', color: '#f59e0b', isDefault: true },
  { id: 't-restaurantes', name: 'Restaurantes', color: '#eab308', isDefault: true },
  { id: 't-viajes', name: 'Viajes', color: '#ec4899', isDefault: true },
  { id: 't-brasil', name: 'Brasil', color: '#14b8a6', isDefault: true },
  { id: 't-espana', name: 'España', color: '#f97316', isDefault: true },
  { id: 't-otros', name: 'Otros', color: '#64748b', isDefault: true },
];

const INITIAL_SETTINGS: AppSettings = {
  theme: 'light',
  sortBy: 'created_desc',
  localOnlyGuarantee: true,
  allowAiFeatures: false,
  pinLockEnabled: false,
  pinCode: '',
  lastBackupDate: undefined,
  lastSyncDate: 'Hoy 22:35',
  onboardingCompleted: true,
  permissionsGranted: true,
};

const INITIAL_FILTERS: FilterOptions = {
  searchQuery: '',
  dateRange: 'all',
  hasPhone: 'all',
  hasEmail: 'all',
  selectedTags: [],
  onlyDuplicates: false,
  onlyFavorites: false,
  onlyRecentlyModified: false,
  sortBy: 'created_desc',
};

interface ContactsContextType {
  contacts: Contact[];
  filteredContacts: Contact[];
  tags: Tag[];
  settings: AppSettings;
  filters: FilterOptions;
  duplicates: DuplicateCandidate[];
  selectedContact: Contact | null;
  isPinLocked: boolean;
  isSyncing: boolean;
  
  // State setters
  setSelectedContact: (c: Contact | null) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setIsPinLocked: (locked: boolean) => void;
  
  // CRUD actions
  addContact: (data: Partial<Contact>) => Contact;
  updateContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  importContacts: (newContacts: Partial<Contact>[], mode: 'append' | 'replace') => number;
  mergeDuplicates: (idA: string, idB: string) => void;
  ignoreDuplicate: (pairKey: string) => void;
  addCustomTag: (name: string, color?: string) => Tag;
  wipeAllData: () => void;
  deleteSampleContacts: () => void;
  loadSampleContacts: () => void;
  hasSampleContacts: boolean;
  syncDeviceContacts: () => Promise<void>;
  
  // Backup / Restore
  exportBackupJSON: () => string;
  restoreBackupJSON: (jsonStr: string) => { success: boolean; count: number; error?: string };
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or start with clean empty contacts list (no demo/example contacts)
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('contacts_timeline_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean out any example contacts (c-01 to c-14)
          return parsed.filter((c: Contact) => !isSampleContactId(c.id));
        }
      }
    } catch (e) {
      console.error('Failed to load contacts from localStorage', e);
    }
    return [];
  });

  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem('contacts_timeline_tags');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TAGS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('contacts_timeline_settings');
      if (saved) return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return INITIAL_SETTINGS;
  });

  const [ignoredDuplicates, setIgnoredDuplicates] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('contacts_timeline_ignored_dupes');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });

  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isPinLocked, setIsPinLocked] = useState<boolean>(() => {
    return settings.pinLockEnabled && !!settings.pinCode;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync theme with HTML document
  useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Persist contacts
  useEffect(() => {
    try {
      localStorage.setItem('contacts_timeline_data', JSON.stringify(contacts));
    } catch (e) {
      console.error('Error saving contacts', e);
    }
  }, [contacts]);

  // Persist tags
  useEffect(() => {
    try {
      localStorage.setItem('contacts_timeline_tags', JSON.stringify(tags));
    } catch (e) {}
  }, [tags]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('contacts_timeline_settings', JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  // Persist ignored duplicates
  useEffect(() => {
    try {
      localStorage.setItem('contacts_timeline_ignored_dupes', JSON.stringify(Array.from(ignoredDuplicates)));
    } catch (e) {}
  }, [ignoredDuplicates]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  // Duplicate candidates
  const duplicates = useMemo(() => {
    return findDuplicates(contacts, ignoredDuplicates);
  }, [contacts, ignoredDuplicates]);

  // Smart Search & Advanced Filters
  const filteredContacts = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();
    const now = new Date('2026-09-18T13:37:18.000Z');

    // Natural Language Query Detection
    let isIbizaQuery = false;
    let isThisMonthQuery = false;
    let isWithoutPhoneQuery = false;
    let isWithoutEmailQuery = false;

    if (query.includes('ibiza')) isIbizaQuery = true;
    if (query.includes('este mes') || query.includes('este-mes') || query.includes('añadidos este mes')) isThisMonthQuery = true;
    if (query.includes('sin teléfono') || query.includes('sin telefono')) isWithoutPhoneQuery = true;
    if (query.includes('sin email') || query.includes('sin correo')) isWithoutEmailQuery = true;

    return contacts.filter((c) => {
      // Duplicates only filter
      if (filters.onlyDuplicates) {
        const isDupe = duplicates.some(
          (d) => d.contactA.id === c.id || d.contactB.id === c.id
        );
        if (!isDupe) return false;
      }

      // Favorites filter
      if (filters.onlyFavorites && !c.favorite) {
        return false;
      }

      // Phone filter
      if (filters.hasPhone === 'yes' && (!c.phones || c.phones.length === 0)) return false;
      if (filters.hasPhone === 'no' && c.phones && c.phones.length > 0) return false;
      if (isWithoutPhoneQuery && c.phones && c.phones.length > 0) return false;

      // Email filter
      if (filters.hasEmail === 'yes' && (!c.emails || c.emails.length === 0)) return false;
      if (filters.hasEmail === 'no' && c.emails && c.emails.length > 0) return false;
      if (isWithoutEmailQuery && c.emails && c.emails.length > 0) return false;

      // Tags filter
      if (filters.selectedTags.length > 0) {
        const hasTag = filters.selectedTags.some((tag) => c.tags.includes(tag));
        if (!hasTag) return false;
      }

      // City filter
      if (filters.city && c.address?.city?.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }

      // Company filter
      if (filters.company && (!c.company || !c.company.toLowerCase().includes(filters.company.toLowerCase()))) {
        return false;
      }

      // Date Range Filters
      const contactDateStr = c.createdAt || c.updatedAt || c.importedAt;
      if (filters.dateRange !== 'all' || isThisMonthQuery) {
        if (!contactDateStr) return false;
        const cDate = new Date(contactDateStr);
        if (isNaN(cDate.getTime())) return false;

        const diffDays = (now.getTime() - cDate.getTime()) / (1000 * 3600 * 24);

        if (filters.dateRange === 'today') {
          if (cDate.toDateString() !== now.toDateString()) return false;
        } else if (filters.dateRange === '7days') {
          if (diffDays > 7 || diffDays < 0) return false;
        } else if (filters.dateRange === '30days' || isThisMonthQuery) {
          if (diffDays > 30 || diffDays < 0) return false;
        } else if (filters.dateRange === 'this_year') {
          if (cDate.getFullYear() !== now.getFullYear()) return false;
        } else if (filters.dateRange === 'custom') {
          if (filters.customStartDate && cDate < new Date(filters.customStartDate)) return false;
          if (filters.customEndDate && cDate > new Date(filters.customEndDate)) return false;
        }
      }

      // Smart Text Query Filter
      if (query && !isThisMonthQuery && !isWithoutPhoneQuery && !isWithoutEmailQuery) {
        if (isIbizaQuery) {
          const matchCity = c.address?.city?.toLowerCase().includes('ibiza');
          const matchRegion = c.address?.region?.toLowerCase().includes('ibiza');
          const matchCompany = c.company?.toLowerCase().includes('ibiza');
          const matchNotes = c.notes?.toLowerCase().includes('ibiza');
          const matchName = `${c.name} ${c.lastName || ''}`.toLowerCase().includes('ibiza');
          if (matchCity || matchRegion || matchCompany || matchNotes || matchName) {
            return true;
          }
        }

        const fullName = `${c.name} ${c.lastName || ''}`.toLowerCase();
        const phones = c.phones.map((p) => p.number.toLowerCase()).join(' ');
        const emails = c.emails.map((e) => e.email.toLowerCase()).join(' ');
        const company = (c.company || '').toLowerCase();
        const city = (c.address?.city || '').toLowerCase();
        const notes = (c.notes || '').toLowerCase();
        const tagsJoined = c.tags.join(' ').toLowerCase();

        const words = query.split(/\s+/).filter(Boolean);
        const allWordsMatch = words.every(
          (w) =>
            fullName.includes(w) ||
            phones.includes(w) ||
            emails.includes(w) ||
            company.includes(w) ||
            city.includes(w) ||
            notes.includes(w) ||
            tagsJoined.includes(w)
        );

        if (!allWordsMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting Options
      const sortBy = filters.sortBy || settings.sortBy;
      switch (sortBy) {
        case 'created_desc': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        }
        case 'created_asc': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
          return timeA - timeB;
        }
        case 'name_asc': {
          const nameA = `${a.name} ${a.lastName || ''}`.trim().toLowerCase();
          const nameB = `${b.name} ${b.lastName || ''}`.trim().toLowerCase();
          return nameA.localeCompare(nameB, 'es');
        }
        case 'name_desc': {
          const nameA = `${a.name} ${a.lastName || ''}`.trim().toLowerCase();
          const nameB = `${b.name} ${b.lastName || ''}`.trim().toLowerCase();
          return nameB.localeCompare(nameA, 'es');
        }
        case 'updated_desc': {
          const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return timeB - timeA;
        }
        case 'last_contact_desc': {
          const timeA = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
          const timeB = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
          return timeB - timeA;
        }
        default:
          return 0;
      }
    });
  }, [contacts, filters, settings.sortBy, duplicates]);

  // Actions
  const addContact = useCallback((data: Partial<Contact>): Contact => {
    const now = new Date().toISOString();
    const newContact: Contact = {
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: data.name || 'Sin nombre',
      lastName: data.lastName || '',
      phones: data.phones || [],
      emails: data.emails || [],
      company: data.company || '',
      jobTitle: data.jobTitle || '',
      address: data.address || {},
      notes: data.notes || '',
      tags: data.tags || ['Otros'],
      favorite: !!data.favorite,
      createdAt: data.createdAt || now,
      createdAtReliable: data.createdAtReliable ?? true,
      dateSource: data.dateSource || (data.createdAt ? 'user_specified' : 'unavailable'),
      updatedAt: now,
      importedAt: now,
      source: data.source || 'manual',
    };

    setContacts((prev) => [newContact, ...prev]);
    return newContact;
  }, []);

  const updateContact = useCallback((updated: Contact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : c))
    );
    if (selectedContact?.id === updated.id) {
      setSelectedContact(updated);
    }
  }, [selectedContact]);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (selectedContact?.id === id) {
      setSelectedContact(null);
    }
  }, [selectedContact]);

  const toggleFavorite = useCallback((id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite, updatedAt: new Date().toISOString() } : c))
    );
  }, []);

  const importContacts = useCallback((incoming: Partial<Contact>[], mode: 'append' | 'replace'): number => {
    const now = new Date().toISOString();
    const prepared: Contact[] = incoming.map((c, idx) => ({
      id: `imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      name: c.name || 'Contacto',
      lastName: c.lastName || '',
      phones: c.phones || [],
      emails: c.emails || [],
      company: c.company || '',
      jobTitle: c.jobTitle || '',
      address: c.address || {},
      notes: c.notes || '',
      tags: c.tags && c.tags.length > 0 ? c.tags : ['Importados'],
      favorite: !!c.favorite,
      createdAt: c.createdAt || undefined,
      createdAtReliable: c.createdAtReliable ?? false,
      dateSource: c.dateSource || (c.createdAt ? 'native_created' : 'unavailable'),
      updatedAt: c.updatedAt || now,
      importedAt: now,
      source: c.source || 'vcf_import',
    }));

    if (mode === 'replace') {
      setContacts(prepared);
    } else {
      setContacts((prev) => [...prepared, ...prev]);
    }

    setSettings((prev) => ({
      ...prev,
      lastSyncDate: `Hoy ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
    }));

    return prepared.length;
  }, []);

  const mergeDuplicates = useCallback((idA: string, idB: string) => {
    const contactA = contacts.find((c) => c.id === idA);
    const contactB = contacts.find((c) => c.id === idB);
    if (!contactA || !contactB) return;

    const merged = mergeTwoContacts(contactA, contactB);

    setContacts((prev) => {
      const filtered = prev.filter((c) => c.id !== idA && c.id !== idB);
      return [merged, ...filtered];
    });

    if (selectedContact?.id === idA || selectedContact?.id === idB) {
      setSelectedContact(merged);
    }
  }, [contacts, selectedContact]);

  const ignoreDuplicate = useCallback((pairKey: string) => {
    setIgnoredDuplicates((prev) => {
      const next = new Set(prev);
      next.add(pairKey);
      return next;
    });
  }, []);

  const addCustomTag = useCallback((name: string, color: string = '#6366f1'): Tag => {
    const cleanName = name.trim();
    const existing = tags.find((t) => t.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) return existing;

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: cleanName,
      color,
      isDefault: false,
    };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  }, [tags]);

  const hasSampleContacts = useMemo(() => {
    return contacts.some((c) => isSampleContactId(c.id));
  }, [contacts]);

  const deleteSampleContacts = useCallback(() => {
    setContacts((prev) => prev.filter((c) => !isSampleContactId(c.id)));
    if (selectedContact && isSampleContactId(selectedContact.id)) {
      setSelectedContact(null);
    }
  }, [selectedContact]);

  const loadSampleContacts = useCallback(() => {
    const samples = getSampleDemoContacts();
    setContacts((prev) => {
      const nonSamples = prev.filter((c) => !isSampleContactId(c.id));
      return [...samples, ...nonSamples];
    });
  }, []);

  const wipeAllData = useCallback(() => {
    setContacts([]);
    setSelectedContact(null);
    setIgnoredDuplicates(new Set());
    localStorage.removeItem('contacts_timeline_data');
    localStorage.removeItem('contacts_timeline_ignored_dupes');
  }, []);

  const syncDeviceContacts = useCallback(async () => {
    setIsSyncing(true);
    // Simulate smart incremental sync check
    await new Promise((res) => setTimeout(res, 800));
    setSettings((prev) => ({
      ...prev,
      lastSyncDate: `Hoy ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
    }));
    setIsSyncing(false);
  }, []);

  const exportBackupJSON = useCallback((): string => {
    const payload = {
      version: '1.0',
      app: 'Contacts Timeline AI',
      exportedAt: new Date().toISOString(),
      contacts,
      tags,
    };
    setSettings((prev) => ({ ...prev, lastBackupDate: new Date().toISOString() }));
    return JSON.stringify(payload, null, 2);
  }, [contacts, tags]);

  const restoreBackupJSON = useCallback((jsonStr: string): { success: boolean; count: number; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || !Array.isArray(parsed.contacts)) {
        return { success: false, count: 0, error: 'Formato de archivo de respaldo no válido.' };
      }
      setContacts(parsed.contacts);
      if (Array.isArray(parsed.tags)) {
        setTags(parsed.tags);
      }
      setSettings((prev) => ({
        ...prev,
        lastBackupDate: new Date().toISOString(),
      }));
      return { success: true, count: parsed.contacts.length };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Error al procesar JSON' };
    }
  }, []);

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        filteredContacts,
        tags,
        settings,
        filters,
        duplicates,
        selectedContact,
        isPinLocked,
        isSyncing,
        setSelectedContact,
        setFilters,
        updateSettings,
        setIsPinLocked,
        addContact,
        updateContact,
        deleteContact,
        toggleFavorite,
        importContacts,
        mergeDuplicates,
        ignoreDuplicate,
        addCustomTag,
        wipeAllData,
        deleteSampleContacts,
        loadSampleContacts,
        hasSampleContacts,
        syncDeviceContacts,
        exportBackupJSON,
        restoreBackupJSON,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within ContactsProvider');
  return ctx;
}

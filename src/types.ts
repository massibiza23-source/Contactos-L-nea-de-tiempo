export interface PhoneNumber {
  number: string;
  type: 'mobile' | 'home' | 'work' | 'other';
  normalized?: string;
  countryCode?: string;
  countryName?: string;
}

export interface EmailAddress {
  email: string;
  type: 'personal' | 'work' | 'other';
}

export interface ContactAddress {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

export type DateSource = 
  | 'native_created'      // Exact creation date from OS API
  | 'native_modified'     // Modification date as fallback
  | 'imported_at'         // Timestamp when imported to app
  | 'user_specified'      // Manually set by user
  | 'unavailable';        // No reliable creation date known

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  formattedAddress?: string;
  timestamp: string; // ISO string when location was captured
  placeName?: string; // e.g. "Ibiza centro", "Restaurante", "Oficina"
}

export interface Contact {
  id: string;
  name: string;
  lastName: string;
  phones: PhoneNumber[];
  emails: EmailAddress[];
  company?: string;
  jobTitle?: string;
  address?: ContactAddress;
  notes?: string;
  avatarUrl?: string;
  color?: string; // Hex or tailwind color for avatar
  tags: string[];
  favorite: boolean;
  
  // Date tracking & critical reliability requirement
  createdAt?: string;          // ISO string
  createdAtReliable: boolean;  // True if OS or user provided exact creation timestamp
  dateSource: DateSource;      // Clarifies where the date came from
  updatedAt?: string;          // ISO string of last modification
  lastContactedAt?: string;    // ISO string if interaction tracked
  importedAt: string;          // ISO string when loaded in app
  
  // Geolocation tracking: dónde y cuándo se guardó
  savedLocation?: GeoLocation;

  source: 'phone_sync' | 'vcf_import' | 'csv_import' | 'manual' | 'google_sync' | 'text_import';
  deviceContactId?: string;
}

export interface DuplicateCandidate {
  id: string;
  contactA: Contact;
  contactB: Contact;
  confidence: number; // 0.0 - 1.0
  reason: 'phone' | 'email' | 'name' | 'ai_detected';
  description: string;
  ignored?: boolean;
}

export type SortOption =
  | 'created_desc'      // Más recientes → más antiguos
  | 'created_asc'       // Más antiguos → más recientes
  | 'name_asc'          // Nombre A-Z
  | 'name_desc'         // Nombre Z-A
  | 'updated_desc'      // Última modificación
  | 'last_contact_desc';// Último contacto

export type DateFilterPreset =
  | 'all'
  | 'today'
  | '7days'
  | '30days'
  | 'this_year'
  | 'custom';

export interface FilterOptions {
  searchQuery: string;
  dateRange: DateFilterPreset;
  customStartDate?: string;
  customEndDate?: string;
  hasPhone: 'all' | 'yes' | 'no';
  hasEmail: 'all' | 'yes' | 'no';
  selectedTags: string[];
  city?: string;
  company?: string;
  onlyDuplicates?: boolean;
  onlyFavorites?: boolean;
  onlyRecentlyModified?: boolean;
  sortBy: SortOption;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  sortBy: SortOption;
  localOnlyGuarantee: boolean;
  allowAiFeatures: boolean;
  pinLockEnabled: boolean;
  pinCode?: string;
  lastBackupDate?: string;
  lastSyncDate?: string;
  onboardingCompleted: boolean;
  permissionsGranted: boolean;
}

export type AppTab = 
  | 'contacts' 
  | 'timeline' 
  | 'calendar' 
  | 'map'
  | 'stats' 
  | 'favorites' 
  | 'duplicates' 
  | 'settings';

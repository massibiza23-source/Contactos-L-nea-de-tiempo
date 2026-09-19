import { Contact, DateSource } from '../types';

const MONTH_NAMES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const MONTH_SHORT_ES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
];

/**
 * Returns formatted relative time in Spanish
 * e.g., "Guardado hace 2 horas", "Guardado ayer", "Guardado hace 5 días"
 */
export function formatRelativeTime(dateStr?: string, prefix: string = 'Guardado '): string {
  if (!dateStr) return 'Sin fecha disponible';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Fecha no válida';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return `${prefix}hace unos momentos`;
  }
  if (diffMin < 60) {
    return `${prefix}hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return `${prefix}hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  }
  if (diffDays === 1 || (diffHours < 48 && now.getDate() - date.getDate() === 1)) {
    return `${prefix}ayer`;
  }
  if (diffDays < 7) {
    return `${prefix}hace ${diffDays} días`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${prefix}hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }

  // Absolute date format
  const day = date.getDate();
  const month = MONTH_SHORT_ES[date.getMonth()];
  const year = date.getFullYear();
  return `${prefix}el ${day} ${month} ${year}`;
}

/**
 * Returns clean day badge: "18 SEPT", "29 AGO", etc.
 */
export function formatDayBadge(dateStr?: string): { day: string; month: string } {
  if (!dateStr) return { day: '--', month: 'S/F' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: '--', month: 'S/F' };

  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: MONTH_SHORT_ES[d.getMonth()] || '',
  };
}

/**
 * Returns formatted date string: "18/09/2026"
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'No disponible';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'No disponible';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Returns formatted date and time string: "18/09/2026 22:35"
 */
export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'No disponible';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'No disponible';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

/**
 * Groups contacts by Month & Year for timeline
 */
export interface TimelineGroup {
  key: string;            // e.g. "2026-09" or "no-date"
  title: string;          // e.g. "SEPTIEMBRE 2026" or "SIN FECHA ORIGINAL"
  subtitle?: string;
  isReliable: boolean;
  contacts: Contact[];
}

export function groupContactsForTimeline(contacts: Contact[]): TimelineGroup[] {
  const groupsMap = new Map<string, TimelineGroup>();

  contacts.forEach((contact) => {
    let key = 'no-date';
    let title = 'SIN FECHA DE CREACIÓN REGISTRADA';
    let isReliable = false;

    const dateToUse = contact.createdAt || (contact.dateSource !== 'unavailable' ? contact.updatedAt || contact.importedAt : undefined);

    if (dateToUse) {
      const d = new Date(dateToUse);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const monthIdx = d.getMonth();
        key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
        title = `${MONTH_NAMES_ES[monthIdx]} ${year}`;
        isReliable = contact.createdAtReliable;
      }
    }

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        key,
        title,
        isReliable,
        contacts: [],
      });
    }

    groupsMap.get(key)!.contacts.push(contact);
  });

  // Sort groups chronologically descending (with no-date at the bottom)
  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.key === 'no-date') return 1;
    if (b.key === 'no-date') return -1;
    return b.key.localeCompare(a.key);
  });
}

/**
 * Returns human-readable label and description for date source (CRITICAL PRIVACY & ACCURACY)
 */
export function getDateSourceDescription(source: DateSource, isReliable: boolean): {
  label: string;
  badgeColor: string;
  explanation: string;
} {
  switch (source) {
    case 'native_created':
      return {
        label: 'Fecha original OS',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        explanation: 'Fecha de creación certificada provista por el sistema operativo del teléfono.',
      };
    case 'native_modified':
      return {
        label: 'Última modificación',
        badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        explanation: 'La fecha de creación no estaba disponible en el SO; se muestra la última modificación real.',
      };
    case 'imported_at':
      return {
        label: 'Fecha de importación',
        badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
        explanation: 'Fecha en la que este contacto fue sincronizado o importado a la aplicación.',
      };
    case 'user_specified':
      return {
        label: 'Fijada manualmente',
        badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
        explanation: 'Fecha introducida directamente por el usuario en la ficha del contacto.',
      };
    case 'unavailable':
    default:
      return {
        label: 'Fecha no disponible',
        badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
        explanation: 'La fecha de creación original no está disponible para este contacto en el sistema.',
      };
  }
}

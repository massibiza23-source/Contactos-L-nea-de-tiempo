export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  prefix: string;
}

export const COUNTRY_PREFIXES: CountryInfo[] = [
  { code: 'ES', name: 'España', flag: '🇪🇸', prefix: '+34' },
  { code: 'US', name: 'Estados Unidos / Canadá', flag: '🇺🇸', prefix: '+1' },
  { code: 'MX', name: 'México', flag: '🇲🇽', prefix: '+52' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', prefix: '+54' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', prefix: '+55' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', prefix: '+57' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', prefix: '+56' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', prefix: '+51' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', prefix: '+44' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷', prefix: '+33' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪', prefix: '+49' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', prefix: '+39' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', prefix: '+351' },
  { code: 'CH', name: 'Suiza', flag: '🇨🇭', prefix: '+41' },
];

/**
 * Normalizes a phone string into a clean comparable format:
 * - Replaces leading '00' with '+'
 * - Strips whitespace, dashes, dots, parentheses
 */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Detects country prefix and country details
 */
export function detectCountry(phone: string): CountryInfo | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  // Check matching prefixes, sorted by longest prefix first
  const sorted = [...COUNTRY_PREFIXES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const c of sorted) {
    if (normalized.startsWith(c.prefix)) {
      return c;
    }
  }

  // If no '+' prefix and has 9 digits starting with 6, 7, 8, 9, default likely Spain (+34)
  if (!normalized.startsWith('+') && normalized.length === 9 && /^[6789]/.test(normalized)) {
    return COUNTRY_PREFIXES.find((c) => c.code === 'ES') || null;
  }

  return null;
}

/**
 * Formats a phone number for display (e.g. +34 600 123 456)
 */
export function formatPhoneDisplay(raw: string): string {
  const norm = normalizePhone(raw);
  if (!norm) return raw;

  if (norm.startsWith('+34') && norm.length === 12) {
    return `${norm.slice(0, 3)} ${norm.slice(3, 6)} ${norm.slice(6, 9)} ${norm.slice(9, 12)}`;
  }
  if (norm.length === 9 && /^[6789]/.test(norm)) {
    return `${norm.slice(0, 3)} ${norm.slice(3, 6)} ${norm.slice(6, 9)}`;
  }
  return raw;
}

/**
 * Checks if two phone numbers are equivalent:
 * e.g. "+34600123456" and "600 123 456" and "0034600123456"
 */
export function arePhonesEquivalent(phoneA: string, phoneB: string): boolean {
  const normA = normalizePhone(phoneA);
  const normB = normalizePhone(phoneB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Compare core digits without country prefixes
  const digitsA = normA.replace(/\D/g, '');
  const digitsB = normB.replace(/\D/g, '');

  if (digitsA === digitsB) return true;

  // Check if one has prefix 34 (Spain) and the other is just the 9-digit number
  if (digitsA.length === 9 && digitsB === `34${digitsA}`) return true;
  if (digitsB.length === 9 && digitsA === `34${digitsB}`) return true;

  // Check last 9 digits match if both have at least 9
  if (digitsA.length >= 9 && digitsB.length >= 9) {
    const lastA = digitsA.slice(-9);
    const lastB = digitsB.slice(-9);
    if (lastA === lastB && /^[6789]/.test(lastA)) {
      return true;
    }
  }

  return false;
}

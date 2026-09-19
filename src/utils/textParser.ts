import { Contact, PhoneNumber } from '../types';
import { normalizePhone, detectCountry } from './phoneUtils';

/**
 * Parses raw pasted text (lines of names, numbers, or notes)
 * Example input:
 * Carlos Pérez: +34 612 345 678
 * Laura Méndez, laura@example.com, +34 699 000 111
 * +34 654 987 321
 */
export function parsePastedNumbers(text: string, defaultEmail?: string): Partial<Contact>[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const contacts: Partial<Contact>[] = [];
  const trimmedDefaultEmail = defaultEmail?.trim();

  // Regex to detect phone numbers: international or local digits
  const phoneRegex = /(\+?\d[\d\s\-\(\)\.]{6,}\d)/g;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find emails
    const emailsFound = line.match(emailRegex) || [];
    let cleanLine = line;
    for (const em of emailsFound) {
      cleanLine = cleanLine.replace(em, ' ');
    }

    // Find phones
    const phonesFound = cleanLine.match(phoneRegex) || [];
    for (const ph of phonesFound) {
      cleanLine = cleanLine.replace(ph, ' ');
    }

    // Clean remaining name
    let name = cleanLine
      .replace(/[:;,|\-\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!name && phonesFound.length > 0 && phonesFound[0]) {
      name = `Contacto ${phonesFound[0].trim()}`;
    }

    const phones: PhoneNumber[] = phonesFound.map((raw) => {
      const norm = normalizePhone(raw);
      const country = detectCountry(norm);
      return {
        number: raw.trim(),
        type: 'mobile',
        normalized: norm,
        countryCode: country?.code,
        countryName: country?.name,
      };
    });

    const emailsToAssign = emailsFound.length > 0
      ? emailsFound.map((e) => ({ email: e, type: 'personal' as const }))
      : trimmedDefaultEmail
        ? [{ email: trimmedDefaultEmail, type: 'personal' as const }]
        : [];

    if (phones.length > 0 || emailsToAssign.length > 0 || name) {
      contacts.push({
        name: name || 'Contacto sin nombre',
        lastName: '',
        phones,
        emails: emailsToAssign,
        tags: ['Texto importado'],
        favorite: false,
        createdAt: new Date().toISOString(),
        createdAtReliable: false,
        dateSource: 'imported_at',
        updatedAt: new Date().toISOString(),
        importedAt: new Date().toISOString(),
        source: 'text_import',
      });
    }
  }

  return contacts;
}

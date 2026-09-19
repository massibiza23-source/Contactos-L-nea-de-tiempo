import { Contact } from '../types';

/**
 * Exports contacts to CSV string with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportToCSV(contacts: Contact[]): string {
  const headers = [
    'Nombre',
    'Apellidos',
    'Teléfonos',
    'Emails',
    'Empresa',
    'Cargo',
    'Ciudad',
    'País',
    'Etiquetas',
    'Fecha Creación',
    'Fiabilidad Fecha',
    'Última Modificación',
    'Notas',
  ];

  const escapeCSV = (val: string = '') => {
    const stringVal = String(val || '');
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const rows = contacts.map((c) => [
    escapeCSV(c.name),
    escapeCSV(c.lastName),
    escapeCSV(c.phones.map((p) => p.number).join('; ')),
    escapeCSV(c.emails.map((e) => e.email).join('; ')),
    escapeCSV(c.company),
    escapeCSV(c.jobTitle),
    escapeCSV(c.address?.city),
    escapeCSV(c.address?.country),
    escapeCSV(c.tags.join('; ')),
    escapeCSV(c.createdAt),
    escapeCSV(c.createdAtReliable ? 'Certificada' : 'No disponible'),
    escapeCSV(c.updatedAt),
    escapeCSV(c.notes),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return '\uFEFF' + csvContent; // UTF-8 BOM
}

/**
 * Parses CSV text into Contact array
 */
export function parseCSV(csvText: string): Partial<Contact>[] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const lines = cleanText.split(/\r\n|\r|\n/);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
  const contacts: Partial<Contact>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = row[idx] || '';
    });

    const name = rowObj['nombre'] || rowObj['name'] || rowObj['first name'] || row[0] || 'Sin nombre';
    const lastName = rowObj['apellidos'] || rowObj['last name'] || (row[1] !== undefined ? row[1] : '');
    const phoneRaw = rowObj['teléfonos'] || rowObj['telefono'] || rowObj['phones'] || rowObj['phone'] || (row[2] || '');
    const emailRaw = rowObj['emails'] || rowObj['email'] || (row[3] || '');
    const company = rowObj['empresa'] || rowObj['company'] || (row[4] || '');
    const jobTitle = rowObj['cargo'] || rowObj['title'] || (row[5] || '');
    const city = rowObj['ciudad'] || rowObj['city'] || (row[6] || '');
    const tagsRaw = rowObj['etiquetas'] || rowObj['tags'] || (row[8] || '');
    const createdAt = rowObj['fecha creación'] || rowObj['created'] || '';

    const phones = phoneRaw
      ? phoneRaw.split(';').map((p) => ({ number: p.trim(), type: 'mobile' as const }))
      : [];
    const emails = emailRaw
      ? emailRaw.split(';').map((e) => ({ email: e.trim(), type: 'personal' as const }))
      : [];
    const tags = tagsRaw
      ? tagsRaw.split(';').map((t) => t.trim()).filter(Boolean)
      : [];

    contacts.push({
      name,
      lastName,
      phones,
      emails,
      company,
      jobTitle,
      address: city ? { city } : undefined,
      tags,
      createdAt: createdAt || undefined,
      createdAtReliable: !!createdAt,
      dateSource: createdAt ? 'native_created' : 'unavailable',
      source: 'csv_import',
    });
  }

  return contacts;
}

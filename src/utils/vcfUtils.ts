import { Contact, PhoneNumber, EmailAddress } from '../types';

/**
 * Parses VCF vCard (2.1 / 3.0 / 4.0) content into Contact array
 */
export function parseVCF(vcfText: string): Partial<Contact>[] {
  const contacts: Partial<Contact>[] = [];
  const rawCards = vcfText.split(/END:VCARD/i);

  for (const rawCard of rawCards) {
    if (!rawCard.trim() || !rawCard.includes('BEGIN:VCARD')) continue;

    const lines = rawCard.replace(/\r\n /g, '').replace(/\n /g, '').split(/\r\n|\r|\n/);
    let fullName = '';
    let lastName = '';
    const phones: PhoneNumber[] = [];
    const emails: EmailAddress[] = [];
    let company = '';
    let jobTitle = '';
    let notes = '';
    let createdAt: string | undefined;
    let updatedAt: string | undefined;
    const tags: string[] = [];
    let city = '';
    let country = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('FN:') || trimmed.startsWith('FN;')) {
        const val = trimmed.split(/:(.+)/)[1] || '';
        fullName = val.trim();
      } else if (trimmed.startsWith('N:') || trimmed.startsWith('N;')) {
        const val = trimmed.split(/:(.+)/)[1] || '';
        const parts = val.split(';');
        if (parts[0]) lastName = parts[0].trim();
        if (parts[1] && !fullName) fullName = parts[1].trim();
      } else if (trimmed.startsWith('TEL')) {
        const val = trimmed.split(/:(.+)/)[1] || '';
        if (val) {
          const isWork = /WORK/i.test(trimmed);
          const isHome = /HOME/i.test(trimmed);
          phones.push({
            number: val.trim(),
            type: isWork ? 'work' : isHome ? 'home' : 'mobile',
          });
        }
      } else if (trimmed.startsWith('EMAIL')) {
        const val = trimmed.split(/:(.+)/)[1] || '';
        if (val) {
          const isWork = /WORK/i.test(trimmed);
          emails.push({
            email: val.trim(),
            type: isWork ? 'work' : 'personal',
          });
        }
      } else if (trimmed.startsWith('ORG:')) {
        company = (trimmed.split(/:(.+)/)[1] || '').split(';')[0]?.trim() || '';
      } else if (trimmed.startsWith('TITLE:')) {
        jobTitle = (trimmed.split(/:(.+)/)[1] || '').trim();
      } else if (trimmed.startsWith('NOTE:')) {
        notes = (trimmed.split(/:(.+)/)[1] || '').replace(/\\n/g, '\n').trim();
      } else if (trimmed.startsWith('CATEGORIES:')) {
        const val = trimmed.split(/:(.+)/)[1] || '';
        val.split(',').forEach((t) => {
          const clean = t.trim();
          if (clean && !tags.includes(clean)) tags.push(clean);
        });
      } else if (trimmed.startsWith('REV:') || trimmed.startsWith('X-REV:')) {
        const val = trimmed.split(/:(.+)/)[1] || '';
        try {
          const d = new Date(val);
          if (!isNaN(d.getTime())) updatedAt = d.toISOString();
        } catch {
          // Ignore parse errors
        }
      } else if (trimmed.startsWith('X-CREATED:') || trimmed.startsWith('CREATED:') || trimmed.startsWith('X-APPLE-CREATION-DATE:')) {
        const val = trimmed.split(/:(.+)/)[1] || '';
        try {
          const d = new Date(val);
          if (!isNaN(d.getTime())) createdAt = d.toISOString();
        } catch {
          // Ignore
        }
      } else if (trimmed.startsWith('ADR')) {
        const val = trimmed.split(/:(.+)/)[1] || '';
        const parts = val.split(';');
        if (parts[3]) city = parts[3].trim();
        if (parts[6]) country = parts[6].trim();
      }
    }

    if (fullName || phones.length > 0 || emails.length > 0) {
      contacts.push({
        name: fullName || 'Sin nombre',
        lastName,
        phones,
        emails,
        company,
        jobTitle,
        notes,
        tags,
        createdAt,
        createdAtReliable: !!createdAt,
        dateSource: createdAt ? 'native_created' : updatedAt ? 'native_modified' : 'unavailable',
        updatedAt,
        address: city || country ? { city, country } : undefined,
        source: 'vcf_import',
      });
    }
  }

  return contacts;
}

/**
 * Exports contacts into standard vCard 3.0 string
 */
export function exportToVCF(contacts: Contact[]): string {
  const cards: string[] = [];

  for (const c of contacts) {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${c.name} ${c.lastName || ''}`.trim(),
      `N:${c.lastName || ''};${c.name};;;`,
    ];

    if (c.company) lines.push(`ORG:${c.company}`);
    if (c.jobTitle) lines.push(`TITLE:${c.jobTitle}`);

    c.phones.forEach((p) => {
      const type = p.type ? p.type.toUpperCase() : 'CELL';
      lines.push(`TEL;TYPE=${type}:${p.number}`);
    });

    c.emails.forEach((e) => {
      const type = e.type ? e.type.toUpperCase() : 'INTERNET';
      lines.push(`EMAIL;TYPE=${type}:${e.email}`);
    });

    if (c.address) {
      lines.push(`ADR;TYPE=HOME:;;${c.address.street || ''};${c.address.city || ''};${c.address.region || ''};${c.address.postalCode || ''};${c.address.country || ''}`);
    }

    if (c.notes) {
      lines.push(`NOTE:${c.notes.replace(/\n/g, '\\n')}`);
    }

    if (c.tags && c.tags.length > 0) {
      lines.push(`CATEGORIES:${c.tags.join(',')}`);
    }

    if (c.createdAt) {
      lines.push(`X-CREATED:${c.createdAt}`);
    }
    if (c.updatedAt) {
      lines.push(`REV:${c.updatedAt}`);
    }

    lines.push('END:VCARD');
    cards.push(lines.join('\r\n'));
  }

  return cards.join('\r\n\r\n');
}

/**
 * Triggers browser download of file
 */
export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

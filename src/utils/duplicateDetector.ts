import { Contact, DuplicateCandidate } from '../types';
import { arePhonesEquivalent } from './phoneUtils';

/**
 * Normalizes text for fuzzy comparison (lowercase, removes diacritics / accents)
 */
function cleanString(str: string = ''): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Detects potential duplicate contacts across the contact database
 */
export function findDuplicates(contacts: Contact[], ignoredPairs: Set<string> = new Set()): DuplicateCandidate[] {
  const duplicates: DuplicateCandidate[] = [];

  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const a = contacts[i];
      const b = contacts[j];

      const pairKey = [a.id, b.id].sort().join(':::');
      if (ignoredPairs.has(pairKey)) continue;

      let matchReason: DuplicateCandidate['reason'] | null = null;
      let confidence = 0;
      const matchDetails: string[] = [];

      // 1. Phone match check
      let phoneMatched = false;
      for (const pa of a.phones) {
        for (const pb of b.phones) {
          if (arePhonesEquivalent(pa.number, pb.number)) {
            phoneMatched = true;
            matchDetails.push(`Mismo teléfono (${pa.number} ⬄ ${pb.number})`);
            break;
          }
        }
        if (phoneMatched) break;
      }

      // 2. Email match check
      let emailMatched = false;
      for (const ea of a.emails) {
        for (const eb of b.emails) {
          if (cleanString(ea.email) && cleanString(ea.email) === cleanString(eb.email)) {
            emailMatched = true;
            matchDetails.push(`Mismo correo electrónico (${ea.email})`);
            break;
          }
        }
        if (emailMatched) break;
      }

      // 3. Name check
      const fullNameA = cleanString(`${a.name} ${a.lastName || ''}`);
      const fullNameB = cleanString(`${b.name} ${b.lastName || ''}`);
      const sameName = fullNameA.length > 2 && fullNameA === fullNameB;

      if (phoneMatched && emailMatched) {
        matchReason = 'phone';
        confidence = 0.99;
      } else if (phoneMatched && sameName) {
        matchReason = 'phone';
        confidence = 0.95;
      } else if (phoneMatched) {
        matchReason = 'phone';
        confidence = 0.88;
      } else if (emailMatched && sameName) {
        matchReason = 'email';
        confidence = 0.92;
      } else if (emailMatched) {
        matchReason = 'email';
        confidence = 0.85;
      } else if (sameName && fullNameA.length > 5) {
        // Same company or same city adds weight
        const sameCompany = a.company && b.company && cleanString(a.company) === cleanString(b.company);
        if (sameCompany) {
          matchReason = 'name';
          confidence = 0.82;
          matchDetails.push(`Mismo nombre y misma empresa (${a.company})`);
        } else {
          matchReason = 'name';
          confidence = 0.75;
          matchDetails.push('Mismo nombre y apellidos exactos');
        }
      }

      if (matchReason && confidence >= 0.7) {
        duplicates.push({
          id: pairKey,
          contactA: a,
          contactB: b,
          confidence,
          reason: matchReason,
          description: matchDetails.join(' · '),
        });
      }
    }
  }

  // Sort by highest confidence first
  return duplicates.sort((x, y) => y.confidence - x.confidence);
}

/**
 * Merges two duplicate contacts into a unified contact:
 * - Unifies phone numbers (avoiding duplicates)
 * - Unifies emails
 * - Combines tags
 * - Preserves earliest creation date if reliable
 * - Joins notes if distinct
 */
export function mergeTwoContacts(primary: Contact, secondary: Contact): Contact {
  // Merge phones
  const mergedPhones = [...primary.phones];
  for (const sp of secondary.phones) {
    if (!mergedPhones.some((mp) => arePhonesEquivalent(mp.number, sp.number))) {
      mergedPhones.push(sp);
    }
  }

  // Merge emails
  const mergedEmails = [...primary.emails];
  for (const se of secondary.emails) {
    if (!mergedEmails.some((me) => cleanString(me.email) === cleanString(se.email))) {
      mergedEmails.push(se);
    }
  }

  // Merge tags
  const tagSet = new Set([...primary.tags, ...secondary.tags]);

  // Combine notes
  let mergedNotes = primary.notes || '';
  if (secondary.notes && secondary.notes !== primary.notes) {
    mergedNotes = mergedNotes ? `${mergedNotes}\n\n[Fusionado]: ${secondary.notes}` : secondary.notes;
  }

  // Determine earliest creation date
  let bestCreatedAt = primary.createdAt;
  let bestReliable = primary.createdAtReliable;
  let bestSource = primary.dateSource;

  if (secondary.createdAt && secondary.createdAtReliable) {
    if (!bestCreatedAt || !bestReliable || new Date(secondary.createdAt) < new Date(bestCreatedAt)) {
      bestCreatedAt = secondary.createdAt;
      bestReliable = true;
      bestSource = secondary.dateSource;
    }
  }

  return {
    ...primary,
    name: primary.name || secondary.name,
    lastName: primary.lastName || secondary.lastName,
    phones: mergedPhones,
    emails: mergedEmails,
    company: primary.company || secondary.company,
    jobTitle: primary.jobTitle || secondary.jobTitle,
    address: primary.address || secondary.address,
    notes: mergedNotes,
    tags: Array.from(tagSet),
    favorite: primary.favorite || secondary.favorite,
    createdAt: bestCreatedAt,
    createdAtReliable: bestReliable,
    dateSource: bestSource,
    updatedAt: new Date().toISOString(),
  };
}

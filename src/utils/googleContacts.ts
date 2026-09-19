import { Contact, PhoneNumber, EmailAddress } from '../types';
import { normalizePhone, detectCountry } from './phoneUtils';

// Google OAuth Client ID provisioned via set_up_oauth
const OAUTH_CLIENT_ID = '865289466712-94kcm7j1pgaqiacdeoefsiiuavikln5v.apps.googleusercontent.com';
const CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Ensures Google Identity Services (GSI) script is loaded
 */
export async function ensureGsiLoaded(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return;
  }

  return new Promise((resolve, reject) => {
    // Check if already in DOM
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar la librería de Google Identity')));
      // If already loaded
      if (window.google?.accounts?.oauth2) {
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Error al cargar Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Authenticates with Google OAuth and requests access token client-side
 */
export async function getGoogleAccessToken(): Promise<string> {
  await ensureGsiLoaded();

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services no está disponible en este navegador.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: CONTACTS_SCOPE,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('No se obtuvo token de autorización de Google.'));
          }
        },
      });

      // Request token via popup
      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(new Error(err?.message || 'Error al iniciar el cliente OAuth de Google.'));
    }
  });
}

/**
 * Fetches connections from Google People API with pagination
 */
export async function fetchGoogleContacts(
  onProgress?: (count: number, message: string) => void
): Promise<{ contacts: Partial<Contact>[]; total: number }> {
  onProgress?.(0, 'Solicitando autorización a tu cuenta de Google...');
  const token = await getGoogleAccessToken();

  onProgress?.(0, 'Conectado a Google Contacts. Descargando tus contactos reales...');

  const allConnections: any[] = [];
  let pageToken: string | undefined = undefined;
  let pageCount = 0;

  do {
    const url = new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.set(
      'personFields',
      'names,emailAddresses,phoneNumbers,photos,organizations,addresses,biographies,metadata'
    );
    url.searchParams.set('pageSize', '500');
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const msg = errorJson?.error?.message || `Error HTTP ${response.status}`;
      throw new Error(`Google People API: ${msg}`);
    }

    const data = await response.json();
    const connections = data.connections || [];
    allConnections.push(...connections);
    pageToken = data.nextPageToken;
    pageCount++;

    onProgress?.(allConnections.length, `Recibidos ${allConnections.length} contactos de Google...`);

    // Safety limit to avoid infinite loop
    if (pageCount > 15) break;
  } while (pageToken);

  // Convert raw Google People data into App Contacts
  const mapped: Partial<Contact>[] = allConnections.map((person) => {
    // Name
    const nameObj = person.names?.[0];
    const displayName = nameObj?.displayName || '';
    const givenName = nameObj?.givenName || '';
    const familyName = nameObj?.familyName || '';
    const finalName = displayName || [givenName, familyName].filter(Boolean).join(' ') || 'Sin nombre';

    // Phones
    const phones: PhoneNumber[] = (person.phoneNumbers || []).map((p: any) => {
      const rawNum = p.value || '';
      const norm = normalizePhone(rawNum);
      const country = detectCountry(norm);
      let phoneType: 'mobile' | 'home' | 'work' | 'other' = 'mobile';
      const rawType = (p.type || '').toLowerCase();
      if (rawType.includes('work') || rawType.includes('trabajo')) phoneType = 'work';
      else if (rawType.includes('home') || rawType.includes('casa')) phoneType = 'home';
      else if (rawType.includes('mobile') || rawType.includes('móvil') || rawType.includes('celular')) phoneType = 'mobile';
      else phoneType = 'other';

      return {
        number: rawNum,
        type: phoneType,
        normalized: norm,
        countryCode: country?.code,
        countryName: country?.name,
      };
    });

    // Emails
    const emails: EmailAddress[] = (person.emailAddresses || []).map((e: any) => {
      const rawType = (e.type || '').toLowerCase();
      let emailType: 'personal' | 'work' | 'other' = 'personal';
      if (rawType.includes('work') || rawType.includes('trabajo')) emailType = 'work';
      else if (rawType.includes('home') || rawType.includes('personal')) emailType = 'personal';
      else emailType = 'other';

      return {
        email: e.value || '',
        type: emailType,
      };
    });

    // Photos
    const photo = person.photos?.find((ph: any) => !ph.default) || person.photos?.[0];
    const avatarUrl = photo?.url && !photo.default ? photo.url : undefined;

    // Organization / Job
    const org = person.organizations?.[0];
    const company = org?.name || undefined;
    const jobTitle = org?.title || undefined;

    // Address
    const addr = person.addresses?.[0];
    const address = addr
      ? {
          street: addr.streetAddress || addr.formattedValue,
          city: addr.city,
          region: addr.region,
          country: addr.country,
          postalCode: addr.postalCode,
        }
      : undefined;

    // Notes
    const notes = person.biographies?.[0]?.value || undefined;

    // Creation / Modification date extraction
    // Google People API metadata often provides updateTime in sources
    let createdAt: string | undefined = undefined;
    let createdAtReliable = false;
    let dateSource: Contact['dateSource'] = 'imported_at';

    const contactSource = person.metadata?.sources?.find((s: any) => s.type === 'CONTACT' && s.updateTime);
    if (contactSource?.updateTime) {
      createdAt = contactSource.updateTime;
      createdAtReliable = true;
      dateSource = 'native_modified';
    } else {
      // Fallback to current time marked as imported_at
      createdAt = new Date().toISOString();
      createdAtReliable = false;
      dateSource = 'imported_at';
    }

    return {
      name: finalName,
      lastName: familyName,
      phones,
      emails,
      company,
      jobTitle,
      address,
      notes,
      avatarUrl,
      tags: ['Google'],
      favorite: false,
      createdAt,
      createdAtReliable,
      dateSource,
      updatedAt: contactSource?.updateTime || new Date().toISOString(),
      importedAt: new Date().toISOString(),
      source: 'google_sync',
      deviceContactId: person.resourceName,
    };
  });

  return {
    contacts: mapped,
    total: mapped.length,
  };
}

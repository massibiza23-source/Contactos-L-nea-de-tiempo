import { Contact } from '../types';
import { normalizePhone } from './phoneUtils';

export interface DeviceImportResult {
  supported: boolean;
  contacts: Partial<Contact>[];
  message?: string;
}

/**
 * Checks if the browser natively supports the Web Contact Picker API
 */
export function isContactPickerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;
}

/**
 * Attempts to select contacts using the native Web Contact Picker API (Chrome on Android)
 */
export async function pickDeviceContacts(): Promise<DeviceImportResult> {
  if (!isContactPickerSupported()) {
    return {
      supported: false,
      contacts: [],
      message: 'La API nativa de selección de contactos no está disponible en este navegador o sistema operativo.',
    };
  }

  try {
    const props = ['name', 'email', 'tel', 'address', 'icon'];
    // @ts-ignore
    const rawContacts = await navigator.contacts.select(props, { multiple: true });

    const parsed: Partial<Contact>[] = rawContacts.map((c: any) => {
      const nameParts = (c.name?.[0] || 'Contacto').split(' ');
      const firstName = nameParts[0] || 'Contacto';
      const lastName = nameParts.slice(1).join(' ');

      return {
        name: firstName,
        lastName,
        phones: (c.tel || []).map((t: string) => ({ number: t, type: 'mobile' })),
        emails: (c.email || []).map((e: string) => ({ email: e, type: 'personal' })),
        tags: ['Teléfono'],
        createdAtReliable: false, // Web Contact Picker API does NOT expose creation timestamps
        dateSource: 'unavailable',
        source: 'phone_sync',
      };
    });

    return {
      supported: true,
      contacts: parsed,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { supported: true, contacts: [], message: 'Selección cancelada por el usuario.' };
    }
    return { supported: false, contacts: [], message: err.message };
  }
}

/**
 * Checks if a given contact ID belongs to the preloaded sample contacts
 */
export function isSampleContactId(id: string): boolean {
  return /^c-(0[1-9]|1[0-4])$/.test(id);
}

/**
 * Empty by default so the user's address book starts clean without example contacts.
 */
export function getInitialSampleContacts(): Contact[] {
  return [];
}

/**
 * Optional sample contacts for testing or demo purposes if the user desires.
 */
export function getSampleDemoContacts(): Contact[] {
  const now = new Date('2026-09-18T13:37:18.000Z');
  const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();
  const sep15 = new Date('2026-09-15T11:20:00.000Z').toISOString();
  const sep10 = new Date('2026-09-10T09:45:00.000Z').toISOString();
  const sep02 = new Date('2026-09-02T16:15:00.000Z').toISOString();
  const aug29 = new Date('2026-08-29T18:00:00.000Z').toISOString();
  const aug20 = new Date('2026-08-20T14:30:00.000Z').toISOString();
  const aug05 = new Date('2026-08-05T10:00:00.000Z').toISOString();
  const jul14 = new Date('2026-07-14T08:20:00.000Z').toISOString();
  const jun18 = new Date('2026-06-18T17:40:00.000Z').toISOString();
  const may12 = new Date('2026-05-12T12:00:00.000Z').toISOString();
  const jan10 = new Date('2026-01-10T15:30:00.000Z').toISOString();
  const year2025 = new Date('2025-11-20T11:00:00.000Z').toISOString();

  return [
    {
      id: 'c-01',
      name: 'María',
      lastName: 'García',
      phones: [{ number: '+34 612 345 678', type: 'mobile', normalized: '+34612345678', countryCode: 'ES', countryName: 'España' }],
      emails: [{ email: 'maria.garcia@techibiza.com', type: 'work' }],
      company: 'Tech Ibiza Solutions',
      jobTitle: 'Directora de Operaciones',
      address: { city: 'Ibiza', region: 'Islas Baleares', country: 'España' },
      notes: 'Conocida en el evento tecnológico de Playa d’en Bossa. Interesada en consultoría de IA.',
      tags: ['Trabajo', 'Clientes', 'España'],
      color: '#10b981', // green
      favorite: true,
      createdAt: twoHoursAgo,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: twoHoursAgo,
      importedAt: now.toISOString(),
      savedLocation: {
        latitude: 38.8856,
        longitude: 1.4055,
        city: 'Ibiza',
        region: 'Islas Baleares',
        country: 'España',
        countryCode: 'ES',
        placeName: 'Playa d’en Bossa (Evento Tech)',
        formattedAddress: 'Playa d’en Bossa, 07817 Sant Jordi de ses Salines, Illes Balears',
        timestamp: twoHoursAgo,
        accuracy: 12,
      },
      source: 'phone_sync',
    },
    {
      id: 'c-02',
      name: 'Juan',
      lastName: 'Pérez',
      phones: [{ number: '+34 600 123 456', type: 'mobile', normalized: '+34600123456', countryCode: 'ES', countryName: 'España' }],
      emails: [{ email: 'juan.perez@madridcloud.es', type: 'personal' }],
      company: 'Madrid Cloud Corp',
      jobTitle: 'Arquitecto Cloud',
      address: { city: 'Madrid', region: 'Comunidad de Madrid', country: 'España' },
      notes: 'Amigo de la universidad. Reunión prevista para noviembre.',
      tags: ['Amigos', 'Trabajo', 'España'],
      color: '#3b82f6', // blue
      favorite: true,
      createdAt: yesterday,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: yesterday,
      importedAt: now.toISOString(),
      savedLocation: {
        latitude: 40.4168,
        longitude: -3.7038,
        city: 'Madrid',
        region: 'Comunidad de Madrid',
        country: 'España',
        countryCode: 'ES',
        placeName: 'Café Gran Vía',
        formattedAddress: 'Gran Vía 32, 28013 Madrid, España',
        timestamp: yesterday,
        accuracy: 18,
      },
      source: 'phone_sync',
    },
    {
      id: 'c-03',
      name: 'Juan',
      lastName: 'Perez', // Duplicate variant
      phones: [{ number: '600123456', type: 'mobile', normalized: '+34600123456', countryCode: 'ES', countryName: 'España' }],
      emails: [{ email: 'juan.perez@madridcloud.es', type: 'work' }],
      company: 'Madrid Cloud',
      jobTitle: 'Cloud Architect',
      address: { city: 'Madrid', country: 'España' },
      notes: 'Contacto duplicado guardado de una tarjeta de visita rápida.',
      tags: ['Trabajo'],
      color: '#3b82f6',
      favorite: false,
      createdAt: twoDaysAgo,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: twoDaysAgo,
      importedAt: now.toISOString(),
      savedLocation: {
        latitude: 40.4531,
        longitude: -3.6883,
        city: 'Madrid',
        region: 'Comunidad de Madrid',
        country: 'España',
        countryCode: 'ES',
        placeName: 'Torres KIO / Chamartín',
        formattedAddress: 'Paseo de la Castellana 216, Madrid',
        timestamp: twoDaysAgo,
        accuracy: 25,
      },
      source: 'vcf_import',
    },
    {
      id: 'c-04',
      name: 'Ana',
      lastName: 'Oliveira',
      phones: [{ number: '+55 11 98765-4321', type: 'mobile', normalized: '+5511987654321', countryCode: 'BR', countryName: 'Brasil' }],
      emails: [{ email: 'ana.oliveira@sao-paulo.br', type: 'personal' }],
      company: 'Design Studio Paulista',
      jobTitle: 'Lead Product Designer',
      address: { city: 'São Paulo', region: 'SP', country: 'Brasil' },
      notes: 'Colaboradora en proyectos de identidad visual y diseño UX móvil.',
      tags: ['Brasil', 'Trabajo', 'Viajes'],
      color: '#a855f7', // purple
      favorite: true,
      createdAt: aug29,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: aug29,
      importedAt: now.toISOString(),
      savedLocation: {
        latitude: -23.5615,
        longitude: -46.6559,
        city: 'São Paulo',
        region: 'SP',
        country: 'Brasil',
        countryCode: 'BR',
        placeName: 'Avenida Paulista (Design Conf)',
        formattedAddress: 'Av. Paulista 1578, Bela Vista, São Paulo',
        timestamp: aug29,
        accuracy: 15,
      },
      source: 'phone_sync',
    },
    {
      id: 'c-05',
      name: 'Carlos',
      lastName: 'Martínez Ibiza',
      phones: [{ number: '+34 689 443 211', type: 'mobile', normalized: '+34689443211', countryCode: 'ES', countryName: 'España' }],
      emails: [{ email: 'carlos@ibizarestaurantes.com', type: 'work' }],
      company: 'Restaurante Sa Caleta',
      jobTitle: 'Gerente y Sumiller',
      address: { city: 'Ibiza', region: 'Islas Baleares', country: 'España' },
      notes: 'Reservas y eventos gastronómicos en Cala d’Hort y Santa Eulària.',
      tags: ['Restaurantes', 'Proveedores', 'España'],
      color: '#f59e0b', // amber
      favorite: false,
      createdAt: sep15,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: sep15,
      importedAt: now.toISOString(),
      savedLocation: {
        latitude: 38.8689,
        longitude: 1.3325,
        city: 'Sant Josep',
        region: 'Islas Baleares',
        country: 'España',
        countryCode: 'ES',
        placeName: 'Restaurante Sa Caleta',
        formattedAddress: 'Platja Sa Caleta, 07830 Sant Josep de sa Talaia, Ibiza',
        timestamp: sep15,
        accuracy: 10,
      },
      source: 'phone_sync',
    },
    {
      id: 'c-06',
      name: 'Elena',
      lastName: 'Rios',
      phones: [{ number: '+34 655 778 990', type: 'mobile', normalized: '+34655778990', countryCode: 'ES', countryName: 'España' }],
      emails: [{ email: 'elena.rios@ibizavillas.com', type: 'work' }],
      company: 'Ibiza Luxury Retreats',
      jobTitle: 'Hospitality Manager',
      address: { city: 'Ibiza', country: 'España' },
      notes: 'Gestora de alquileres vacacionales y retiros de bienestar.',
      tags: ['Clientes', 'Viajes', 'España'],
      color: '#ec4899', // pink
      favorite: false,
      createdAt: sep10,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: sep10,
      importedAt: now.toISOString(),
      savedLocation: {
        latitude: 38.9845,
        longitude: 1.5341,
        city: 'Santa Eulària',
        region: 'Islas Baleares',
        country: 'España',
        countryCode: 'ES',
        placeName: 'Marina Santa Eulària',
        formattedAddress: 'Port Esportiu de Santa Eulària, 07840 Ibiza',
        timestamp: sep10,
        accuracy: 14,
      },
      source: 'phone_sync',
    },
    {
      id: 'c-07',
      name: 'Doctor',
      lastName: 'Sánchez Hospital',
      phones: [{ number: '+34 971 360 000', type: 'work', normalized: '+34971360000', countryCode: 'ES', countryName: 'España' }],
      emails: [], // Contact without email
      company: 'Hospital Can Misses',
      jobTitle: 'Medicina General',
      address: { city: 'Ibiza', country: 'España' },
      notes: 'Cita médica anual y chequeos.',
      tags: ['Otros', 'España'],
      color: '#06b6d4', // cyan
      favorite: false,
      createdAt: sep02,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: sep02,
      importedAt: now.toISOString(),
      source: 'phone_sync',
    },
    {
      id: 'c-08',
      name: 'Sofía',
      lastName: 'Mendoza',
      phones: [], // Contact without phone!
      emails: [{ email: 'sofia.mendoza@agenciaweb.mx', type: 'work' }],
      company: 'Creativos Digitales MX',
      jobTitle: 'Copywriter & Content strategist',
      address: { city: 'Ciudad de México', country: 'México' },
      notes: 'Contacto solo por correo para redacción de contenidos.',
      tags: ['Trabajo', 'Clientes'],
      color: '#8b5cf6',
      favorite: false,
      createdAt: aug20,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: aug20,
      importedAt: now.toISOString(),
      source: 'csv_import',
    },
    {
      id: 'c-09',
      name: 'Restaurante',
      lastName: 'Es Xarcu',
      phones: [{ number: '0034 971 187 867', type: 'work', normalized: '+34971187867', countryCode: 'ES', countryName: 'España' }],
      emails: [{ email: 'reservas@esxarcu.com', type: 'work' }],
      company: 'Es Xarcu Ibiza',
      jobTitle: 'Atención al Cliente',
      address: { city: 'Porroig, Ibiza', country: 'España' },
      notes: 'Excelente pescado fresco al horno frente a la bahía de Porroig.',
      tags: ['Restaurantes', 'España'],
      color: '#eab308',
      favorite: true,
      // CRITICAL: Contact where OS did NOT provide reliable creation date!
      createdAt: undefined,
      createdAtReliable: false,
      dateSource: 'unavailable',
      updatedAt: aug05,
      importedAt: now.toISOString(),
      source: 'phone_sync',
    },
    {
      id: 'c-10',
      name: 'Familia',
      lastName: 'Tía Carmen',
      phones: [{ number: '+34 670 998 877', type: 'mobile', normalized: '+34670998877', countryCode: 'ES', countryName: 'España' }],
      emails: [],
      company: '',
      jobTitle: '',
      address: { city: 'Valencia', country: 'España' },
      notes: 'Cumpleaños el 14 de julio. Llamar siempre por WhatsApp los domingos.',
      tags: ['Familia', 'España'],
      color: '#ef4444', // red
      favorite: true,
      createdAt: jul14,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: jul14,
      importedAt: now.toISOString(),
      source: 'phone_sync',
    },
    {
      id: 'c-11',
      name: 'Lucas',
      lastName: 'Ferrari',
      phones: [{ number: '+54 11 4455-6677', type: 'mobile', normalized: '+541144556677', countryCode: 'AR', countryName: 'Argentina' }],
      emails: [{ email: 'lucas.ferrari@palermo-dev.com.ar', type: 'work' }],
      company: 'Palermo Software Lab',
      jobTitle: 'Frontend Engineer',
      address: { city: 'Buenos Aires', country: 'Argentina' },
      notes: 'Colaborador open-source en bibliotecas TypeScript.',
      tags: ['Trabajo', 'Amigos'],
      color: '#14b8a6', // teal
      favorite: false,
      createdAt: jun18,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: jun18,
      importedAt: now.toISOString(),
      source: 'phone_sync',
    },
    {
      id: 'c-12',
      name: 'Proveedor',
      lastName: 'Café & Vinos Ibiza',
      phones: [{ number: '+34 971 310 120', type: 'work', normalized: '+34971310120', countryCode: 'ES', countryName: 'España' }],
      emails: [{ email: 'pedidos@cafevinos-baleares.es', type: 'work' }],
      company: 'Distribuciones Gourmet Baleares',
      jobTitle: 'Departamento de Pedidos',
      address: { city: 'Ibiza', country: 'España' },
      notes: 'Entregas los martes y jueves por la mañana.',
      tags: ['Proveedores', 'España'],
      color: '#84cc16', // lime
      favorite: false,
      createdAt: may12,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: may12,
      importedAt: now.toISOString(),
      source: 'vcf_import',
    },
    {
      id: 'c-13',
      name: 'Laura',
      lastName: 'Gómez',
      phones: [{ number: '+34 633 445 566', type: 'mobile', normalized: '+34633445566', countryCode: 'ES', countryName: 'España' }],
      emails: [{ email: 'laura.gomez@barcelonadesign.cat', type: 'personal' }],
      company: 'Gràcia Architecture',
      jobTitle: 'Arquitecta Principal',
      address: { city: 'Barcelona', country: 'España' },
      notes: 'Proyecto de reforma integral y diseño interior minimalista.',
      tags: ['Clientes', 'Trabajo', 'España'],
      color: '#6366f1', // indigo
      favorite: false,
      createdAt: jan10,
      createdAtReliable: true,
      dateSource: 'native_created',
      updatedAt: jan10,
      importedAt: now.toISOString(),
      source: 'phone_sync',
    },
    {
      id: 'c-14',
      name: 'Antiguo',
      lastName: 'Contacto SIM',
      phones: [{ number: '+34 610 000 111', type: 'mobile', normalized: '+34610000111', countryCode: 'ES', countryName: 'España' }],
      emails: [],
      notes: 'Contacto recuperado de tarjeta SIM antigua. La SIM no almacena fechas de creación.',
      tags: ['Otros'],
      color: '#64748b', // slate
      favorite: false,
      // Another example of Rule 20: NO reliable creation date in SIM cards
      createdAt: undefined,
      createdAtReliable: false,
      dateSource: 'unavailable',
      updatedAt: year2025,
      importedAt: now.toISOString(),
      source: 'phone_sync',
    },
  ];
}

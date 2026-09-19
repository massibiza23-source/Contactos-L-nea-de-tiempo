import { GeoLocation } from '../types';

/**
 * Common locations fallback lookup for quick offline geocoding
 */
const KNOWN_LOCATIONS = [
  { name: 'Ibiza', region: 'Illes Balears', country: 'España', lat: 38.9067, lon: 1.4206 },
  { name: 'Madrid', region: 'Comunidad de Madrid', country: 'España', lat: 40.4168, lon: -3.7038 },
  { name: 'Barcelona', region: 'Cataluña', country: 'España', lat: 41.3879, lon: 2.1699 },
  { name: 'Valencia', region: 'Comunitat Valenciana', country: 'España', lat: 39.4699, lon: -0.3763 },
  { name: 'Sevilla', region: 'Andalucía', country: 'España', lat: 37.3891, lon: -5.9845 },
  { name: 'Palma de Mallorca', region: 'Illes Balears', country: 'España', lat: 39.5696, lon: 2.6502 },
  { name: 'Buenos Aires', region: 'CABA', country: 'Argentina', lat: -34.6037, lon: -58.3816 },
  { name: 'Ciudad de México', region: 'CDMX', country: 'México', lat: 19.4326, lon: -99.1332 },
  { name: 'Bogotá', region: 'Cundinamarca', country: 'Colombia', lat: 4.7110, lon: -74.0721 },
  { name: 'Miami', region: 'Florida', country: 'Estados Unidos', lat: 25.7617, lon: -80.1918 },
  { name: 'Londres', region: 'Greater London', country: 'Reino Unido', lat: 51.5074, lon: -0.1278 },
  { name: 'Roma', region: 'Lacio', country: 'Italia', lat: 41.9028, lon: 12.4964 },
  { name: 'París', region: 'Île-de-France', country: 'Francia', lat: 48.8566, lon: 2.3522 },
];

/**
 * Reverse geocodes latitude and longitude using Nominatim OpenStreetMap with local fallback
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<{
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  formattedAddress?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'es,en',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.island ||
        addr.suburb ||
        '';
      const region = addr.state || addr.province || addr.county || '';
      const country = addr.country || '';
      const countryCode = addr.country_code ? addr.country_code.toUpperCase() : '';

      const parts = [city, region, country].filter(Boolean);
      return {
        city,
        region,
        country,
        countryCode,
        formattedAddress: parts.join(', ') || data.display_name || '',
      };
    }
  } catch {
    // Ignore network error and continue with local distance check
  }

  // Fallback to nearest known city if within ~40km
  for (const loc of KNOWN_LOCATIONS) {
    const dLat = Math.abs(loc.lat - latitude);
    const dLon = Math.abs(loc.lon - longitude);
    if (dLat < 0.35 && dLon < 0.35) {
      return {
        city: loc.name,
        region: loc.region,
        country: loc.country,
        formattedAddress: `${loc.name}, ${loc.region}, ${loc.country}`,
      };
    }
  }

  return {
    formattedAddress: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
  };
}

/**
 * Request device's current location via HTML5 Geolocation API
 */
export async function getCurrentGeoLocation(): Promise<GeoLocation> {
  if (!navigator.geolocation) {
    throw new Error('La geolocalización no es compatible con este navegador.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date(position.timestamp || Date.now()).toISOString();

        try {
          const geoDetails = await reverseGeocode(latitude, longitude);
          resolve({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            city: geoDetails.city,
            region: geoDetails.region,
            country: geoDetails.country,
            countryCode: geoDetails.countryCode,
            formattedAddress: geoDetails.formattedAddress,
            timestamp,
          });
        } catch {
          resolve({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            timestamp,
            formattedAddress: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
          });
        }
      },
      (error) => {
        let msg = 'No se pudo obtener la ubicación actual.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso de ubicación denegado por el usuario o navegador.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Información de ubicación no disponible en el dispositivo.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Tiempo de espera agotado al consultar el GPS.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Formats a clean human-readable label for a saved location
 */
export function formatGeoLabel(geo?: GeoLocation): string {
  if (!geo) return 'Ubicación no guardada';
  if (geo.placeName) return geo.placeName;
  if (geo.city && geo.country) return `${geo.city}, ${geo.country}`;
  if (geo.city) return geo.city;
  if (geo.formattedAddress) return geo.formattedAddress;
  return `${geo.latitude.toFixed(4)}°, ${geo.longitude.toFixed(4)}°`;
}

/**
 * Returns formatted coordinates
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'O';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

/**
 * Generates an external Google Maps link
 */
export function getGoogleMapsUrl(geo: GeoLocation): string {
  return `https://www.google.com/maps/search/?api=1&query=${geo.latitude},${geo.longitude}`;
}

/**
 * Generates OpenStreetMap embed iframe URL for interactive viewing
 */
export function getOpenStreetMapEmbedUrl(
  geoOrLat: GeoLocation | number,
  zoomOrLon: number = 14,
  optionalZoom: number = 14
): string {
  let lat: number;
  let lon: number;

  if (typeof geoOrLat === 'number') {
    lat = geoOrLat;
    lon = zoomOrLon;
  } else {
    lat = geoOrLat.latitude;
    lon = geoOrLat.longitude;
  }

  const delta = 0.012;
  const left = lon - delta;
  const right = lon + delta;
  const bottom = lat - delta * 0.7;
  const top = lat + delta * 0.7;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

/**
 * Common quick locations list for manual selection
 */
export function getQuickLocationPresets(): { name: string; region: string; country: string; lat: number; lon: number }[] {
  return KNOWN_LOCATIONS;
}

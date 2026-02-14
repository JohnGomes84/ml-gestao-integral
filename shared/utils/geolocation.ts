/**
 * Geolocation utilities for calculating distances and validating check-ins
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate if check-in location is within acceptable range
 * @param checkInCoords Check-in coordinates
 * @param workLocationCoords Work location coordinates
 * @param maxDistanceMeters Maximum acceptable distance (default: 500m)
 * @returns Object with validation result and distance
 */
export function validateCheckInLocation(
  checkInCoords: Coordinates,
  workLocationCoords: Coordinates,
  maxDistanceMeters: number = 500
): { isValid: boolean; distance: number; message: string } {
  const distance = calculateDistance(checkInCoords, workLocationCoords);
  
  if (distance <= maxDistanceMeters) {
    return {
      isValid: true,
      distance,
      message: `Check-in válido (${Math.round(distance)}m do local)`,
    };
  }
  
  return {
    isValid: false,
    distance,
    message: `⚠️ Check-in suspeito: ${Math.round(distance)}m do local (máximo: ${maxDistanceMeters}m)`,
  };
}

/**
 * Get current user location from browser
 * @returns Promise with coordinates or error
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não suportada pelo navegador"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let message = "Erro ao obter localização";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Permissão de localização negada";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Localização indisponível";
            break;
          case error.TIMEOUT:
            message = "Tempo esgotado ao obter localização";
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Format coordinates as string for storage
 * @param coords Coordinates object
 * @returns Formatted string "lat,long"
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.latitude.toFixed(7)},${coords.longitude.toFixed(7)}`;
}

/**
 * Parse coordinates from string
 * @param coordString String in format "lat,long"
 * @returns Coordinates object or null if invalid
 */
export function parseCoordinates(coordString: string | null): Coordinates | null {
  if (!coordString) return null;
  
  const [lat, long] = coordString.split(',').map(Number);
  if (isNaN(lat) || isNaN(long)) return null;
  
  return { latitude: lat, longitude: long };
}

/**
 * Fetch address and geolocation from CEP using BrasilAPI v2
 * @param cep CEP to lookup (with or without formatting)
 * @returns Address data with coordinates
 */
export async function fetchCEPWithGeolocation(cep: string): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
}> {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }

  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCEP}`);
  
  if (!response.ok) {
    throw new Error('CEP não encontrado');
  }

  const data = await response.json();
  
  return {
    street: data.street || '',
    neighborhood: data.neighborhood || '',
    city: data.city || '',
    state: data.state || '',
    zipCode: data.cep || '',
    latitude: data.location?.coordinates?.latitude || null,
    longitude: data.location?.coordinates?.longitude || null,
  };
}

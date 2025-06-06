import { format } from 'date-fns';
import { calculatePace } from './calculations';

interface ParsedRunData {
  date: string;
  distance: number;
  duration: number;
  pace: number;
  route?: string;
  notes?: string;
  feeling_rating: number;
}

// Parse TCX (Training Center XML) files
const parseTCX = (content: string): ParsedRunData | null => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML format');
    }

    const activity = xmlDoc.querySelector('Activity');
    if (!activity) {
      throw new Error('No activity found in TCX file');
    }

    // Get activity date - try both attribute and element approaches
    let startTime = activity.getAttribute('Id');
    if (!startTime) {
      const idElement = activity.querySelector('Id');
      startTime = idElement?.textContent || null;
    }
    
    if (!startTime) {
      throw new Error('No start time found');
    }

    // Parse laps to get total distance and time
    const laps = xmlDoc.querySelectorAll('Lap');
    let totalDistance = 0;
    let totalTime = 0;

    laps.forEach(lap => {
      const distanceElement = lap.querySelector('DistanceMeters');
      const timeElement = lap.querySelector('TotalTimeSeconds');
      
      if (distanceElement && timeElement) {
        totalDistance += parseFloat(distanceElement.textContent || '0');
        totalTime += parseFloat(timeElement.textContent || '0');
      }
    });

    // Convert meters to miles and seconds to minutes
    const distanceInMiles = totalDistance * 0.000621371;
    const durationInMinutes = totalTime / 60;

    if (distanceInMiles === 0 || durationInMinutes === 0) {
      throw new Error('Invalid distance or duration data');
    }

    // Get sport type for notes
    const sport = activity.getAttribute('Sport') || 'Running';
    
    // Extract track points for route name (simplified)
    const trackPoints = xmlDoc.querySelectorAll('Trackpoint');
    const routeNote = trackPoints.length > 0 ? `Imported from Garmin (${trackPoints.length} GPS points)` : undefined;

    return {
      date: format(new Date(startTime), 'yyyy-MM-dd'),
      distance: Math.round(distanceInMiles * 100) / 100,
      duration: Math.round(durationInMinutes * 100) / 100,
      pace: calculatePace(distanceInMiles, durationInMinutes),
      route: routeNote,
      notes: `Imported from TCX file - Sport: ${sport}`,
      feeling_rating: 3 // Default to average feeling
    };
  } catch (error) {
    console.error('Error parsing TCX:', error);
    return null;
  }
};

// Parse GPX (GPS Exchange Format) files
const parseGPX = (content: string): ParsedRunData | null => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML format');
    }

    const track = xmlDoc.querySelector('trk');
    if (!track) {
      throw new Error('No track found in GPX file');
    }

    const trackPoints = xmlDoc.querySelectorAll('trkpt');
    if (trackPoints.length < 2) {
      throw new Error('Insufficient track points for analysis');
    }

    // Get start and end times
    const firstPoint = trackPoints[0];
    const lastPoint = trackPoints[trackPoints.length - 1];
    
    const startTimeElement = firstPoint.querySelector('time');
    const endTimeElement = lastPoint.querySelector('time');
    
    if (!startTimeElement || !endTimeElement) {
      throw new Error('No time data found in track points');
    }

    const startTime = new Date(startTimeElement.textContent || '');
    const endTime = new Date(endTimeElement.textContent || '');
    
    // Calculate duration in minutes
    const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    // Calculate distance using Haversine formula
    let totalDistance = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      const prevPoint = trackPoints[i - 1];
      const currPoint = trackPoints[i];
      
      const lat1 = parseFloat(prevPoint.getAttribute('lat') || '0');
      const lon1 = parseFloat(prevPoint.getAttribute('lon') || '0');
      const lat2 = parseFloat(currPoint.getAttribute('lat') || '0');
      const lon2 = parseFloat(currPoint.getAttribute('lon') || '0');
      
      totalDistance += haversineDistance(lat1, lon1, lat2, lon2);
    }

    const distanceInMiles = totalDistance * 0.621371; // Convert km to miles

    if (distanceInMiles === 0 || durationInMinutes === 0) {
      throw new Error('Invalid distance or duration data');
    }

    // Get track name if available
    const trackName = track.querySelector('name')?.textContent;
    const routeNote = trackName || `Imported from Garmin (${trackPoints.length} GPS points)`;

    return {
      date: format(startTime, 'yyyy-MM-dd'),
      distance: Math.round(distanceInMiles * 100) / 100,
      duration: Math.round(durationInMinutes * 100) / 100,
      pace: calculatePace(distanceInMiles, durationInMinutes),
      route: routeNote,
      notes: 'Imported from GPX file',
      feeling_rating: 3 // Default to average feeling
    };
  } catch (error) {
    console.error('Error parsing GPX:', error);
    return null;
  }
};

// Haversine formula to calculate distance between two GPS points
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Parse FIT files (simplified - FIT files are binary and complex)
const parseFIT = (content: string): ParsedRunData | null => {
  // FIT files are binary format and require specialized parsing
  // For now, we'll return null and suggest using TCX/GPX export instead
  console.warn('FIT file parsing not yet implemented. Please export as TCX or GPX from Garmin Connect.');
  return null;
};

// Main parser function
export const parseGarminFile = async (content: string, fileType: string): Promise<ParsedRunData | null> => {
  switch (fileType.toLowerCase()) {
    case 'tcx':
      return parseTCX(content);
    case 'gpx':
      return parseGPX(content);
    case 'fit':
      return parseFIT(content);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

// Utility function to detect file type from content
export const detectFileType = (content: string): string | null => {
  const trimmedContent = content.trim();
  
  if (trimmedContent.includes('<TrainingCenterDatabase') || trimmedContent.includes('<tcx:')) {
    return 'tcx';
  }
  
  if (trimmedContent.includes('<gpx') || trimmedContent.includes('<?xml') && trimmedContent.includes('<trk')) {
    return 'gpx';
  }
  
  // FIT files are binary, so string content won't match
  return null;
};
import { format, parse } from 'date-fns';
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

// Parse CSV files with multiple runs
const parseCSVFile = (content: string): ParsedRunData[] | null => {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const runs: ParsedRunData[] = [];

    // Find required column indices
    const dateIndex = findColumnIndex(headers, ['Date', 'date']);
    const distanceIndex = findColumnIndex(headers, ['Distance', 'distance']);
    const timeIndex = findColumnIndex(headers, ['Time', 'time', 'Moving Time', 'Elapsed Time']);
    const activityTypeIndex = findColumnIndex(headers, ['Activity Type', 'activity type', 'Sport', 'sport']);
    const titleIndex = findColumnIndex(headers, ['Title', 'title', 'Name', 'name']);
    const paceIndex = findColumnIndex(headers, ['Avg Pace', 'avg pace', 'Average Pace', 'pace']);

    if (dateIndex === -1 || distanceIndex === -1 || timeIndex === -1) {
      throw new Error('CSV must contain Date, Distance, and Time columns');
    }

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        if (values.length < Math.max(dateIndex, distanceIndex, timeIndex) + 1) {
          continue; // Skip incomplete rows
        }

        // Filter for running activities only
        const activityType = activityTypeIndex !== -1 ? values[activityTypeIndex]?.toLowerCase() : '';
        if (activityType && !activityType.includes('run') && !activityType.includes('jog')) {
          continue; // Skip non-running activities
        }

        const dateStr = values[dateIndex];
        const distanceStr = values[distanceIndex];
        const timeStr = values[timeIndex];

        if (!dateStr || !distanceStr || !timeStr) {
          continue; // Skip rows with missing essential data
        }

        // Parse date (handle various formats)
        let parsedDate: Date;
        try {
          // Try common date formats
          if (dateStr.includes('/')) {
            parsedDate = parse(dateStr, 'M/d/yyyy', new Date());
          } else if (dateStr.includes('-')) {
            parsedDate = new Date(dateStr);
          } else {
            parsedDate = new Date(dateStr);
          }
          
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch {
          continue; // Skip rows with invalid dates
        }

        // Parse distance (remove units and convert to miles)
        let distance = parseFloat(distanceStr.replace(/[^\d.-]/g, ''));
        if (isNaN(distance) || distance <= 0) {
          continue; // Skip invalid distances
        }

        // Convert km to miles if needed (assume km if distance > 50 for a single run)
        if (distance > 50) {
          distance = distance * 0.621371;
        }

        // Parse time (handle various formats: HH:MM:SS, MM:SS, or decimal minutes)
        let durationInMinutes: number;
        if (timeStr.includes(':')) {
          const timeParts = timeStr.split(':').map(p => parseInt(p.replace(/[^\d]/g, '')));
          if (timeParts.length === 3) {
            // HH:MM:SS
            durationInMinutes = timeParts[0] * 60 + timeParts[1] + timeParts[2] / 60;
          } else if (timeParts.length === 2) {
            // MM:SS
            durationInMinutes = timeParts[0] + timeParts[1] / 60;
          } else {
            continue; // Skip invalid time format
          }
        } else {
          // Assume decimal minutes
          durationInMinutes = parseFloat(timeStr.replace(/[^\d.-]/g, ''));
        }

        if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
          continue; // Skip invalid durations
        }

        // Get additional data
        const title = titleIndex !== -1 ? values[titleIndex] : '';
        const route = title || 'Imported from CSV';
        
        // Calculate or use provided pace
        let pace: number;
        if (paceIndex !== -1 && values[paceIndex]) {
          const paceStr = values[paceIndex];
          if (paceStr.includes(':')) {
            const [min, sec] = paceStr.split(':').map(p => parseInt(p.replace(/[^\d]/g, '')));
            pace = min + sec / 60;
          } else {
            pace = parseFloat(paceStr.replace(/[^\d.-]/g, ''));
          }
        } else {
          pace = calculatePace(distance, durationInMinutes);
        }

        runs.push({
          date: format(parsedDate, 'yyyy-MM-dd'),
          distance: Math.round(distance * 100) / 100,
          duration: Math.round(durationInMinutes * 100) / 100,
          pace: Math.round(pace * 100) / 100,
          route,
          notes: 'Imported from CSV file',
          feeling_rating: 3 // Default to average feeling
        });
      } catch (error) {
        console.warn(`Skipping row ${i + 1}:`, error);
        continue; // Skip problematic rows
      }
    }

    return runs.length > 0 ? runs : null;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return null;
  }
};

// Helper function to find column index by multiple possible names
const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
    if (index !== -1) return index;
  }
  return -1;
};

// Helper function to parse CSV line handling quoted values
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

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

// Main parser function for single files
export const parseGarminFile = async (content: string, fileType: string): Promise<ParsedRunData | null> => {
  switch (fileType.toLowerCase()) {
    case 'tcx':
      return parseTCX(content);
    case 'gpx':
      return parseGPX(content);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

// Export CSV parser for multiple runs
export { parseCSVFile };

// Utility function to detect file type from content
export const detectFileType = (content: string) => {
  const trimmedContent = content.trim();
  
  if (trimmedContent.includes('<TrainingCenterDatabase') || trimmedContent.includes('<tcx:')) {
    return 'tcx';
  }
  
  if (trimmedContent.includes('<gpx') || trimmedContent.includes('<?xml') && trimmedContent.includes('<trk')) {
    return 'gpx';
  }
  
  // Check for CSV by looking for common headers
  const firstLine = trimmedContent.split('\n')[0].toLowerCase();
  if (firstLine.includes('activity type') || firstLine.includes('date') || firstLine.includes('distance')) {
    return 'csv';
  }
};
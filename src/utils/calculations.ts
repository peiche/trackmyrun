import { Run } from '../types';
import { format, parseISO, isThisWeek, isThisMonth, isThisYear } from 'date-fns';

// Calculate pace from distance and duration
export const calculatePace = (distance: number, duration: number): number => {
  if (distance === 0) return 0;
  return duration / distance;
};

// Format pace as MM:SS
export const formatPace = (pace: number): string => {
  if (pace === 0) return '--:--';
  
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format duration as HH:MM:SS or MM:SS
export const formatDuration = (duration: number): string => {
  if (duration === 0) return '--:--';
  
  const hours = Math.floor(duration / 60);
  const minutes = Math.floor(duration % 60);
  const seconds = Math.round((duration - Math.floor(duration)) * 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Calculate total distance
export const calculateTotalDistance = (runs: Run[]): number => {
  return parseFloat(runs.reduce((sum, run) => sum + run.distance, 0).toFixed(2));
};

// Calculate average pace
export const calculateAveragePace = (runs: Run[]): number => {
  if (runs.length === 0) return 0;
  
  const totalDistance = calculateTotalDistance(runs);
  if (totalDistance === 0) return 0;
  
  const totalDuration = runs.reduce((sum, run) => sum + run.duration, 0);
  return parseFloat((totalDuration / totalDistance).toFixed(2));
};

// Filter runs by time period
export const getRunsByPeriod = (runs: Run[], period: 'week' | 'month' | 'year' | 'all'): Run[] => {
  if (period === 'all') return runs;
  
  return runs.filter(run => {
    const date = parseISO(run.date);
    
    switch (period) {
      case 'week':
        return isThisWeek(date);
      case 'month':
        return isThisMonth(date);
      case 'year':
        return isThisYear(date);
      default:
        return true;
    }
  });
};

// Get longest run
export const getLongestRun = (runs: Run[]): Run | null => {
  if (runs.length === 0) return null;
  
  return runs.reduce((longest, run) => 
    run.distance > longest.distance ? run : longest, runs[0]);
};

// Get fastest run (lowest pace) for distances over 1 mile
export const getFastestRun = (runs: Run[]): Run | null => {
  const validRuns = runs.filter(run => run.distance >= 1);
  if (validRuns.length === 0) return null;
  
  return validRuns.reduce((fastest, run) => 
    run.pace < fastest.pace ? run : fastest, validRuns[0]);
};

// Format date in a readable format
export const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM d, yyyy');
};
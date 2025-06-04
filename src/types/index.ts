export interface Run {
  id: string;
  date: string;
  distance: number; // in miles
  duration: number; // in minutes
  pace: number; // in minutes per mile
  route?: string;
  notes?: string;
  feelingRating: number; // 1-5 scale
}

export interface Goal {
  id: string;
  name: string;
  targetDate: string;
  targetDistance?: number;
  targetPace?: number;
  completed: boolean;
  description?: string;
}

export interface WeeklyStats {
  week: string;
  totalMiles: number;
  avgPace: number;
  runCount: number;
}

export interface MonthlyStats {
  month: string;
  totalMiles: number;
  avgPace: number;
  runCount: number;
}
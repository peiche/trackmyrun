export interface Run {
  id: string;
  user_id: string;
  date: string;
  distance: number; // in miles
  duration: number; // in minutes
  pace: number; // in minutes per mile
  route?: string;
  notes?: string;
  feeling_rating: number; // 1-5 scale
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_date: string;
  target_distance?: number;
  target_pace?: number;
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
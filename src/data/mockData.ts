import { Run, Goal, WeeklyStats, MonthlyStats } from '../types';
import { subDays, format, startOfWeek, subWeeks, subMonths } from 'date-fns';

// Generate mock runs for the past 3 months
const generateMockRuns = (): Run[] => {
  const runs: Run[] = [];
  const startDate = subDays(new Date(), 90);
  const today = new Date();
  let currentDate = today;
  
  // Create a run every 2-3 days until we reach the start date
  while (currentDate >= startDate) {
    const distance = 3 + Math.random() * 7; // Between 3 and 10 miles
    const duration = distance * (8 + Math.random() * 4); // Pace between 8-12 min/mile
    const pace = duration / distance;
    
    runs.push({
      id: `run-${runs.length}`,
      date: format(currentDate, 'yyyy-MM-dd'),
      distance: parseFloat(distance.toFixed(2)),
      duration: parseFloat(duration.toFixed(2)),
      pace: parseFloat(pace.toFixed(2)),
      route: Math.random() > 0.3 ? `Route ${runs.length % 5 + 1}` : undefined,
      notes: Math.random() > 0.5 ? `Run ${runs.length} notes` : undefined,
      feelingRating: Math.ceil(Math.random() * 5)
    });

    // Move back 2-3 days
    currentDate = subDays(currentDate, 2 + Math.floor(Math.random() * 2));
  }
  
  return runs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate mock goals
const generateMockGoals = (): Goal[] => {
  return [
    {
      id: 'goal-1',
      name: 'Complete 10K Race',
      targetDate: format(subDays(new Date(), -30), 'yyyy-MM-dd'),
      targetDistance: 6.2,
      targetPace: 9,
      completed: false,
      description: 'First 10K race of the season'
    },
    {
      id: 'goal-2',
      name: 'Weekly Mileage Goal',
      targetDate: format(subDays(new Date(), -14), 'yyyy-MM-dd'),
      targetDistance: 20,
      completed: false,
      description: 'Hit 20 miles in a single week'
    },
    {
      id: 'goal-3',
      name: 'Half Marathon',
      targetDate: format(subDays(new Date(), -90), 'yyyy-MM-dd'),
      targetDistance: 13.1,
      targetPace: 10,
      completed: true,
      description: 'Complete my first half marathon'
    }
  ];
};

// Generate weekly stats
const generateWeeklyStats = (): WeeklyStats[] => {
  const stats: WeeklyStats[] = [];
  
  for (let i = 0; i < 12; i++) {
    const weekStart = startOfWeek(subWeeks(new Date(), i));
    const totalMiles = 10 + Math.random() * 15;
    const runCount = 3 + Math.floor(Math.random() * 3);
    
    stats.push({
      week: format(weekStart, 'MMM d'),
      totalMiles: parseFloat(totalMiles.toFixed(2)),
      avgPace: parseFloat((totalMiles / runCount + 7).toFixed(2)),
      runCount
    });
  }
  
  return stats.reverse();
};

// Generate monthly stats
const generateMonthlyStats = (): MonthlyStats[] => {
  const stats: MonthlyStats[] = [];
  
  for (let i = 0; i < 6; i++) {
    const month = subMonths(new Date(), i);
    const totalMiles = 40 + Math.random() * 30;
    const runCount = 12 + Math.floor(Math.random() * 5);
    
    stats.push({
      month: format(month, 'MMM yyyy'),
      totalMiles: parseFloat(totalMiles.toFixed(2)),
      avgPace: parseFloat((totalMiles / runCount + 7).toFixed(2)),
      runCount
    });
  }
  
  return stats.reverse();
};

export const mockRuns = generateMockRuns();
export const mockGoals = generateMockGoals();
export const weeklyStats = generateWeeklyStats();
export const monthlyStats = generateMonthlyStats();
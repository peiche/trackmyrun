import { Goal, Run } from '../types';
import { calculateTotalDistance, calculateAveragePace, getFastestRun } from './calculations';
import { isAfter, parseISO } from 'date-fns';

export interface GoalProgress {
  isCompleted: boolean;
  isAchieved: boolean;
  isDateReached: boolean;
  distanceProgress?: number;
  paceProgress?: number;
  message: string;
}

/**
 * Check if a goal should be automatically completed using hybrid logic
 * Hybrid completion requires BOTH achievement AND date criteria to be met
 */
export const checkGoalCompletion = (goal: Goal, runs: Run[]): GoalProgress => {
  const today = new Date();
  const targetDate = parseISO(goal.target_date);
  const isDateReached = isAfter(today, targetDate) || today.toDateString() === targetDate.toDateString();
  
  // If goal is already manually completed, return current status
  if (goal.completed) {
    return {
      isCompleted: true,
      isAchieved: true,
      isDateReached,
      message: 'Goal completed'
    };
  }

  let isAchieved = false;
  let distanceProgress: number | undefined;
  let paceProgress: number | undefined;
  let achievementMessage = '';

  // Check distance goal achievement
  if (goal.target_distance) {
    const totalDistance = calculateTotalDistance(runs);
    distanceProgress = (totalDistance / goal.target_distance) * 100;
    
    if (totalDistance >= goal.target_distance) {
      isAchieved = true;
      achievementMessage = `Distance goal achieved: ${totalDistance.toFixed(1)}/${goal.target_distance} miles`;
    } else {
      achievementMessage = `Distance progress: ${totalDistance.toFixed(1)}/${goal.target_distance} miles (${distanceProgress.toFixed(1)}%)`;
    }
  }

  // Check pace goal achievement
  if (goal.target_pace) {
    const fastestRun = getFastestRun(runs);
    
    if (fastestRun && fastestRun.pace <= goal.target_pace) {
      isAchieved = true;
      paceProgress = 100;
      achievementMessage = `Pace goal achieved: ${fastestRun.pace.toFixed(2)} min/mile (target: ${goal.target_pace.toFixed(2)})`;
    } else {
      const bestPace = fastestRun ? fastestRun.pace : 0;
      paceProgress = bestPace > 0 ? Math.max(0, (goal.target_pace / bestPace) * 100) : 0;
      achievementMessage = `Best pace: ${bestPace > 0 ? bestPace.toFixed(2) : 'N/A'} min/mile (target: ${goal.target_pace.toFixed(2)})`;
    }
  }

  // Check combined distance AND pace goals
  if (goal.target_distance && goal.target_pace) {
    const totalDistance = calculateTotalDistance(runs);
    const fastestRun = getFastestRun(runs);
    
    const distanceAchieved = totalDistance >= goal.target_distance;
    const paceAchieved = fastestRun && fastestRun.pace <= goal.target_pace;
    
    isAchieved = distanceAchieved && paceAchieved;
    
    if (isAchieved) {
      achievementMessage = `Both distance and pace goals achieved!`;
    } else if (distanceAchieved) {
      achievementMessage = `Distance achieved, pace goal remaining`;
    } else if (paceAchieved) {
      achievementMessage = `Pace achieved, distance goal remaining`;
    } else {
      achievementMessage = `Working towards both distance and pace goals`;
    }
  }

  // Hybrid completion: requires BOTH achievement AND date
  const shouldAutoComplete = isAchieved && isDateReached;

  let message = achievementMessage;
  if (shouldAutoComplete) {
    message = `🎉 Goal automatically completed! ${achievementMessage}`;
  } else if (isAchieved && !isDateReached) {
    message = `✅ Goal achieved! Will auto-complete on ${goal.target_date}`;
  } else if (!isAchieved && isDateReached) {
    message = `⏰ Target date reached. ${achievementMessage}`;
  }

  return {
    isCompleted: shouldAutoComplete,
    isAchieved,
    isDateReached,
    distanceProgress,
    paceProgress,
    message
  };
};

/**
 * Check all goals for automatic completion and return goals that should be updated
 */
export const checkAllGoalsForCompletion = (goals: Goal[], runs: Run[]): Goal[] => {
  const goalsToUpdate: Goal[] = [];

  for (const goal of goals) {
    const progress = checkGoalCompletion(goal, runs);
    
    // Only update if the goal should be completed but isn't already
    if (progress.isCompleted && !goal.completed) {
      goalsToUpdate.push({
        ...goal,
        completed: true
      });
    }
  }

  return goalsToUpdate;
};

/**
 * Get progress summary for a goal
 */
export const getGoalProgressSummary = (goal: Goal, runs: Run[]): string => {
  const progress = checkGoalCompletion(goal, runs);
  return progress.message;
};

/**
 * Get progress percentage for display
 */
export const getGoalProgressPercentage = (goal: Goal, runs: Run[]): number => {
  const progress = checkGoalCompletion(goal, runs);
  
  if (progress.isCompleted) return 100;
  
  // For distance goals, return distance progress
  if (goal.target_distance && progress.distanceProgress !== undefined) {
    return Math.min(100, progress.distanceProgress);
  }
  
  // For pace goals, return pace progress
  if (goal.target_pace && progress.paceProgress !== undefined) {
    return Math.min(100, progress.paceProgress);
  }
  
  // For combined goals, return average of both
  if (goal.target_distance && goal.target_pace && 
      progress.distanceProgress !== undefined && progress.paceProgress !== undefined) {
    return Math.min(100, (progress.distanceProgress + progress.paceProgress) / 2);
  }
  
  return 0;
};
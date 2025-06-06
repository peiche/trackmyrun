import { Goal, Run } from '../types';
import { calculateTotalDistance, getFastestRun } from './calculations';
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

    isAchieved = distanceAchieved && !!paceAchieved;

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
    message = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-party-popper-icon lucide-party-popper"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg> 
      Goal automatically completed! ${achievementMessage}
    `;
  } else if (isAchieved && !isDateReached) {
    message = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-big-icon lucide-square-check-big"><path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344"/><path d="m9 11 3 3L22 4"/></svg> 
      Goal achieved! Will auto-complete on ${goal.target_date}
    `;
  } else if (!isAchieved && isDateReached) {
    message = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-timer-icon lucide-timer"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>
      Target date reached. ${achievementMessage}
    `;
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